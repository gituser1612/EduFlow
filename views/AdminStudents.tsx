
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
  X
} from 'lucide-react';
import { STUDENTS } from '../constants';
import { Student } from '../types';

const STORAGE_KEY = 'eduflow_students_data';

const AdminStudents: React.FC = () => {
  // Initialize state from localStorage or fallback to constants
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : STUDENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    parentName: '',
    rollNo: '',
    feesDue: 0
  });

  // Sync state to localStorage whenever students array changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  // Get unique grades for the filter dropdown
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
                        (feeStatusFilter === 'Paid' && s.feesDue === 0) || 
                        (feeStatusFilter === 'Due' && s.feesDue > 0);

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
      feesDue: student.feesDue
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirmation = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s));
    } else {
      const newStudent: Student = {
        id: `s${Date.now()}`,
        ...formData,
        parentId: 'p' + Date.now(),
        teacherId: 't1' // default assignment
      };
      setStudents(prev => [newStudent, ...prev]);
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const exportData = () => {
    alert('Exporting current student directory to Excel...');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500">Manage student records, class enrollments and fee status.</p>
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

      {/* Advanced Filters UI */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Filter className="w-4 h-4" />
              </div>
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-10 text-sm text-black font-semibold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {availableGrades.map(grade => (
                  <option key={grade} value={grade}>{grade === 'All' ? 'All Classes' : `Class ${grade}`}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={feeStatusFilter}
                onChange={(e) => setFeeStatusFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-black font-semibold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Fee Status</option>
                <option value="Paid">Paid Only</option>
                <option value="Due">With Dues</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button 
              onClick={exportData}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Roll No</th>
                <th className="px-6 py-5">Student</th>
                <th className="px-6 py-5">Grade</th>
                <th className="px-6 py-5">Parent</th>
                <th className="px-6 py-5">Fee Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-indigo-600">#{student.rollNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.parentName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${student.feesDue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {student.feesDue === 0 ? 'Paid' : `Due: ₹${student.feesDue.toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => handleEdit(student)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteConfirmation(student)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <Users className="w-12 h-12" />
                      <p className="text-lg font-bold">No students found matching filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">{editingStudent ? 'Edit Student Record' : 'Add New Student'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Student Name</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Grade/Class</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                    placeholder="e.g. 10th"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Roll Number</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.rollNo}
                    onChange={e => setFormData({...formData, rollNo: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Parent Name</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.parentName}
                    onChange={e => setFormData({...formData, parentName: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Fees Due (₹)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-black outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.feesDue}
                    onChange={e => setFormData({...formData, feesDue: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{editingStudent ? 'Update Record' : 'Add Student'}</span>
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
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Student?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                You are about to permanently remove <span className="font-bold text-slate-900">"{studentToDelete?.name}"</span> from the database. This action cannot be undone.
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
                  Yes, Delete
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-8 py-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 mr-1.5" /> Secure Confirmation Required
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default AdminStudents;
