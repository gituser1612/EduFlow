
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserSquare2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Hash,
  BookOpen,
  ArrowRight,
  X,
  Search,
  LayoutList,
  Calendar,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Mail,
  Info
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
  const [newClass, setNewClass] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
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
          email: t.email,
          assignedClasses: t.assigned_classes || []
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
      const teacherEmail = onboardData.email.toLowerCase().trim();
      
      // 1. Insert teacher
      const { data, error } = await supabase
        .from('teachers')
        .insert([{
          name: onboardData.name.trim(),
          subject: onboardData.subject.trim(),
          email: teacherEmail,
          assigned_classes: []
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const onboarded = {
          id: data[0].id,
          name: data[0].name,
          subject: data[0].subject,
          email: data[0].email,
          assignedClasses: data[0].assigned_classes || []
        };
        setTeachers(prev => [onboarded, ...prev]);
        
        // 2. Clear form and close modal
        setOnboardData({ name: '', subject: '', email: '' });
        setIsOnboardModalOpen(false);
      } else {
        await fetchTeachers();
        setIsOnboardModalOpen(false);
      }

    } catch (err: any) {
      console.error("Supabase Operation Failed:", err);
      
      // Robust error extraction to avoid [object Object]
      let message = "Onboarding failed.";
      if (err.message) {
        message = err.message;
      } else if (err.error_description) {
        message = err.error_description;
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      }
      
      alert(`Onboarding Error: ${message}\n\nDetails: ${err.details || 'None'}\nHint: ${err.hint || 'Check table columns'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addClassToTeacher = async (teacherId: string) => {
    if (!newClass.trim()) return;
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const normalizedClass = newClass.trim();
    const updatedClasses = [...new Set([...teacher.assignedClasses, normalizedClass])];
    
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ assigned_classes: updatedClasses })
        .eq('id', teacherId);

      if (error) throw error;

      setTeachers(prev => prev.map(t => 
        t.id === teacherId ? { ...t, assignedClasses: updatedClasses } : t
      ));
      setNewClass('');
    } catch (err: any) {
      alert(err.message || "Failed to update classes");
    }
  };

  const removeClassFromTeacher = async (teacherId: string, className: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const updatedClasses = teacher.assignedClasses.filter(c => c !== className);
    
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ assigned_classes: updatedClasses })
        .eq('id', teacherId);

      if (error) throw error;

      setTeachers(prev => prev.map(t => 
        t.id === teacherId ? { ...t, assignedClasses: updatedClasses } : t
      ));
    } catch (err: any) {
      alert(err.message || "Failed to remove class");
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
          <p className="text-slate-500">Cloud-synced faculty records for your institute.</p>
        </div>
        <button 
          onClick={() => setIsOnboardModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          <span>Onboard Teacher</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search teachers by name or subject..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching Faculty...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <UserSquare2 className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-slate-900 truncate">{teacher.name}</h3>
                    <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{teacher.email || 'No email set'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setTeacherToDelete(teacher); setIsDeleteModalOpen(true); }}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Grades</h4>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-medium">
                        Enter exact grade values (e.g., "9th", "10th"). Ensure these match the Student records exactly.
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {teacher.assignedClasses.map((cls) => (
                      <div key={cls} className="flex items-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl group">
                        <Hash className="w-3 h-3 text-slate-400 mr-1" />
                        <span className="text-sm font-bold text-slate-700">{cls}</span>
                        <button 
                          onClick={() => removeClassFromTeacher(teacher.id, cls)}
                          className="ml-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {teacher.assignedClasses.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No classes assigned yet.</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 9th or 10th" 
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedTeacherId === teacher.id ? newClass : ''}
                      onChange={(e) => {
                        setSelectedTeacherId(teacher.id);
                        setNewClass(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && addClassToTeacher(teacher.id)}
                    />
                    <button 
                      onClick={() => addClassToTeacher(teacher.id)}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="xl:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <UserSquare2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">No teachers found matching your search</p>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsOnboardModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">Onboard New Teacher</h3>
              <button onClick={() => !isSubmitting && setIsOnboardModalOpen(false)} disabled={isSubmitting} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleOnboardSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500" value={onboardData.name} onChange={e => setOnboardData({...onboardData, name: e.target.value})} required placeholder="e.g. Raj Sharma" disabled={isSubmitting} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email (Must match login email)</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500" value={onboardData.email} onChange={e => setOnboardData({...onboardData, email: e.target.value})} required placeholder="e.g. raj@eduflow.com" disabled={isSubmitting} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Specialization / Subject</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500" value={onboardData.subject} onChange={e => setOnboardData({...onboardData, subject: e.target.value})} required placeholder="e.g. Mathematics" disabled={isSubmitting} />
              </div>
              <div className="pt-6">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  <span>{isSubmitting ? 'Processing...' : 'Onboard Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50"><AlertTriangle className="w-10 h-10" /></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Remove Faculty?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">You are about to remove <span className="font-bold text-slate-900">"{teacherToDelete?.name}"</span> from the active records.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="px-6 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Yes, Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
