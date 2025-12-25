
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff,
  Key,
  X,
  Smartphone,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { USERS } from '../constants';
import { UserRole } from '../types';
import { supabase } from '../supabase';

interface LoginProps {
  onLogin: (email: string) => void;
}

type ForgotPasswordStep = 'email' | 'otp' | 'reset' | 'success';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: UserRole.PARENT
          }
        }
      });
      if (error) throw error;
      alert("Registration successful! You can now log in.");
      setIsSignUp(false);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('demo123');
    setIsSignUp(false);
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      alert("Password reset instructions sent!");
      setIsForgotModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-jakarta">
      {/* Left Side: Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight">EduFlow</span>
          </div>

          <div className="space-y-8 max-w-md">
            <div className="animate-fade-in-up stagger-1">
              <h2 className="text-5xl font-black leading-tight mb-4">Smart Education <br /> <span className="text-indigo-200">Management.</span></h2>
              <p className="text-indigo-100 text-lg font-medium opacity-90">The all-in-one platform for coaching centers and schools.</p>
            </div>
            <div className="space-y-4 animate-fade-in-up stagger-2">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10"><CheckCircle2 className="text-emerald-400 w-6 h-6" /><span className="font-bold">Attendance Tracking</span></div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10"><ShieldCheck className="text-amber-400 w-6 h-6" /><span className="font-bold">Secure Fee Management</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 md:bg-white">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">{isSignUp ? 'Create Account' : 'Welcome back'}</h2>
            <p className="text-slate-500 font-medium">Please enter your details to access the portal.</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex flex-col space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center space-x-3 text-sm font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>{authError}</span>
              </div>
              {authError.includes('credentials') && (
                <p className="text-[10px] bg-white/50 p-2 rounded-lg text-slate-500 font-medium">
                  <strong>Note:</strong> Since this is a new database, you must <strong>Sign Up</strong> first. "Demo Login" only works after you create those users in your Supabase Auth tab.
                </p>
              )}
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="animate-fade-in-up">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Your Name" required />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="name@example.com" required />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                {!isSignUp && <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-black text-indigo-600 hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 group disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In to Dashboard')}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-[0.2em]">Quick Demo Autofill</span></div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {USERS.map(u => (
              <button key={u.id} onClick={() => setDemoRole(u.email)} className="text-[10px] font-black py-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex flex-col items-center justify-center group">
                <span>{u.role.split('_')[0]}</span>
                <span className="text-[8px] opacity-40 group-hover:opacity-100 uppercase mt-0.5">Fill Email</span>
              </button>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {isSignUp ? 'Already have an account?' : 'Not a member yet?'}
              <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 font-black text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                {isSignUp ? 'Sign In' : 'Join as Parent'}
              </button>
            </p>
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              <strong>First time?</strong> Use "Join as Parent" to create your account, then go to your Supabase dashboard to change your role to <strong>ADMIN</strong> in the <code>profiles</code> table.
            </p>
          </div>
        </div>
      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsForgotModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Password Recovery</h3>
              <button onClick={() => setIsForgotModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleForgotEmailSubmit} className="space-y-6">
              <p className="text-slate-500 text-sm font-medium">Enter your email and we'll send reset instructions.</p>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold" placeholder="your@email.com" required />
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl">Send Reset Link</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
