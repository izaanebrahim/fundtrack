'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Leaf, ShieldCheck, BarChart3, Lock, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Mobile specific state
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the password reset link.');
    }
    setResetLoading(false);
  };

  return (
    <>
      {/* DESKTOP LAYOUT (>= 768px) */}
      <div className="hidden md:flex min-h-screen flex-col md:flex-row bg-[#07100E] text-[#F3F1E8] font-sans selection:bg-[#12C98B]/30 relative">
        
        {/* LEFT SECTION - Brand Experience */}
        <div className="flex flex-col md:w-[55%] relative p-8 pt-12 md:p-16 md:pr-24 overflow-hidden bg-[#07100E] z-10">
          
          {/* Abstract Financial Visualization Background */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
            {/* Subtle radial gradient */}
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#12C98B] opacity-[0.05] rounded-full blur-[100px]"></div>
            
            {/* Abstract SVG Chart Lines representing the wireframe wave */}
            <svg className="absolute bottom-0 left-0 w-full h-[70%] opacity-70" preserveAspectRatio="none" viewBox="0 0 1000 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Multiple fine wave lines */}
              {Array.from({length: 12}).map((_, i) => (
                <path key={i} className={i % 2 === 0 ? "wave-animate-even" : "wave-animate-odd"} d={`M-100 ${300 + i*15} C 200 ${280 - i*25}, 450 ${360 + i*15}, 650 ${260 - i*15} S 850 ${180 + i*10}, 1100 ${120 - i*20}`} stroke="#12C98B" strokeWidth="0.5" strokeOpacity={0.15 - (i*0.01)} vectorEffect="non-scaling-stroke"/>
              ))}
              {/* Main highlight curve */}
              <path className="wave-dash wave-animate-even" d="M-50 320 C 200 300, 450 360, 650 260 S 850 180, 1050 100" stroke="#12C98B" strokeWidth="1.5" strokeOpacity="0.8" vectorEffect="non-scaling-stroke"/>
              <path className="wave-animate-even" d="M-50 320 C 200 300, 450 360, 650 260 S 850 180, 1050 100 L 1050 400 L -50 400 Z" fill="url(#grad2)" opacity="0.15"/>
              
              {/* Data points */}
              <g className="wave-animate-even">
                <circle cx="200" cy="303" r="3" fill="#12C98B" opacity="0.9" className="animate-pulse"/>
                <circle cx="450" cy="360" r="4" fill="#12C98B" opacity="1" />
                <circle cx="650" cy="260" r="3" fill="#D6B875" opacity="0.9" />
                <circle cx="850" cy="170" r="3.5" fill="#12C98B" opacity="0.8" />
              </g>
              
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12C98B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#07100E" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Left Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[160px] md:w-[180px] h-auto object-contain mb-12 md:mb-20" />
            
            {/* Top Tagline */}
            <div className="hidden md:flex items-center gap-4 mb-6">
              <div className="w-8 h-[2px] bg-[#12C98B]/70"></div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Ethical investing for a brighter tomorrow</p>
            </div>
            
            {/* Headline & Description */}
            <div className="max-w-[540px]">
              <h2 className="text-[40px] md:text-[52px] font-[700] tracking-tight leading-[1.1] mb-6 text-[#F3F1E8]">
                Grow Your Wealth.<br />
                Without Compromising<br className="hidden md:block"/>
                <span className="text-[#12C98B]"> Your Values.</span>
              </h2>
              <p className="text-[16px] md:text-[17px] text-[#7E8D91] leading-relaxed max-w-[420px] mb-12 md:mb-16">
                Built around disciplined, transparent and<br className="hidden md:block"/> purpose-driven investing.
              </p>
            </div>
            
            {/* Feature Icons */}
            <div className="hidden md:flex items-center gap-8 text-[#7E8D91]">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-[#12C98B]" strokeWidth={1.5} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase leading-snug">Ethical<br/>Approach</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#12C98B]" strokeWidth={1.5} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase leading-snug">Transparent<br/>& Trusted</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-[#12C98B]" strokeWidth={1.5} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase leading-snug">Long-term<br/>Perspective</span>
              </div>
            </div>
            
            <div className="flex-grow"></div>
            
            {/* Bottom Tagline */}
            <div className="hidden md:flex items-center gap-4 mt-20 pb-4">
              <div className="w-8 h-[2px] bg-[#12C98B]/70"></div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Wealth with purpose</p>
            </div>
          </div>
        </div>

        {/* Center Divider with Glow Dot */}
        <div className="hidden md:flex absolute top-0 bottom-0 left-[55%] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent items-center justify-center z-20">
          <div className="w-[5px] h-[5px] bg-[#12C98B] rounded-full shadow-[0_0_12px_3px_rgba(18,201,139,0.6)]"></div>
        </div>

        {/* RIGHT SECTION - Login Form */}
        <div className="w-full md:w-[45%] flex flex-col relative bg-[#07100E] md:bg-transparent">
          
          {/* Top Right Tagline */}
          <div className="hidden md:flex justify-end items-center gap-4 absolute top-16 right-16 z-20">
            <div className="w-6 h-[2px] bg-[#12C98B]/70"></div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Invest · Grow · Make an impact</p>
          </div>
          
          {/* Form Container */}
          <div className="w-full max-w-[420px] mx-auto px-6 py-12 md:px-12 md:py-0 relative z-10 flex flex-col justify-center h-full min-h-[60vh] md:min-h-screen">
            
            {/* Header */}
            <div className="mb-10 md:mb-12">
              <h1 className="text-[36px] md:text-[40px] font-[700] tracking-tight mb-2 text-[#F3F1E8]">Welcome Back</h1>
              <p className="text-[15px] text-[#7E8D91] leading-relaxed">Access your Barakah Capital account</p>
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

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.1em] mb-3 text-[#7E8D91]" htmlFor="desktop-email">
                  Email Address
                </label>
                <input
                  id="desktop-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 h-[56px] bg-[#07100E] md:bg-[#091411] text-[#F3F1E8] rounded-[8px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8D91]" htmlFor="desktop-password">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[12px] font-semibold transition-colors text-[#12C98B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="desktop-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 h-[56px] bg-[#07100E] md:bg-[#091411] text-[#F3F1E8] rounded-[8px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-[#12C98B] hover:bg-[#15e09b] active:bg-[#0fa673] text-[#07100E] font-bold text-[15px] rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center shadow-[0_4px_16px_rgba(18,201,139,0.2)]"
              >
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
            </form>
            
            {/* Security Indicator */}
            <div className="mt-6 flex items-center justify-start gap-2 text-[#7E8D91] text-[13px] font-medium">
               <Lock className="w-4 h-4 text-[#12C98B]" strokeWidth={2} />
               Secure authentication
            </div>

          </div>

          {/* Bottom Right Footer */}
          <div className="hidden md:flex justify-end items-center gap-4 absolute bottom-16 right-16 z-20">
            <div className="w-8 h-[1px] bg-white/20"></div>
            <p className="text-[11px] font-medium text-[#7E8D91]">
              Secure access • Barakah Capital
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (< 768px) */}
      <div className="md:hidden flex flex-col min-h-[100svh] bg-[#07100E] text-[#F3F1E8] font-sans relative overflow-hidden">
        
        {/* Transition container for fade/slide */}
        <div className="flex-1 w-full relative">
          
          {/* MOBILE WELCOME SCREEN */}
          <div className={`absolute inset-0 flex flex-col w-full h-full transition-all duration-300 ease-in-out ${showMobileLogin ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
            
            {/* Top Brand Section */}
            <div className="flex-none flex flex-col items-center px-6 pt-[64px] sm:pt-[80px] z-20">
              <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[180px] sm:w-[210px] h-auto object-contain" />
              
              <div className="mt-16 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-[#12C98B]/70"></div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-[#7E8D91] uppercase">Ethical investing for a brighter tomorrow</p>
                <div className="w-4 h-[1px] bg-[#12C98B]/70"></div>
              </div>
              
              <h2 className="mt-6 text-[38px] sm:text-[44px] font-[650] sm:font-[700] tracking-tight leading-[1.05] text-center max-w-[320px]">
                Grow Your Wealth.<br />
                Without Compromising<br />
                <span className="text-[#12C98B]">Your Values.</span>
              </h2>
              
              <p className="mt-4 text-[15px] sm:text-[16px] text-[#7E8D91] text-center leading-snug max-w-[280px]">
                Built around disciplined, transparent and purpose-driven investing.
              </p>
            </div>

            {/* Middle Abstract Wave Section */}
            <div className="flex-1 relative w-full flex items-end justify-center min-h-[160px] pointer-events-none overflow-visible">
               <svg className="absolute w-full h-[150%] max-h-[300px] bottom-0 opacity-80" preserveAspectRatio="none" viewBox="0 0 1000 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fewer lines for mobile to keep it subtle */}
                {Array.from({length: 8}).map((_, i) => (
                  <path key={i} className={i % 2 === 0 ? "wave-animate-even" : "wave-animate-odd"} d={`M-100 ${280 + i*15} C 200 ${260 - i*20}, 450 ${340 + i*10}, 650 ${240 - i*10} S 850 ${160 + i*10}, 1100 ${100 - i*15}`} stroke="#12C98B" strokeWidth="0.5" strokeOpacity={0.15 - (i*0.015)} vectorEffect="non-scaling-stroke"/>
                ))}
                {/* Main highlight curve */}
                <path className="wave-dash wave-animate-even" d="M-50 300 C 200 280, 450 340, 650 240 S 850 160, 1050 80" stroke="#12C98B" strokeWidth="1" strokeOpacity="0.8" vectorEffect="non-scaling-stroke"/>
                <path className="wave-animate-even" d="M-50 300 C 200 280, 450 340, 650 240 S 850 160, 1050 80 L 1050 400 L -50 400 Z" fill="url(#grad-mobile)" opacity="0.1"/>
                
                {/* Data points */}
                <g className="wave-animate-even">
                  <circle cx="200" cy="283" r="2.5" fill="#12C98B" opacity="0.9" className="animate-pulse"/>
                  <circle cx="450" cy="340" r="3" fill="#12C98B" opacity="1" />
                  <circle cx="650" cy="240" r="2.5" fill="#D6B875" opacity="0.9" />
                </g>
                
                <defs>
                  <linearGradient id="grad-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#12C98B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#07100E" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Bottom Section */}
            <div className="flex-none w-full flex flex-col items-center pb-8 pt-4 z-20 px-6">
              
              {/* Value Indicators */}
              <div className="flex w-full justify-between items-start mb-8 text-[#7E8D91] px-2 max-w-[340px] mx-auto bg-[#07100e]/60 backdrop-blur-sm py-2 rounded-xl">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Leaf className="w-4 h-4 text-[#12C98B]" strokeWidth={1.5} />
                  <span className="text-[8px] sm:text-[9px] text-center font-bold tracking-[0.1em] uppercase">Ethical<br/>Approach</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10 mt-1"></div>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <ShieldCheck className="w-4 h-4 text-[#12C98B]" strokeWidth={1.5} />
                  <span className="text-[8px] sm:text-[9px] text-center font-bold tracking-[0.1em] uppercase">Transparent<br/>& Trusted</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10 mt-1"></div>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <BarChart3 className="w-4 h-4 text-[#12C98B]" strokeWidth={1.5} />
                  <span className="text-[8px] sm:text-[9px] text-center font-bold tracking-[0.1em] uppercase">Long-Term<br/>Perspective</span>
                </div>
              </div>

              {/* Sign In CTA */}
              <button 
                onClick={() => setShowMobileLogin(true)}
                className="w-[90%] max-w-[340px] h-[54px] sm:h-[58px] bg-[#12C98B] hover:bg-[#15e09b] active:bg-[#0fa673] text-[#07100E] font-bold text-[15px] rounded-[12px] transition-all shadow-[0_4px_16px_rgba(18,201,139,0.25)] flex items-center justify-center"
              >
                SIGN IN
              </button>

              <p className="mt-4 text-[11px] font-medium text-[#7E8D91]">
                Secure access • Barakah Capital
              </p>
            </div>
          </div>

          {/* MOBILE LOGIN SCREEN */}
          <div className={`absolute inset-0 flex flex-col w-full h-full bg-[#07100E] transition-all duration-300 ease-in-out ${showMobileLogin ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
            
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between px-6 py-6 w-full">
              <button 
                onClick={() => setShowMobileLogin(false)}
                className="flex items-center gap-2 text-[#7E8D91] hover:text-[#F3F1E8] transition-colors py-2"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                <span className="text-[14px] font-medium">Back</span>
              </button>
            </div>

            {/* Login Content */}
            <div className="flex-1 flex flex-col justify-center px-6 w-full max-w-[420px] mx-auto pb-12">
              
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[180px] sm:w-[210px] h-auto object-contain" />
              </div>

              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-[32px] font-[700] tracking-tight mb-2 text-[#F3F1E8]">Welcome Back</h1>
                <p className="text-[14px] text-[#7E8D91] leading-relaxed">Access your Barakah Capital account</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 bg-[#12C98B]/10 border border-[#12C98B]/20 rounded-[8px] text-[#12C98B] text-sm font-medium">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.1em] mb-2 text-[#7E8D91]" htmlFor="mobile-email">
                    Email Address
                  </label>
                  <input
                    id="mobile-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 h-[54px] sm:h-[56px] bg-[#0B1311] text-[#F3F1E8] rounded-[10px] sm:rounded-[12px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8D91]" htmlFor="mobile-password">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="text-[12px] font-semibold transition-colors text-[#12C98B] active:text-[#0fa673] disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="mobile-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full pl-4 pr-12 h-[54px] sm:h-[56px] bg-[#0B1311] text-[#F3F1E8] rounded-[10px] sm:rounded-[12px] transition-all text-[15px] outline-none border border-white/10 focus:border-[#12C98B]/60 focus:ring-1 focus:ring-[#12C98B]/60 placeholder-[#53666B]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#7E8D91] active:text-[#F3F1E8] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[54px] sm:h-[56px] bg-[#12C98B] hover:bg-[#15e09b] active:bg-[#0fa673] text-[#07100E] font-bold text-[15px] rounded-[10px] sm:rounded-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center shadow-[0_4px_16px_rgba(18,201,139,0.2)]"
                >
                  {loading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
              
              {/* Security Indicator */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[#7E8D91] text-[13px] font-medium">
                 <Lock className="w-4 h-4 text-[#12C98B]" strokeWidth={2} />
                 Secure authentication
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
