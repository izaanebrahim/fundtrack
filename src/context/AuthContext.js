'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // Only show loading on the client side initially to prevent SSR hangs
  const [loading, setLoading] = useState(typeof window !== 'undefined');
  const [profileError, setProfileError] = useState(null);

  const fetchProfile = async (userId, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.message && error.message.includes('Lock broken') && retries > 0) {
          console.warn(`Lock broken error, retrying fetchProfile... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(userId, retries - 1);
        }
        console.error('Profile fetch error:', error);
        setProfileError(error.message);
        return null;
      }
      setProfileError(null);
      return data;
    } catch (err) {
      if (err.message && err.message.includes('Lock broken') && retries > 0) {
        console.warn(`Lock broken exception, retrying fetchProfile... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile(userId, retries - 1);
      }
      console.error('Profile fetch exception:', err);
      setProfileError(err.message);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // 1. SAFETY TIMER: Absolute fallback to ensure the app never stays stuck
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth Safety Timer triggered - forcing loading to false');
        setLoading(false);
      }
    }, 2000);

    // 2. INITIALIZATION
    let subscription = null;
    
    try {
      const result = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;
          console.log('Auth Event:', event);
          
          try {
            // Only fetch profile on initial load or fresh login
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              clearTimeout(safetyTimer);
              
              if (session?.user) {
                setUser(session.user);
                // SET LOADING FALSE IMMEDIATELY - Don't wait for profile
                if (isMounted) setLoading(false);
                
                // Fetch profile in background
                fetchProfile(session.user.id).then(profileData => {
                  if (isMounted) setProfile(profileData);
                }).catch(err => {
                  console.error('Background profile fetch error:', err);
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
                setUser(null);
                setProfile(null);
                setLoading(false);
              }
            }
          } catch (innerErr) {
            console.error('Inner Auth Error:', innerErr);
            if (isMounted) setLoading(false);
          }
        }
      );
      subscription = result.data?.subscription;
    } catch (err) {
      console.error('Critical Auth Initialization Error:', err);
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
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
