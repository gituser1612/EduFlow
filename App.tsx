
import React, { useState, useEffect, useCallback } from 'react';
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
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const fetchProfile = useCallback(async (sessionUser: any): Promise<User | null> => {
    try {
      // 1. Try to fetch existing profile
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
        
      if (error) {
        console.warn("Database error fetching profile:", error.message);
      }

      // 2. If profile is missing, create a skeleton record (Auto-Repair)
      if (!profile) {
        console.log("Profile missing for user. Attempting to create fallback record...");
        const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User';
        const fallbackRole = sessionUser.user_metadata?.role || UserRole.PARENT;

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: sessionUser.id,
            email: sessionUser.email,
            name: fallbackName,
            role: fallbackRole
          }])
          .select()
          .maybeSingle();

        if (!insertError && newProfile) {
          profile = newProfile;
        } else {
          // Final Fallback: Return a local user object even if DB insert fails
          return {
            id: sessionUser.id,
            name: fallbackName,
            role: fallbackRole as UserRole,
            email: sessionUser.email,
            linkedId: null
          };
        }
      }

      if (profile) {
        let linkedId = profile.linked_id;

        // 3. AUTO-LINKING LOGIC (Only if not already linked)
        if (!linkedId) {
          try {
            if (profile.role === UserRole.TEACHER) {
              const { data: teacher } = await supabase
                .from('teachers').select('id').ilike('email', profile.email).maybeSingle();
              if (teacher) {
                linkedId = teacher.id;
                await supabase.from('profiles').update({ linked_id: teacher.id }).eq('id', sessionUser.id);
              }
            } else if (profile.role === UserRole.PARENT) {
              const { data: student } = await supabase
                .from('students').select('id').ilike('parent_email', profile.email).maybeSingle();
              if (student) {
                linkedId = student.id;
                await supabase.from('profiles').update({ linked_id: student.id }).eq('id', sessionUser.id);
              }
            }
          } catch (linkErr) {
            console.error("Auto-linking failed safely:", linkErr);
          }
        }

        return {
          id: profile.id,
          name: profile.name || 'User',
          role: (profile.role as UserRole) || UserRole.PARENT,
          email: profile.email,
          linkedId: linkedId || null
        };
      }
    } catch (err) {
      console.error("Critical Profile Fetch Exception:", err);
    }
    return null;
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    setInitError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error("Initialization failed:", err);
      setInitError(err.message || "Network error while connecting to cloud.");
    } finally {
      // Ensure loading is ALWAYS false after attempts
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    initialize();

    // Show retry after 6s (faster response for user)
    const retryTimer = setTimeout(() => {
      if (loading) setShowRetry(true);
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth State Changed:", event);
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setLoading(true);
        try {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(retryTimer);
    };
  }, [initialize, fetchProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null); 
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-white px-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-slate-900 font-black tracking-widest uppercase text-sm">Synchronizing Cloud</h2>
        <p className="text-slate-400 text-xs font-medium max-w-[240px] mx-auto leading-relaxed">
          {showRetry 
            ? "Database is responding slowly. Please wait or try refreshing the page."
            : "Verifying credentials and loading your personal dashboard..."}
        </p>
      </div>

      {showRetry && (
        <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Force Refresh</span>
          </button>
          <button 
            onClick={() => setLoading(false)}
            className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            Skip Loading
          </button>
        </div>
      )}
    </div>
  );

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar user={user} />
          <main className="p-4 md:p-8 overflow-y-auto">
            {initError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connectivity Issue: {initError}</span>
                </div>
                <button onClick={() => setInitError(null)} className="opacity-50 hover:opacity-100 underline uppercase text-[10px]">Dismiss</button>
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
