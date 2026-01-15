
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  CheckCircle, 
  Users, 
  AlertTriangle, 
  X, 
  Loader2, 
  Mail, 
  AlertCircle,
  UserSquare2,
  ChevronDown
} from 'lucide-react';
import { Student, Teacher, UserRole } from '../types';
import { supabase } from '../supabase';

interface StudentManagementProps {
  role: UserRole;
  currentUserId?: string; // Teacher ID if role is Teacher
}

const StudentManagement: React.FC<StudentManagementProps> = ({ role, currentUserId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const isAdmin = role === UserRole.ADMIN;

  const [formData, setFormData] = useState({
    name: '',
    parentName: '',
    parentEmail: '',
    rollNo: '',
    feesDue: 0,
    teacherId: ''
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      let studentQuery = supabase.from('students').select('*').order('name');
      
      // If Teacher, only fetch their students
      if (!isAdmin && currentUserId) {
        studentQuery = studentQuery.eq('teacher_id', currentUserId);
      }

      const [studentsRes, teachersRes] = await Promise.all([
        studentQuery,
        supabase.from('teachers').select('*').order('name')
      ]);
        
      if (studentsRes.error) throw studentsRes.error;
      if (teachersRes.error) throw teachersRes.error;

      if (teachersRes.data) {
        setTeachers(teachersRes.data.map(t => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          email: t.email
        })));
      }

      if (studentsRes.data) {
        const mapped: Student[] = studentsRes.data.map(s => ({
          id: s.id,
          name: s.name,
          parentName: s.parent_name,
          parentId: '', 
          teacherId: s.teacher_id,
          rollNo: s.roll_no,
          feesDue: s.fees_due ?? 0
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [role, currentUserId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.rollNo.includes(searchQuery);
      const matchesFee = feeStatusFilter === 'All' || 
                        (feeStatusFilter === 'Paid' && (s.feesDue ?? 0) === 0) || 
                        (feeStatusFilter === 'Due' && (s.feesDue ?? 0) > 0);
      return matchesSearch && matchesFee;
    });
  }, [students, searchQuery, feeStatusFilter]);

  const handleEdit = async (student: Student) => {
    setModalError(null);
    setEditingStudent(student);
    const { data } = await supabase.from('students').select('parent_email').eq('id', student.id).single();
    setFormData({
      name: student.name,
      parentName: student.parentName,
      parentEmail: data?.parent_email || '',
      rollNo: student.rollNo,
      feesDue: student.feesDue ?? 0,
      teacherId: student.teacherId || ''
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !studentToDelete) return;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);
        
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete student");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setModalError(null);
    setIsSubmitting(true);
    
    try {
      const trimmedRollNo = formData.rollNo.trim();
      
      // If teacher adds, default to themselves if they forgot to select (optional safety)
      let targetTeacher = formData.teacherId;
      if (!isAdmin && !targetTeacher) targetTeacher = currentUserId || '';

      const payload = {
        name: formData.name.trim(),
        parent_name: formData.parentName.trim(),
        parent_email: formData.parentEmail.toLowerCase().trim(),
        roll_no: trimmedRollNo,
        fees_due: formData.feesDue,
        teacher_id: targetTeacher || null
      };

      let resultError;
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudent.id);
        resultError = error;
      } else {
        const { error } = await supabase
          .from('students')
          .insert([payload]);
        resultError = error;
      }

      if (resultError) throw resultError;

      await fetchInitialData();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (err: any) {
      console.error("Persistence error:", err);
      setModalError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeacherName = (id: string) => {
    return teachers.find(t => t.id === id)?.name || 'Not Assigned';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Institute Directory' : 'My Student List'}
          </h1>
          <p className="text-slate-500 font-medium">Manage student records and teacher assignments.</p>
        </div>
        <button 
          onClick={() => {
            setModalError(null);
            setEditingStudent(null);
            setFormData({ 
              name: '', 
              parentName: '', 
              parentEmail: '', 
              rollNo: '', 
              feesDue: 0, 
              teacherId: isAdmin ? '' : (currentUserId || '') 
            });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={feeStatusFilter}
            onChange={(e) => setFeeStatusFilter(e.target.value as any)}
            className="bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="All">All Fee Status</option>
            <option value="Paid">Fully Paid</option>
            <option value="Due">Pending Dues</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Accessing Ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Roll ID</th>
                  <th className="px-8 py-5">Student</th>
                  <th className="px-8 py-5">Assigned Faculty</th>
                  <th className="px-8 py-5">Account Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6 font-black text-indigo-600 text-sm">#{student.rollNo}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black uppercase text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <UserSquare2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{getTeacherName(student.teacherId)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black ${(student.feesDue ?? 0) === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {(student.feesDue ?? 0) === 0 ? 'CLEARED' : `₹${(student.feesDue ?? 0).toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleEdit(student)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"><Edit2 className="w-5 h-5" /></button>
                        {isAdmin && (
                          <button onClick={() => { setStudentToDelete(student); setIsDeleteModalOpen(true); }} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No matching records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-black tracking-tight">{editingStudent ? 'Update Profile' : 'Student Enrollment'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {modalError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold">{modalError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Amit Kumar" required disabled={isSubmitting} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Roll ID</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} placeholder="e.g. A001" required disabled={isSubmitting} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assign to Faculty</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      value={formData.teacherId} 
                      onChange={e => setFormData({...formData, teacherId: e.target.value})} 
                      required 
                      disabled={isSubmitting}
                    >
                      <option value="">Select Faculty...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Guardian Name</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} placeholder="Guardian Name" required disabled={isSubmitting} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Guardian Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} placeholder="parent@example.com" required disabled={isSubmitting} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fee Dues (₹)</label>
                  <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.feesDue} onChange={e => setFormData({...formData, feesDue: parseInt(e.target.value) || 0})} disabled={isSubmitting} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{isSubmitting ? 'Syncing...' : (editingStudent ? 'Save Profile' : 'Enroll Student')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50"><AlertTriangle className="w-12 h-12" /></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Delete Profile?</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Permanently purge <span className="font-black text-slate-900">"{studentToDelete?.name}"</span> from the database records.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Keep</button>
              <button onClick={confirmDelete} className="px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-rose-100">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
