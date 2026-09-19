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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8]">Account Settings</h1>
        <p className="text-[#7E8D91] text-sm font-medium mt-1">Manage your profile and security preferences</p>
      </div>

      {status.text && (
        <div className={`bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-4 flex items-center gap-3 text-sm font-bold ${
          status.type === 'success' ? 'text-[#12C98B] border-[#12C98B]/20' : 'text-red-400 border-red-500/20'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5">
             <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center gap-3">
               <User className="w-4 h-4 text-[#12C98B]" />
               Profile Information
             </h2>
             <p className="text-xs text-[#7E8D91] font-medium mt-2">Manage your personal details and contact info.</p>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-[10px] font-black text-[#7E8D91] mb-2 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] placeholder-gray-600 focus:outline-none focus:border-[#12C98B]/50 transition-all text-sm"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-[#7E8D91] mb-2 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-4 py-3 bg-black/10 border border-white/5 rounded-xl text-[#7E8D91] cursor-not-allowed text-sm"
              />
              <p className="text-[10px] text-[#7E8D91] mt-1 font-medium">Email cannot be changed for security reasons.</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-[#7E8D91] mb-2 uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] placeholder-gray-600 focus:outline-none focus:border-[#12C98B]/50 transition-all text-sm"
              />
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black rounded-xl transition-all shadow-lg shadow-[#12C98B]/20 disabled:opacity-50 flex items-center justify-center text-sm uppercase tracking-widest"
              >
                {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password Change */}
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5">
             <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center gap-3">
               <Lock className="w-4 h-4 text-[#12C98B]" />
               Security Settings
             </h2>
             <p className="text-xs text-[#7E8D91] font-medium mt-2">Update your password to keep your account safe.</p>
          </div>
          
          <form onSubmit={handleChangePassword} className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-[10px] font-black text-[#7E8D91] mb-2 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] placeholder-gray-600 focus:outline-none focus:border-[#12C98B]/50 transition-all text-sm font-mono"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-[#7E8D91] mb-2 uppercase tracking-widest">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] placeholder-gray-600 focus:outline-none focus:border-[#12C98B]/50 transition-all text-sm font-mono"
              />
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
               <h4 className="text-[10px] uppercase font-black text-[#7E8D91] tracking-widest mb-2">Requirements</h4>
               <ul className="text-xs text-[#7E8D91] space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-[#12C98B]' : 'bg-gray-700'}`}></div>
                    At least 6 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-[#12C98B]' : 'bg-gray-700'}`}></div>
                    Passwords must match
                  </li>
               </ul>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black rounded-xl transition-all shadow-lg shadow-[#12C98B]/20 disabled:opacity-50 flex items-center justify-center text-sm uppercase tracking-widest"
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
