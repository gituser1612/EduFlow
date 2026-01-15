import React, { useEffect, useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./views/Login";
import AdminDashboard from "./views/AdminDashboard";
import StudentManagement from "./views/StudentManagement";
import AdminTeachers from "./views/AdminTeachers";
import AdminUsers from "./views/AdminUsers";
import TeacherDashboard from "./views/TeacherDashboard";
import ParentDashboard from "./views/ParentDashboard";
import TeacherFees from "./views/TeacherFees";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import { User, UserRole } from "./types";
import { supabase } from "./supabase";
import { Sparkles } from "lucide-react";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // authReady = means we finished checking session atleast once
  const [authReady, setAuthReady] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchProfile = useCallback(async (sessionUser: any): Promise<User> => {
    const fallbackUser: User = {
      id: sessionUser.id,
      name:
        sessionUser.user_metadata?.full_name ||
        sessionUser.email?.split("@")[0] ||
        "User",
      role: (sessionUser.user_metadata?.role as UserRole) || UserRole.PARENT,
      email: sessionUser.email,
      linkedId: null,
    };

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (error || !profile) return fallbackUser;

      return {
        id: profile.id,
        name: profile.name || fallbackUser.name,
        role: (profile.role as UserRole) || fallbackUser.role,
        email: profile.email || fallbackUser.email,
        linkedId: profile.linked_id || null,
      };
    } catch (err) {
      console.error("fetchProfile error:", err);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    // 1) First session restore after reload
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("getSession error:", error);

        if (data.session?.user) {
          const profile = await fetchProfile(data.session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("restoreSession error:", err);
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };

    restoreSession();

    // 2) Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth event:", _event);

        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user);
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
          setUser(null);
        } finally {
          setAuthReady(true);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }

    setUser(null);
    setAuthReady(true);

    // Full refresh
    window.location.replace("/");
  };

  // Loader screen (only until authReady = true)
  if (!authReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-12 bg-white px-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] animate-float flex items-center justify-center shadow-2xl">
            <Sparkles className="text-white w-10 h-10" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-slate-900 font-black text-2xl tracking-tight">
            EduFlow Academy
          </h2>
          <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">
            Restoring session...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  // Logged in
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 animate-fade-in-up">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />

          <main className="p-4 md:p-8 overflow-y-auto">
            <Routes>
              {/* ADMIN */}
              {user.role === UserRole.ADMIN && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route
                    path="/admin/students"
                    element={<StudentManagement role={UserRole.ADMIN} />}
                  />
                  <Route path="/admin/teachers" element={<AdminTeachers />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </>
              )}

              {/* TEACHER */}
              {user.role === UserRole.TEACHER && (
  <>
    <Route path="/" element={<TeacherDashboard teacherId={user.linkedId!} />} />
    <Route path="/teacher" element={<TeacherDashboard teacherId={user.linkedId!} />} />

    <Route
      path="/teacher/students"
      element={
        <StudentManagement
          role={UserRole.TEACHER}
          currentUserId={user.linkedId!}
        />
      }
    />

    <Route
      path="/teacher/fees"
      element={<TeacherFees teacherId={user.linkedId!} />}
    />

    <Route path="*" element={<Navigate to="/teacher" />} />
  </>
)}


              {/* PARENT */}
              {user.role === UserRole.PARENT && (
                <>
                  <Route
                    path="/"
                    element={
                      <ParentDashboard
                        studentId={user.linkedId || null}
                        view="performance"
                      />
                    }
                  />
                  <Route
                    path="/parent"
                    element={
                      <ParentDashboard
                        studentId={user.linkedId || null}
                        view="performance"
                      />
                    }
                  />
                  <Route
                    path="/parent/attendance"
                    element={
                      <ParentDashboard
                        studentId={user.linkedId || null}
                        view="attendance"
                      />
                    }
                  />
                  <Route
                    path="/parent/payments"
                    element={
                      <ParentDashboard
                        studentId={user.linkedId || null}
                        view="payments"
                      />
                    }
                  />
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
