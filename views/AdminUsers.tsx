
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
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import { User, UserRole, Teacher } from '../types';
import { supabase } from '../supabase';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [profilesRes, teachersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('name')
    ]);
    
    if (profilesRes.data) {
      setUsers(profilesRes.data.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role as UserRole,
        email: u.email,
        linkedId: u.linked_id
      })));
    }

    if (teachersRes.data) {
      setTeachers(teachersRes.data.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, linked_id: null }) // Reset link if role changes
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, linkedId: null } : u));
    } else {
      alert(error.message);
    }
    setUpdatingId(null);
  };

  const handleLinkChange = async (userId: string, linkedId: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ linked_id: linkedId === 'none' ? null : linkedId })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, linkedId: linkedId === 'none' ? undefined : linkedId } : u));
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Access Terminal</h1>
          <p className="text-slate-500 font-medium">Link faculty accounts to directory records.</p>
        </div>
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl text-amber-700 text-xs font-bold">
          <Info className="w-4 h-4" />
          <span>Syncing Identity & Permissions</span>
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
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm text-black font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Querying Cloud Registry...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">User</th>
                      <th className="px-8 py-5">System Role</th>
                      <th className="px-8 py-5">Link to Directory</th>
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
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{user.name || 'Anonymous'}</p>
                              <p className="text-xs font-medium text-slate-400 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="relative inline-block">
                            <select 
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              disabled={updatingId === user.id}
                              className="appearance-none bg-slate-100 border-none rounded-xl py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                              <option value={UserRole.ADMIN}>Admin</option>
                              <option value={UserRole.TEACHER}>Teacher</option>
                              <option value={UserRole.PARENT}>Parent</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {user.role === UserRole.TEACHER ? (
                            <div className="relative">
                              <select 
                                value={user.linkedId || 'none'}
                                onChange={(e) => handleLinkChange(user.id, e.target.value)}
                                disabled={updatingId === user.id}
                                className={`w-full appearance-none bg-indigo-50 border border-indigo-100 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all ${
                                  user.linkedId ? 'text-indigo-700' : 'text-slate-400'
                                }`}
                              >
                                <option value="none">-- Not Linked --</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                                ))}
                              </select>
                              <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300 pointer-events-none" />
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Manual Linking Disabled</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-8 py-24 text-center">
                          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No matching users found.</p>
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
              <LinkIcon className="w-5 h-5" />
              <span>Linking Logic</span>
            </h3>
            <div className="space-y-4 text-xs font-bold text-indigo-100 leading-relaxed uppercase tracking-wide">
              <p>1. Onboard Teacher in "Teachers" tab first.</p>
              <p>2. Ask teacher to sign up for an account.</p>
              <p>3. Use this page to link their login to the record.</p>
              <p className="mt-4 pt-4 border-t border-white/10 text-white italic">Without linking, teachers see 0 students.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
