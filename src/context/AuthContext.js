'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// 4 hours in milliseconds
const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const SESSION_START_KEY = 'fundtrack-session-start';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const logoutTimerRef = useRef(null);

  // Force sign out and clean up session timestamp
  const forceLogout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_START_KEY);
    }
    clearTimeout(logoutTimerRef.current);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // If signOut fails, clear state manually
      if (process.env.NODE_ENV === 'development') {
        console.error('Force logout error:', err);
      }
    }
    setUser(null);
    setProfile(null);
  }, []);

  // Start or resume the auto-logout timer
  const startSessionTimer = useCallback(() => {
    // Clear any existing timer
    clearTimeout(logoutTimerRef.current);

    const sessionStart = window.localStorage.getItem(SESSION_START_KEY);
    if (!sessionStart) return;

    const elapsed = Date.now() - Number(sessionStart);
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      // Session already expired
      forceLogout();
      return;
    }

    // Set timer for the remaining duration
    logoutTimerRef.current = setTimeout(() => {
      forceLogout();
    }, remaining);
  }, [forceLogout]);

  // Record a new session start time
  const recordSessionStart = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Only set if not already set (preserves the original login time across refreshes)
      if (!window.localStorage.getItem(SESSION_START_KEY)) {
        window.localStorage.setItem(SESSION_START_KEY, String(Date.now()));
      }
    }
  }, []);

  const fetchProfile = async (userId, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.message && error.message.includes('Lock broken') && retries > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Lock broken error, retrying fetchProfile... (${retries} retries left)`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(userId, retries - 1);
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Profile fetch error:', error);
        }
        setProfileError(error.message);
        return null;
      }
      setProfileError(null);
      return data;
    } catch (err) {
      if (err.message && err.message.includes('Lock broken') && retries > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Lock broken exception, retrying fetchProfile... (${retries} retries left)`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile(userId, retries - 1);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Profile fetch exception:', err);
      }
      setProfileError(err.message);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // 1. SAFETY TIMER: Absolute fallback to ensure the app never stays stuck
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Auth Safety Timer triggered - forcing loading to false');
        }
        setLoading(false);
      }
    }, 2000);

    // 2. INITIALIZATION
    let subscription = null;
    
    try {
      const result = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;
          if (process.env.NODE_ENV === 'development') {
            console.log('Auth Event:', event);
          }
          
          try {
            // Only fetch profile on initial load or fresh login
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              clearTimeout(safetyTimer);
              
              if (session?.user) {
                // Check if existing session has expired (handles page refresh)
                const sessionStart = window.localStorage.getItem(SESSION_START_KEY);
                if (sessionStart) {
                  const elapsed = Date.now() - Number(sessionStart);
                  if (elapsed >= SESSION_TIMEOUT_MS) {
                    // Session expired — sign out immediately
                    if (isMounted) setLoading(false);
                    forceLogout();
                    return;
                  }
                }

                setUser(session.user);
                // SET LOADING FALSE IMMEDIATELY - Don't wait for profile
                if (isMounted) setLoading(false);

                // Record session start time and start the countdown timer
                if (event === 'SIGNED_IN') {
                  // Fresh login — reset the session start time
                  window.localStorage.setItem(SESSION_START_KEY, String(Date.now()));
                } else {
                  // INITIAL_SESSION (page reload) — keep existing timestamp
                  recordSessionStart();
                }
                startSessionTimer();
                
                // Fetch profile in background
                fetchProfile(session.user.id).then(profileData => {
                  if (isMounted) setProfile(profileData);
                }).catch(err => {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Background profile fetch error:', err);
                  }
                });
              } else {
                if (isMounted) {
                  setUser(null);
                  setProfile(null);
                  setLoading(false);
                }
              }
            } else if (event === 'TOKEN_REFRESHED') {
              if (session?.user && isMounted) {
                setUser(session.user);
              }
            } else if (event === 'SIGNED_OUT') {
              if (isMounted) {
                window.localStorage.removeItem(SESSION_START_KEY);
                clearTimeout(logoutTimerRef.current);
                setUser(null);
                setProfile(null);
                setLoading(false);
              }
            }
          } catch (innerErr) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Inner Auth Error:', innerErr);
            }
            if (isMounted) setLoading(false);
          }
        }
      );
      subscription = result.data?.subscription;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Critical Auth Initialization Error:', err);
      }
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      clearTimeout(logoutTimerRef.current);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
