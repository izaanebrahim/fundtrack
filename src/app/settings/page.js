'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Settings() {
  const { profile, user } = useAuth();
  
  // Profile State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Status Messages
  const [status, setStatus] = useState({ text: '', type: '' });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  if (!profile) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setStatus({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('clients')
        .update({ name, phone })
        .eq('id', profile.id);

      if (error) throw error;
      setStatus({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setStatus({ text: error.message, type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setStatus({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setStatus({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus({ text: error.message, type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
          <SettingsIcon className="mr-3 text-indigo-400" />
          Account Settings
        </h1>
      </div>

      {status.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800' : 'bg-red-950/40 text-red-300 border border-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-800 bg-gray-900/50">
             <h2 className="text-lg font-semibold text-white flex items-center">
               <User className="w-5 h-5 mr-3 text-indigo-400" />
               Profile Information
             </h2>
             <p className="text-xs text-gray-400 mt-1">Manage your personal details and contact info.</p>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-600 mt-1">Email cannot be changed online for security.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password Change */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-800 bg-gray-900/50">
             <h2 className="text-lg font-semibold text-white flex items-center">
               <Lock className="w-5 h-5 mr-3 text-emerald-400" />
               Security Settings
             </h2>
             <p className="text-xs text-gray-400 mt-1">Update your password to keep your account safe.</p>
          </div>
          
          <form onSubmit={handleChangePassword} className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-mono"
              />
            </div>

            <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
               <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Password Requirements</h4>
               <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                    At least 6 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                    Passwords must match
                  </li>
               </ul>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
