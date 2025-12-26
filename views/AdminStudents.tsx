
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Download,
  Filter,
  CheckCircle,
  XCircle,
  ChevronDown,
  Users,
  AlertTriangle,
  X,
  Loader2,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types';
import { supabase } from '../supabase';

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    parentName: '',
    parentEmail: '',
    rollNo: '',
    feesDue: 0
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
        
      if (error) throw error;

      if (data) {
        const mapped: Student[] = data.map(s => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          parentName: s.parent_name,
          parentId: '', 
          teacherId: s.teacher_id,
          rollNo: s.roll_no,
          feesDue: s.fees_due ?? 0
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const availableGrades = useMemo(() => {
    const grades = students.map(s => s.grade);
    return ['All', ...Array.from(new Set(grades))];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.rollNo.includes(searchQuery);
      const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
      const matchesFee = feeStatusFilter === 'All' || 
                        (feeStatusFilter === 'Paid' && (s.feesDue ?? 0) === 0) || 
                        (feeStatusFilter === 'Due' && (s.feesDue ?? 0) > 0);
      return matchesSearch && matchesGrade && matchesFee;
    });
  }, [students, searchQuery, selectedGrade, feeStatusFilter]);

  const handleEdit = async (student: Student) => {
    setModalError(null);
    setEditingStudent(student);
    const { data } = await supabase.from('students').select('parent_email').eq('id', student.id).single();
    setFormData({
      name: student.name,
      grade: student.grade,
      parentName: student.parentName,
      parentEmail: data?.parent_email || '',
      rollNo: student.rollNo,
      feesDue: student.feesDue ?? 0
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
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

      // Check for duplicate roll number in local state first for instant feedback
      const localDuplicate = students.find(s => s.rollNo === trimmedRollNo && (!editingStudent || s.id !== editingStudent.id));
      
      if (localDuplicate) {
        const msg = `Student "${localDuplicate.name}" already exists with Roll Number ${trimmedRollNo}.`;
        setModalError(msg);
        alert(`Action Blocked: ${msg}`);
        setIsSubmitting(false);
        return;
      }

      // Deep verification with Database
      const { data: existingStudentWithRoll, error: checkError } = await supabase
        .from('students')
        .select('id, name')
        .eq('roll_no', trimmedRollNo)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingStudentWithRoll && (!editingStudent || existingStudentWithRoll.id !== editingStudent.id)) {
        const msg = `Student "${existingStudentWithRoll.name}" already exists with Roll Number ${trimmedRollNo}.`;
        setModalError(msg);
        alert(`Action Blocked: ${msg}`);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        grade: formData.grade.trim(),
        parent_name: formData.parentName.trim(),
        parent_email: formData.parentEmail.toLowerCase().trim(),
        roll_no: trimmedRollNo,
        fees_due: formData.feesDue
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

      await fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (err: any) {
      console.error("Student persistence error details:", err);
      const errorMsg = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
      setModalError(errorMsg);
      alert(`Persistence Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500 font-medium">Manage records in real-time via Supabase Cloud.</p>
        </div>
        <button 
          onClick={() => {
            setModalError(null);
            setEditingStudent(null);
            setFormData({ name: '', grade: '', parentName: '', parentEmail: '', rollNo: '', feesDue: 0 });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Student</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select 
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {availableGrades.map(grade => (
                <option key={grade} value={grade} className="text-slate-900 font-bold">{grade === 'All' ? 'All Classes' : `Class ${grade}`}</option>
              ))}
            </select>
            <select 
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All" className="text-slate-900 font-bold">All Fee Status</option>
              <option value="Paid" className="text-slate-900 font-bold">Paid Only</option>
              <option value="Due" className="text-slate-900 font-bold">With Dues</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Querying Students...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Roll No</th>
                  <th className="px-6 py-5">Student</th>
                  <th className="px-6 py-5">Grade</th>
                  <th className="px-6 py-5">Fee Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-indigo-600 text-sm">#{student.rollNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold uppercase">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded-md">{student.grade}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${(student.feesDue ?? 0) === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {(student.feesDue ?? 0) === 0 ? 'Paid' : `₹${(student.feesDue ?? 0).toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => handleEdit(student)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { setStudentToDelete(student); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">{editingStudent ? 'Update Profile' : 'New Enrollment'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start space-x-3 mb-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold">{modalError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Student Full Name</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required disabled={isSubmitting} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Roll No</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} required disabled={isSubmitting} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Grade / Class</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} placeholder="e.g. 10th" required disabled={isSubmitting} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Parent Full Name</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} required disabled={isSubmitting} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    <span>Parent Email</span>
                    <span className="text-[10px] text-indigo-500 italic lowercase">Used for parent portal login</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} placeholder="parent@example.com" required disabled={isSubmitting} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fee Balance (₹)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.feesDue} onChange={e => setFormData({...formData, feesDue: parseInt(e.target.value) || 0})} disabled={isSubmitting} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                <span>{isSubmitting ? 'Processing...' : (editingStudent ? 'Update Database' : 'Confirm Enrollment')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50"><AlertTriangle className="w-10 h-10" /></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete student?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Permanently delete <span className="font-bold text-slate-900">"{studentToDelete?.name}"</span> from Supabase cloud database.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="px-6 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Delete Permanently</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
