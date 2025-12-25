
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCog, 
  Mail, 
  Search, 
  Loader2, 
  Trash2, 
  ChevronDown,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Info,
  ExternalLink
} from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../supabase';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role as UserRole,
        email: u.email,
        linkedId: u.linked_id
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert(error.message);
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Access Control</h1>
          <p className="text-slate-500 font-medium">Manage who can access the portal and their permission levels.</p>
        </div>
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl text-amber-700 text-xs font-bold">
          <Info className="w-4 h-4" />
          <span>New users must sign up before appearing here</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search registered users..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning Registry...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">System Identity</th>
                      <th className="px-8 py-5">Assigned Role</th>
                      <th className="px-8 py-5 text-right">Permissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black relative ${
                              user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              {user.role === UserRole.ADMIN && (
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                  <ShieldCheck className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{user.name || 'Pending Profile'}</p>
                              <p className="text-xs font-medium text-slate-400 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                            user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' :
                            user.role === UserRole.TEACHER ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="inline-flex items-center space-x-2">
                            {updatingId === user.id ? (
                              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            ) : (
                              <div className="relative">
                                <select 
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                  className="appearance-none bg-slate-100 border-none rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                  <option value={UserRole.ADMIN}>Administrator</option>
                                  <option value={UserRole.TEACHER}>Teacher</option>
                                  <option value={UserRole.PARENT}>Parent / Student</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No active users registered yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Admin Guide</span>
            </h3>
            <div className="space-y-4 text-sm font-medium text-indigo-100 leading-relaxed">
              <p>1. <strong>Create Record:</strong> Add a Teacher or Student in their respective tabs.</p>
              <p>2. <strong>Invite User:</strong> Ask them to sign up with the <u>exact email</u> used in the record.</p>
              <p>3. <strong>Auto-Link:</strong> The system will automatically connect their login to the data record.</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Security Tip</span>
            </h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
              Only promote users to <strong>Admin</strong> if you trust them with full financial and student data access.
            </p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-bold">Supabase Console</span>
              <ExternalLink className="w-4 h-4 text-indigo-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
