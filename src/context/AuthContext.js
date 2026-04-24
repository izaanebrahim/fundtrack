'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth Event:', event);
        
        // Only fetch profile on initial load or fresh login to prevent lock conflicts during background token refreshes
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Just update the user session, do NOT re-fetch profile data
          if (session?.user) {
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
