
import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  X,
  Loader2,
  AlertTriangle,
  Info,
  Users,
  UserSquare2,
  ChevronLeft
} from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../supabase';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [roleSelected, setRoleSelected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>(UserRole.PARENT);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: signupRole
          }
        }
      });
      if (error) throw error;
      alert(`Registration successful! You can now log in to your ${signupRole.toLowerCase()} portal.`);
      setIsSignUp(false);
      setRoleSelected(false);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  const selectRole = (role: UserRole) => {
    setSignupRole(role);
    setRoleSelected(true);
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

      {/* Right Side: Auth Container */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 md:bg-white relative">
        <div className="max-w-md w-full">
          
          {/* LOGIN VIEW */}
          {!isSignUp && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h2>
                <p className="text-slate-500 font-medium">Please enter your details to access the portal.</p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                    <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-black text-indigo-600 hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 group disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  <span>{isLoading ? 'Processing...' : 'Sign In to Dashboard'}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Not a member yet?
                  <button onClick={() => setIsSignUp(true)} className="ml-2 font-black text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                    Join now
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ROLE SELECTION VIEW */}
          {isSignUp && !roleSelected && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setIsSignUp(false)} 
                className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Login</span>
              </button>
              <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
                <p className="text-slate-500 font-medium">To get started, tell us who you are.</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => selectRole(UserRole.PARENT)}
                  className="w-full flex items-center p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all group text-left"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mr-6">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">I am a Parent</h4>
                    <p className="text-sm text-slate-500 font-medium">Track your child's attendance & fees.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </button>

                <button 
                  onClick={() => selectRole(UserRole.TEACHER)}
                  className="w-full flex items-center p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-violet-600 hover:shadow-xl hover:shadow-violet-50 transition-all group text-left"
                >
                  <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors mr-6">
                    <UserSquare2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">I am a Teacher</h4>
                    <p className="text-sm text-slate-500 font-medium">Manage classes & mark attendance.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-slate-200 group-hover:text-violet-600 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP FORM VIEW */}
          {isSignUp && roleSelected && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setRoleSelected(false)} 
                className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Change Role ({signupRole.toLowerCase()})</span>
              </button>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Join as {signupRole.toLowerCase()}</h2>
                <p className="text-slate-500 font-medium">Fill in your details to create your secure account.</p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSignUpSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Your Name" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="name@example.com" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-black focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 group disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLoading ? 'Processing...' : 'Create Account'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* PASSWORD RECOVERY MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsForgotModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Recovery</h3>
              <button onClick={() => setIsForgotModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleForgotEmailSubmit} className="space-y-6">
              <p className="text-slate-500 text-sm font-medium">Enter your email and we'll send reset instructions.</p>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="your@email.com" required />
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
