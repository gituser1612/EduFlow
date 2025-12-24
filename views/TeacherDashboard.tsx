
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MessageSquare,
  BookOpen,
  Filter,
  ChevronDown
} from 'lucide-react';
import { STUDENTS, TEACHERS } from '../constants';
import { AttendanceStatus, Teacher, Student } from '../types';

interface TeacherDashboardProps {
  teacherId: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherId }) => {
  const teacher = useMemo(() => TEACHERS.find(t => t.id === teacherId), [teacherId]);
  const assignedClasses = teacher?.assignedClasses || [];
  
  // State for class filtering
  const [selectedClass, setSelectedClass] = useState<string>(assignedClasses[0] || 'All');
  const [markedToday, setMarkedToday] = useState<Record<string, AttendanceStatus>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter students based on teacher and selected class
  const filteredStudents = useMemo(() => {
    return STUDENTS.filter(s => 
      s.teacherId === teacherId && 
      (selectedClass === 'All' || s.grade === selectedClass)
    );
  }, [teacherId, selectedClass]);

  // Calculate statistics per class
  const classStats = useMemo(() => {
    return assignedClasses.map(cls => ({
      name: cls,
      studentCount: STUDENTS.filter(s => s.teacherId === teacherId && s.grade === cls).length
    }));
  }, [assignedClasses, teacherId]);

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarkedToday(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = () => {
    // In a real app, this would be an API call. 
    // We'll simulate persistence using localStorage so Admin can "reflect" it.
    const today = new Date().toISOString().split('T')[0];
    const existingRecords = JSON.parse(localStorage.getItem('eduflow_attendance_log') || '[]');
    
    const newRecords = Object.entries(markedToday).map(([studentId, status]) => ({
      id: `att-${Date.now()}-${studentId}`,
      studentId,
      date: today,
      status,
      class: selectedClass
    }));

    const updatedRecords = [...existingRecords, ...newRecords];
    localStorage.setItem('eduflow_attendance_log', JSON.stringify(updatedRecords));

    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
    // Optional: Clear marking after submit or keep it for the session
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher's Workspace</h1>
          <p className="text-slate-500">Welcome back, {teacher?.name}. Manage your classes and attendance.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center space-x-3 shadow-sm">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-slate-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assigned Classes</p>
              <p className="text-3xl font-black text-slate-900">{assignedClasses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Students</p>
              <p className="text-3xl font-black text-slate-900">
                {STUDENTS.filter(s => s.teacherId === teacherId).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Marked Today</p>
              <p className="text-3xl font-black text-slate-900">
                {Object.keys(markedToday).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Summary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Class Breakdown</span>
            </h3>
            <div className="space-y-3">
              {classStats.map(stat => (
                <button 
                  key={stat.name}
                  onClick={() => setSelectedClass(stat.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedClass === stat.name ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  <span className="text-sm font-bold">Class {stat.name}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs">{stat.studentCount} Students</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Register */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance Register</h3>
                <p className="text-sm text-slate-500">Currently viewing Class: <span className="font-bold text-indigo-600">{selectedClass}</span></p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {assignedClasses.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button 
                  onClick={submitAttendance}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  disabled={Object.keys(markedToday).length === 0}
                >
                  Submit Register
                </button>
              </div>
            </div>
            
            {showConfirm && (
              <div className="bg-emerald-50 border-y border-emerald-100 p-4 flex items-center justify-center space-x-2 text-emerald-700 font-bold animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
                <span>Attendance for Class {selectedClass} submitted and synced!</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Roll No.</th>
                    <th className="px-6 py-5">Student Name</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">#{student.rollNo}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-1">
                          {[
                            { status: AttendanceStatus.PRESENT, icon: CheckCircle2, color: 'emerald' },
                            { status: AttendanceStatus.ABSENT, icon: XCircle, color: 'rose' },
                            { status: AttendanceStatus.LATE, icon: Clock, color: 'amber' }
                          ].map((item) => (
                            <button 
                              key={item.status}
                              onClick={() => handleMark(student.id, item.status)}
                              className={`p-2 rounded-xl transition-all ${
                                markedToday[student.id] === item.status 
                                  ? `bg-${item.color}-500 text-white shadow-md ring-2 ring-${item.color}-100` 
                                  : `bg-slate-50 text-slate-400 hover:bg-${item.color}-50 hover:text-${item.color}-500`
                              }`}
                              title={item.status}
                            >
                              <item.icon className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative flex items-center">
                          <MessageSquare className="absolute left-3 w-3.5 h-3.5 text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="Add remark..." 
                            className="bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-xs text-black focus:ring-2 focus:ring-indigo-500 w-full transition-all"
                          />
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 mb-3 opacity-20" />
                          <p className="font-bold">No students found in Class {selectedClass}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
