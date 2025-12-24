
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import AdminStudents from './views/AdminStudents';
import AdminTeachers from './views/AdminTeachers';
import TeacherDashboard from './views/TeacherDashboard';
import ParentDashboard from './views/ParentDashboard';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { User, UserRole } from './types';
import { USERS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('eduflow_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    const foundUser = USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('eduflow_user', JSON.stringify(foundUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('eduflow_user');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
                  <Route path="/" element={<ParentDashboard studentId={user.linkedId!} />} />
                  <Route path="/parent" element={<ParentDashboard studentId={user.linkedId!} />} />
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
