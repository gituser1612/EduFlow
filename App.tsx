
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import AdminStudents from './views/AdminStudents';
import AdminTeachers from './views/AdminTeachers';
import AdminUsers from './views/AdminUsers';
import TeacherDashboard from './views/TeacherDashboard';
import ParentDashboard from './views/ParentDashboard';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { User, UserRole } from './types';
import { supabase } from './supabase';
import { AlertCircle, RefreshCw, Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'eduflow_session_cache';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const isInitializing = useRef(false);

  const fetchProfile = useCallback(async (sessionUser: any): Promise<User | null> => {
    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
        
      if (!profile) {
        const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User';
        const fallbackRole = sessionUser.user_metadata?.role || UserRole.PARENT;

        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{
            id: sessionUser.id,
            email: sessionUser.email,
            name: fallbackName,
            role: fallbackRole
          }])
          .select()
          .maybeSingle();

        profile = newProfile;
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          name: profile.name || 'User',
          role: (profile.role as UserRole) || UserRole.PARENT,
          email: profile.email,
          linkedId: profile.linked_id || null
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        if (!userData.linkedId) {
          backgroundAutoLink(userData);
        }
        return userData;
      }
    } catch (err) {
      console.error("Profile Fetch Exception:", err);
    }
    return null;
  }, []);

  const backgroundAutoLink = async (currentUser: User) => {
    try {
      let linkedId = null;
      if (currentUser.role === UserRole.TEACHER) {
        const { data: teacher } = await supabase
          .from('teachers').select('id').ilike('email', currentUser.email).maybeSingle();
        linkedId = teacher?.id;
      } else if (currentUser.role === UserRole.PARENT) {
        const { data: student } = await supabase
          .from('students').select('id').ilike('parent_email', currentUser.email).maybeSingle();
        linkedId = student?.id;
      }

      if (linkedId) {
        await supabase.from('profiles').update({ linked_id: linkedId }).eq('id', currentUser.id);
        const updated = { ...currentUser, linkedId };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.debug("Background linking skipped", e);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      setLoading(true);

      const retryTimer = setTimeout(() => {
        setShowRetry(true);
      }, 6000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } catch (err: any) {
        setInitError("Cloud synchronization interrupted.");
      } finally {
        clearTimeout(retryTimer);
        // Delay finish to show animation
        setTimeout(() => setLoading(false), 800);
        isInitializing.current = false;
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-8 bg-white px-6">
      <div className="relative">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] animate-float flex items-center justify-center shadow-2xl shadow-indigo-100">
           <Sparkles className="text-white w-10 h-10 animate-pulse" />
        </div>
        <div className="absolute -inset-6 border-2 border-indigo-50 border-dashed rounded-full animate-[spin_15s_linear_infinite]"></div>
      </div>
      <div className="text-center space-y-4">
        <h2 className="text-slate-900 font-black tracking-tighter text-2xl">EduFlow Academy</h2>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
            {showRetry ? "Establishing secure link..." : "Initializing Academic Environment..."}
          </p>
          <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>

      {showRetry && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-3 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-black transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Wake System</span>
          </button>
        </div>
      )}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 animate-fade-in-up">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar user={user} />
          <main className="p-4 md:p-8 overflow-y-auto">
            {initError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Notice: {initError}</span>
                </div>
                <button onClick={() => setInitError(null)} className="opacity-50 hover:opacity-100 uppercase text-[10px]">Dismiss</button>
              </div>
            )}
            <Routes>
              {user.role === UserRole.ADMIN && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/students" element={<AdminStudents />} />
                  <Route path="/admin/teachers" element={<AdminTeachers />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </>
              )}
              {user.role === UserRole.TEACHER && (
                <>
                  <Route path="/" element={<TeacherDashboard teacherId={user.linkedId!} />} />
                  <Route path="/teacher" element={<TeacherDashboard teacherId={user.linkedId!} />} />
                  <Route path="*" element={<Navigate to="/teacher" />} />
                </>
              )}
              {user.role === UserRole.PARENT && (
                <>
                  <Route path="/" element={<ParentDashboard studentId={user.linkedId || null} view="performance" />} />
                  <Route path="/parent" element={<ParentDashboard studentId={user.linkedId || null} view="performance" />} />
                  <Route path="/parent/attendance" element={<ParentDashboard studentId={user.linkedId || null} view="attendance" />} />
                  <Route path="/parent/payments" element={<ParentDashboard studentId={user.linkedId || null} view="payments" />} />
                  <Route path="*" element={<Navigate to="/parent" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
