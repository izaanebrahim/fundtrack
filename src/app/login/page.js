'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Role redirection is handled by AppLayout
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#07100E]"
      style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(18,201,139,0.03) 0%, transparent 60%)' }}
    >
      
      {/* Very faint atmospheric lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#12C98B] opacity-[0.02] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] mx-4 relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-8">
          <img src="/logo-wide-perfect-cropped.png" alt="Barakah Capital" className="w-40 h-auto object-contain" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[40px] font-bold tracking-tight mb-2 text-[#F3F1E8]">Welcome Back</h1>
          <p className="text-[15px] text-[#7D8C91]">Access your investment dashboard</p>
        </div>

        {/* Card */}
        <div 
          className="w-full p-8 shadow-2xl relative bg-[#101917] rounded-[24px]"
          style={{ 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
          }}
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[12px] text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#7D8C91]" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 h-[54px] bg-[#0B1311] text-[#F3F1E8] rounded-[12px] transition-all text-[15px] outline-none border border-[rgba(255,255,255,0.08)] focus:border-[#12C98B]/40 focus:ring-1 focus:ring-[#12C98B]/40 placeholder-[#7D8C91]/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D8C91]" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs transition-colors text-[#7D8C91] hover:text-[#F3F1E8]">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 h-[54px] bg-[#0B1311] text-[#F3F1E8] rounded-[12px] transition-all text-[15px] outline-none border border-[rgba(255,255,255,0.08)] focus:border-[#12C98B]/40 focus:ring-1 focus:ring-[#12C98B]/40 placeholder-[#7D8C91]/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#7D8C91] hover:text-[#F3F1E8] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] bg-[#12C98B] text-[#07100E] font-semibold text-[15px] rounded-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center shadow-[0_4px_14px_0_rgba(18,201,139,0.15)] hover:shadow-[0_6px_20px_0_rgba(18,201,139,0.25)] hover:-translate-y-[1px]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs font-medium tracking-wide text-[#7D8C91]">
          Secure access • Barakah Capital
        </p>
      </div>
    </div>
  );
}
