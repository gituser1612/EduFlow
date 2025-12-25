
import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: any) => {
    try {
      // 1. Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (profile) {
        let linkedId = profile.linked_id;

        // 2. AUTO-LINKING LOGIC: If linkedId is missing, check if this email exists in Teachers or Students
        if (!linkedId) {
          if (profile.role === UserRole.TEACHER) {
            const { data: teacher } = await supabase.from('teachers').select('id').eq('email', profile.email).single();
            if (teacher) {
              linkedId = teacher.id;
              await supabase.from('profiles').update({ linked_id: teacher.id }).eq('id', sessionUser.id);
            }
          } else if (profile.role === UserRole.PARENT) {
            const { data: student } = await supabase.from('students').select('id').eq('parent_email', profile.email).single();
            if (student) {
              linkedId = student.id;
              await supabase.from('profiles').update({ linked_id: student.id }).eq('id', sessionUser.id);
            }
          }
        }

        setUser({
          id: profile.id,
          name: profile.name,
          role: profile.role as UserRole,
          email: profile.email,
          linkedId: linkedId || null
        });
      }
    } catch (err) {
      console.error("Critical Auth Error:", err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Connecting to Cloud...</p>
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
