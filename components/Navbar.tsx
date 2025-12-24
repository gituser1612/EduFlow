
import React from 'react';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="w-full bg-slate-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 ring-2 ring-indigo-50">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
