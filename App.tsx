
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
import { Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'eduflow_session_cache';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  
  const [loading, setLoading] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isInitializing = useRef(false);

  const fetchProfile = useCallback(async (sessionUser: any): Promise<User | null> => {
    try {
      // 1. Try to fetch existing profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
        
      // 2. If profile is missing, create it
      if (!profile) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // Promotion logic: First user is ALWAYS Admin
        const fallbackRole = (count === 0) ? UserRole.ADMIN : (sessionUser.user_metadata?.role || UserRole.PARENT);
        const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User';

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: sessionUser.id,
            email: sessionUser.email,
            name: fallbackName,
            role: fallbackRole
          }])
          .select()
          .maybeSingle();

        if (createError) throw createError;
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
        return userData;
      }
    } catch (err) {
      console.error("Profile sync issue:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          if (profile) {
            setUser(profile);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } catch (err: any) {
        console.error("Session verification failed:", err);
      } finally {
        setLoading(false);
        isInitializing.current = false;
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const profile = await fetchProfile(session.user);
        if (profile) setUser(profile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.clear();
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-12 bg-white px-6 text-center">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] animate-float flex items-center justify-center shadow-2xl">
           <Sparkles className="text-white w-10 h-10" />
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-slate-900 font-black text-2xl tracking-tight">EduFlow Academy</h2>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Verifying Identity...</p>
          <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return <Login onLogin={() => {}} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 animate-fade-in-up">
        <Sidebar user={user} onLogout={handleLogout} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="p-4 md:p-8 overflow-y-auto">
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
