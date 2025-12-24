
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  CreditCard, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = {
    [UserRole.ADMIN]: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { name: 'Teachers', icon: UserSquare2, path: '/admin/teachers' },
      { name: 'Students', icon: Users, path: '/admin/students' },
    ],
    [UserRole.TEACHER]: [
      { name: 'My Dashboard', icon: LayoutDashboard, path: '/teacher' },
      { name: 'Register', icon: CalendarCheck, path: '/teacher/attendance' },
      { name: 'Student List', icon: Users, path: '/teacher/students' },
    ],
    [UserRole.PARENT]: [
      { name: 'Performance', icon: LayoutDashboard, path: '/parent' },
      { name: 'Attendance', icon: CalendarCheck, path: '/parent/attendance' },
      { name: 'Fee Portal', icon: CreditCard, path: '/parent/payments' },
    ]
  };

  const activeItems = menuItems[user.role];

  return (
    <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div>
          <span className="text-2xl font-bold text-slate-900 block leading-tight">EduFlow</span>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Enterprise v2</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 pt-4">
        {activeItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/');
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors`} />
              <span className="font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="bg-slate-50 p-6 rounded-3xl mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Role</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center space-x-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 font-medium">EduFlow LMS &copy; 2024</p>
      </div>
    </div>
  );
};

export default Sidebar;
