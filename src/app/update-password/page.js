'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07100E] text-[#F3F1E8] font-sans selection:bg-[#12C98B]/30 relative">
      
      {/* LEFT SECTION - Brand Experience (Simplified for Reset Flow) */}
      <div className="flex flex-col lg:w-[55%] relative p-8 pt-12 lg:p-16 lg:pr-24 overflow-hidden bg-[#07100E] z-10 hidden lg:flex">
        
        {/* Abstract Financial Visualization Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#12C98B] opacity-[0.05] rounded-full blur-[100px]"></div>
          
          <svg className="absolute bottom-0 left-0 w-full h-[70%] opacity-70" preserveAspectRatio="none" viewBox="0 0 1000 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({length: 8}).map((_, i) => (
              <path key={i} d={`M-100 ${300 + i*15} C 200 ${280 - i*25}, 450 ${360 + i*15}, 650 ${260 - i*15} S 850 ${180 + i*10}, 1100 ${120 - i*20}`} stroke="#12C98B" strokeWidth="0.5" strokeOpacity={0.1 - (i*0.01)} vectorEffect="non-scaling-stroke"/>
            ))}
            <path d="M-50 320 C 200 300, 450 360, 650 260 S 850 180, 1050 100" stroke="#12C98B" strokeWidth="1.5" strokeOpacity="0.8" vectorEffect="non-scaling-stroke"/>
            <path d="M-50 320 C 200 300, 450 360, 650 260 S 850 180, 1050 100 L 1050 400 L -50 400 Z" fill="url(#grad2)" opacity="0.15"/>
            <circle cx="450" cy="360" r="4" fill="#12C98B" opacity="1" className="animate-pulse" />
            
            <defs>
              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12C98B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#07100E" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[160px] lg:w-[180px] h-auto object-contain mb-12 lg:mb-20" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-[2px] bg-[#12C98B]/70"></div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Account Security</p>
          </div>
          
          <div className="max-w-[540px]">
            <h2 className="text-[40px] lg:text-[52px] font-[700] tracking-tight leading-[1.1] mb-6 text-[#F3F1E8]">
              Secure Your <br />
              Future.<br/>
            </h2>
            <p className="text-[16px] lg:text-[17px] text-[#7E8D91] leading-relaxed max-w-[420px]">
              Set a strong password to protect your Barakah Capital investments.
            </p>
          </div>
        </div>
      </div>

      {/* Center Divider */}
      <div className="hidden lg:flex absolute top-0 bottom-0 left-[55%] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent items-center justify-center z-20">
        <div className="w-[5px] h-[5px] bg-[#12C98B] rounded-full shadow-[0_0_12px_3px_rgba(18,201,139,0.6)]"></div>
      </div>

      {/* RIGHT SECTION - Reset Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative bg-[#07100E] lg:bg-transparent">
        
        {/* Mobile Logo */}
        <div className="lg:hidden p-8 pb-0 pt-12">
          <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[160px] h-auto object-contain mx-auto" />
        </div>

        <div className="hidden lg:flex justify-end items-center gap-4 absolute top-16 right-16 z-20">
          <div className="w-6 h-[2px] bg-[#12C98B]/70"></div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Privacy · Security · Trust</p>
        </div>
        
        <div className="w-full max-w-[420px] mx-auto px-6 py-12 lg:px-12 lg:py-0 relative z-10 flex flex-col justify-center h-full min-h-[70vh] lg:min-h-screen">
          
          <div className="mb-10 lg:mb-12">
            <h1 className="text-[36px] lg:text-[40px] font-[700] tracking-tight mb-2 text-[#F3F1E8]">Reset Password</h1>
            <p className="text-[15px] text-[#7E8D91] leading-relaxed">Enter your new secure password below.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-8 p-4 bg-[#12C98B]/10 border border-[#12C98B]/20 rounded-[8px] text-[#12C98B] text-sm font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            
            {/* New Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8D91] mb-3" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 h-[56px] bg-[#07100E] lg:bg-[#091411] text-[#F3F1E8] rounded-[8px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#7E8D91] hover:text-[#F3F1E8] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8D91] mb-3" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 h-[56px] bg-[#07100E] lg:bg-[#091411] text-[#F3F1E8] rounded-[8px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#7E8D91] hover:text-[#F3F1E8] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-[#12C98B] hover:bg-[#15e09b] active:bg-[#0fa673] text-[#07100E] font-bold text-[15px] rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center shadow-[0_4px_16px_rgba(18,201,139,0.2)]"
            >
              {loading ? 'Updating...' : 'UPDATE PASSWORD'}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-start gap-2 text-[#7E8D91] text-[13px] font-medium">
             <ShieldCheck className="w-4 h-4 text-[#12C98B]" strokeWidth={2} />
             Encrypted & Secured
          </div>

        </div>

        <div className="hidden lg:flex justify-end items-center gap-4 absolute bottom-16 right-16 z-20">
          <div className="w-8 h-[1px] bg-white/20"></div>
          <p className="text-[11px] font-medium text-[#7E8D91]">
            Secure access • Barakah Capital
          </p>
        </div>
      </div>
    </div>
  );
}
