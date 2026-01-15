
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserSquare2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  BookOpen,
  X,
  Search,
  Loader2,
  Mail,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Teacher } from '../types';
import { supabase } from '../supabase';

const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const [onboardData, setOnboardData] = useState({
    name: '',
    subject: '',
    email: ''
  });

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const mapped = data.map(t => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          email: t.email
        }));
        setTeachers(mapped);
      }
    } catch (err: any) {
      console.error("Fetch teachers error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [teachers, searchQuery]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .insert([{
          name: onboardData.name.trim(),
          subject: onboardData.subject.trim(),
          email: onboardData.email.toLowerCase().trim()
        }]);

      if (error) throw error;

      await fetchTeachers();
      setOnboardData({ name: '', subject: '', email: '' });
      setIsOnboardModalOpen(false);
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherToDelete.id);
        
      if (error) throw error;
      setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete teacher");
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Teacher</h1>
          <p className="text-slate-500 font-medium">Cloud-synced faculty directory.</p>
        </div>
        <button 
          onClick={() => setIsOnboardModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
        >
          <Plus className="w-5 h-5" />
          <span>Onboard Teacher</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search faculty by name or subject..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Fetching Faculty...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <UserSquare2 className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{teacher.name}</h3>
                    <div className="flex flex-col space-y-1 mt-1">
                      <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{teacher.subject}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400 font-medium text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setTeacherToDelete(teacher); setIsDeleteModalOpen(true); }} 
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsOnboardModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-indigo-600 text-white flex items-center justify-between">
              <h3 className="text-xl font-black">Onboard Teacher</h3>
              <button onClick={() => !isSubmitting && setIsOnboardModalOpen(false)}><X className="w-6 h-6 text-white" /></button>
            </div>
            <form onSubmit={handleOnboardSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-slate-900 font-black placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Full Name" value={onboardData.name} onChange={e => setOnboardData({...onboardData, name: e.target.value})} required />
                <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-slate-900 font-black placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email Address" value={onboardData.email} onChange={e => setOnboardData({...onboardData, email: e.target.value})} required />
                <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-slate-900 font-black placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Subject" value={onboardData.subject} onChange={e => setOnboardData({...onboardData, subject: e.target.value})} required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{isSubmitting ? 'Syncing...' : 'Complete Onboarding'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50"><AlertTriangle className="w-10 h-10 text-rose-500" /></div>
            <h3 className="text-2xl font-black text-slate-900">Remove Faculty?</h3>
            <p className="text-slate-500 font-medium">This will remove <span className="font-black text-slate-900">"{teacherToDelete?.name}"</span> and all their current assignments.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="bg-slate-100 py-4 rounded-2xl font-black text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="bg-rose-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
