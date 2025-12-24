
import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, ArrowRight, UserPlus, LogIn, CheckCircle2, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { USERS } from '../constants';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('demo123');
    setIsSignUp(false);
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Branding & Animation */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Abstract shapes for visual flair */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">EduFlow</span>
          </div>

          <div className="space-y-8 max-w-md">
            <div className="animate-fade-in-up stagger-1">
              <h2 className="text-5xl font-extrabold leading-tight mb-4">
                Smart Education <br /> 
                <span className="text-indigo-200">Management.</span>
              </h2>
              <p className="text-indigo-100 text-lg">
                The all-in-one platform for coaching centers, schools, and private tuitions.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in-up stagger-2">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                <CheckCircle2 className="text-emerald-400 w-6 h-6 flex-shrink-0" />
                <span className="font-medium">Real-time Attendance Tracking</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                <ShieldCheck className="text-amber-400 w-6 h-6 flex-shrink-0" />
                <span className="font-medium">Secure Fee Management & UPI</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                <Sparkles className="text-indigo-300 w-6 h-6 flex-shrink-0" />
                <span className="font-medium">AI-Powered Performance Insights</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in-up stagger-3">
          <p className="text-indigo-200 text-sm">© 2024 EduFlow Infrastructure. Empowering 500+ Institutions.</p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 md:bg-white">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-4">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EduFlow</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Join as Parent' : 'Welcome back'}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? 'Start tracking your child\'s education journey today.' : 'Please enter your details to sign in to your account.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-black focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-black focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-bold text-slate-700">Password</label>
                {!isSignUp && <a href="#" className="text-xs font-semibold text-indigo-600 hover:underline">Forgot password?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-12 text-black focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2">
              {isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {USERS.map(u => (
              <button
                key={u.id}
                onClick={() => setDemoRole(u.email)}
                className="text-[11px] font-bold py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex flex-col items-center justify-center"
              >
                <span>{u.role.split('_')[0]}</span>
                <span className="text-[9px] opacity-60 font-medium italic">Demo</span>
              </button>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Already have an account?' : 'Not a member yet?'}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1.5 font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
              >
                {isSignUp ? 'Sign In' : 'Create an Account (Parent)'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
