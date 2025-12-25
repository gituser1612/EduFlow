
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
  Loader2
} from 'lucide-react';
import { Student } from '../types';
import { supabase } from '../supabase';

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    parentName: '',
    rollNo: '',
    feesDue: 0
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
      
    if (data) setStudents(data);
    setIsLoading(false);
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

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade,
      parentName: student.parentName,
      rollNo: student.rollNo,
      feesDue: student.feesDue ?? 0
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);
        
      if (!error) {
        setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
      } else {
        alert(error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      const { data, error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          grade: formData.grade,
          parentName: formData.parentName,
          rollNo: formData.rollNo,
          feesDue: formData.feesDue
        })
        .eq('id', editingStudent.id)
        .select();
        
      if (!error) {
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? data[0] : s));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          grade: formData.grade,
          parentName: formData.parentName,
          rollNo: formData.rollNo,
          feesDue: formData.feesDue,
          teacher_id: 't1' // default
        }])
        .select();
        
      if (!error) {
        setStudents(prev => [data[0], ...prev]);
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500">Manage records in real-time via Supabase Cloud.</p>
        </div>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setFormData({ name: '', grade: '', parentName: '', rollNo: '', feesDue: 0 });
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
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select 
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {availableGrades.map(grade => (
                <option key={grade} value={grade}>{grade === 'All' ? 'All Classes' : `Class ${grade}`}</option>
              ))}
            </select>
            <select 
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All">All Fee Status</option>
              <option value="Paid">Paid Only</option>
              <option value="Due">With Dues</option>
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
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">{editingStudent ? 'Update Profile' : 'New Enrollment'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Roll No</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Grade</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} placeholder="e.g. 10th" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fee Balance (₹)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.feesDue} onChange={e => setFormData({...formData, feesDue: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{editingStudent ? 'Update Database' : 'Confirm Enrollment'}</span>
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
