
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  CreditCard, 
  LogOut,
  GraduationCap,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();

  const menuItems = {
    [UserRole.ADMIN]: [
      { name: 'Terminal', icon: LayoutDashboard, path: '/admin' },
      { name: 'Teachers', icon: UserSquare2, path: '/admin/teachers' },
      { name: 'Students', icon: Users, path: '/admin/students' },
      { name: 'Access Controls', icon: ShieldCheck, path: '/admin/users' },
    ],
    [UserRole.TEACHER]: [
  { name: 'Overview', icon: LayoutDashboard, path: '/teacher' },
  { name: 'Register', icon: CalendarCheck, path: '/teacher/attendance' },
  { name: 'Student List', icon: Users, path: '/teacher/students' },
  { name: 'Fees', icon: CreditCard, path: '/teacher/fees' },
],
    [UserRole.PARENT]: [
      { name: 'Overview', icon: LayoutDashboard, path: '/parent' },
      { name: 'Attendance History', icon: CalendarCheck, path: '/parent/attendance' },
      { name: 'Fee Records', icon: CreditCard, path: '/parent/payments' },
    ]
  };

  const activeItems = menuItems[user.role];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 ease-in-out
    md:relative md:translate-x-0 md:flex md:flex-col md:h-screen md:sticky md:top-0
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-tight">EduFlow</span>
              <div className="flex items-center space-x-1">
                 <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enterprise</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen?.(false)}
            className="md:hidden p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 pt-4 overflow-y-auto no-scrollbar">
          {activeItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen?.(false)}
                className={`flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors`} />
                <span className="font-black text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm ring-4 ring-indigo-50/50">
                <UserSquare2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</p>
                <p className="text-sm font-black text-slate-900 capitalize truncate">{user.role.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center justify-center space-x-2 w-full py-4 bg-white border border-slate-200 rounded-2xl text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-300 font-black uppercase tracking-widest">EduFlow v2.0</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
