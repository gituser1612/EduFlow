
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
  AlertTriangle
} from 'lucide-react';
import { TEACHERS } from '../constants';
import { Teacher } from '../types';

const STORAGE_KEY = 'eduflow_teachers_data';

const AdminTeachers: React.FC = () => {
  // Initialize state from localStorage or fallback to constants
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : TEACHERS;
  });

  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newClass, setNewClass] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // New Teacher Form State
  const [onboardData, setOnboardData] = useState({
    name: '',
    subject: ''
  });

  // Sync state to localStorage whenever teachers array changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
  }, [teachers]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeacher: Teacher = {
      id: `t${Date.now()}`,
      name: onboardData.name,
      subject: onboardData.subject,
      assignedClasses: []
    };
    setTeachers(prev => [newTeacher, ...prev]);
    setOnboardData({ name: '', subject: '' });
    setIsOnboardModalOpen(false);
  };

  const addClassToTeacher = (teacherId: string) => {
    if (!newClass.trim()) return;
    setTeachers(prev => prev.map(t => 
      t.id === teacherId 
        ? { ...t, assignedClasses: [...new Set([...t.assignedClasses, newClass])] } 
        : t
    ));
    setNewClass('');
  };

  const removeClassFromTeacher = (teacherId: string, className: string) => {
    setTeachers(prev => prev.map(t => 
      t.id === teacherId 
        ? { ...t, assignedClasses: t.assignedClasses.filter(c => c !== className) } 
        : t
    ));
  };

  const openDeleteConfirmation = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
          <p className="text-slate-500">Assign faculty to specific grades and subjects.</p>
        </div>
        <button 
          onClick={() => setIsOnboardModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          <span>Onboard Teacher</span>
        </button>
      </div>

      {/* Search Bar */}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <UserSquare2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{teacher.name}</h3>
                  <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>{teacher.subject} Specialist</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => openDeleteConfirmation(teacher)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assigned Classes</h4>
                <div className="flex flex-wrap gap-2">
                  {teacher.assignedClasses.map((cls) => (
                    <div key={cls} className="flex items-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl group">
                      <Hash className="w-3 h-3 text-slate-400 mr-1" />
                      <span className="text-sm font-bold text-slate-700">{cls}</span>
                      <button 
                        onClick={() => removeClassFromTeacher(teacher.id, cls)}
                        className="ml-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
                    placeholder="Class name (e.g. 11th B)" 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedTeacherId === teacher.id ? newClass : ''}
                    onChange={(e) => {
                      setSelectedTeacherId(teacher.id);
                      setNewClass(e.target.value);
                    }}
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
          <div className="xl:col-span-2 py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <UserSquare2 className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No teachers found matching your search</p>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOnboardModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">Onboard New Teacher</h3>
              <button onClick={() => setIsOnboardModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleOnboardSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                  value={onboardData.name}
                  onChange={e => setOnboardData({...onboardData, name: e.target.value})}
                  required
                  placeholder="e.g. Dr. Sarah Connor"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Specialization / Subject</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                  value={onboardData.subject}
                  onChange={e => setOnboardData({...onboardData, subject: e.target.value})}
                  required
                  placeholder="e.g. Physics"
                />
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Onboard Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Remove Faculty?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                You are about to remove <span className="font-bold text-slate-900">"{teacherToDelete?.name}"</span> from the active faculty records. All class assignments will be cleared.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-6 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-8 py-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 mr-1.5" /> Authorization Required
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Master Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <LayoutList className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-bold">Faculty Master Schedule</h3>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4">Specialization</th>
                      <th className="px-6 py-4">Classes Assigned</th>
                      <th className="px-6 py-4 text-center">Load Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-indigo-600">{t.subject}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {t.assignedClasses.map(c => (
                              <span key={c} className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600">{c}</span>
                            ))}
                            {t.assignedClasses.length === 0 && <span className="text-xs text-slate-400 italic">Unassigned</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center space-x-2">
                             <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-indigo-600" 
                                 style={{ width: `${Math.min(t.assignedClasses.length * 33, 100)}%` }}
                               ></div>
                             </div>
                             <span className="text-xs font-bold text-slate-500">{t.assignedClasses.length}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Card */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Calendar className="w-48 h-48" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Coverage</p>
            <p className="text-3xl font-bold">100%</p>
            <p className="text-indigo-200 text-sm mt-1">All classes have assigned teachers.</p>
          </div>
          <div>
            <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Teacher:Student</p>
            <p className="text-3xl font-bold">1 : 15</p>
            <p className="text-indigo-200 text-sm mt-1">Healthy learning environment ratio.</p>
          </div>
          <div className="flex flex-col justify-center">
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-white text-indigo-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20"
            >
              <span>View Full Faculty Schedule</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default AdminTeachers;
