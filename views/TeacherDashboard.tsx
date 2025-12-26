
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  BookOpen,
  Filter,
  Loader2,
  Info,
  AlertCircle,
  FileDown,
  Wallet,
  CloudCheck
} from 'lucide-react';
import { AttendanceStatus, Teacher, Student } from '../types';
import { supabase } from '../supabase';

interface TeacherDashboardProps {
  teacherId: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherId }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [markedToday, setMarkedToday] = useState<Record<string, AttendanceStatus>>({});
  const [initialMarks, setInitialMarks] = useState<Record<string, AttendanceStatus>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTodayAttendance = useCallback(async (studentIds: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', today)
        .in('student_id', studentIds);

      if (!error && data) {
        const marks: Record<string, AttendanceStatus> = {};
        data.forEach(item => {
          marks[item.student_id] = item.status as AttendanceStatus;
        });
        setMarkedToday(marks);
        setInitialMarks(marks);
      }
    } catch (err) {
      console.error("Error fetching today's marks:", err);
    }
  }, []);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      const { data: teacherData, error: tError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (tError) throw tError;

      if (teacherData) {
        const assigned = teacherData.assigned_classes || [];
        setTeacher({
          id: teacherData.id,
          name: teacherData.name,
          subject: teacherData.subject,
          assignedClasses: assigned
        });
        
        if (assigned.length > 0) {
          setSelectedClass(assigned[0]);
          
          const { data: studentsData, error: sError } = await supabase
            .from('students')
            .select('*')
            .in('grade', assigned);

          if (sError) throw sError;

          if (studentsData) {
            const mappedStudents = studentsData.map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              parentName: s.parent_name,
              rollNo: s.roll_no,
              feesDue: s.fees_due ?? 0,
              teacherId: s.teacher_id,
              parentId: ''
            }));
            setStudents(mappedStudents);
            
            // Sync current state from DB for existing marks
            await fetchTodayAttendance(mappedStudents.map(s => s.id));
          }
        }
      }
    } catch (err: any) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchTeacherData();
    } else {
      setIsLoading(false);
    }
  }, [teacherId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      selectedClass === 'All' || s.grade === selectedClass
    );
  }, [students, selectedClass]);

  const classStats = useMemo(() => {
    if (!teacher) return [];
    return teacher.assignedClasses.map(cls => ({
      name: cls,
      studentCount: students.filter(s => s.grade === cls).length,
      totalDues: students.filter(s => s.grade === cls).reduce((sum, s) => sum + (s.feesDue || 0), 0)
    }));
  }, [teacher, students]);

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarkedToday(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    const entries = Object.entries(markedToday);
    if (entries.length === 0) return;
    
    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const records = entries.map(([studentId, status]) => ({
        student_id: studentId,
        date: today,
        status: status,
        notes: '' 
      }));

      // Use UPSERT with conflict on student_id and date
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,date' });

      if (error) throw error;

      setShowConfirm(true);
      setInitialMarks({...markedToday});
      setTimeout(() => setShowConfirm(false), 3000);
    } catch (err: any) {
      alert("Submission Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadDuesReport = () => {
    const reportData = filteredStudents
      .filter(s => (s.feesDue ?? 0) > 0)
      .map(s => `${s.rollNo},${s.name},${s.grade},${s.feesDue}`);
    
    if (reportData.length === 0) {
      alert("No students with pending dues found in this class.");
      return;
    }

    const header = "Roll No,Student Name,Grade,Pending Fees (INR)\n";
    const csvContent = "data:text/csv;charset=utf-8," + header + reportData.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dues_Report_Class_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(markedToday) !== JSON.stringify(initialMarks);
  }, [markedToday, initialMarks]);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Restoring Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Teacher's Workspace</h1>
          <p className="text-slate-500 font-medium">Synced Attendance & Fees • {teacher?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={downloadDuesReport}
            className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4 text-indigo-600" />
            <span>Export Dues</span>
          </button>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center space-x-3 shadow-sm ring-4 ring-slate-50/50">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-slate-700">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <BookOpen className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Classes</p>
          <p className="text-3xl font-black text-slate-900">{teacher?.assignedClasses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</p>
          <p className="text-3xl font-black text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Pending Fees</p>
          <p className="text-3xl font-black text-rose-600">₹{students.reduce((acc, s) => acc + (s.feesDue || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center space-x-2 text-indigo-400 uppercase text-[10px] tracking-widest">
              <Filter className="w-3.5 h-3.5" />
              <span>Select Grade</span>
            </h3>
            <div className="space-y-2">
              {classStats.map(stat => (
                <button 
                  key={stat.name} 
                  onClick={() => setSelectedClass(stat.name)} 
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                    selectedClass === stat.name 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-sm font-bold block">Class {stat.name}</span>
                    <span className={`text-[10px] ${selectedClass === stat.name ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {stat.studentCount} Students
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
            <h4 className="flex items-center space-x-2 text-emerald-900 font-black text-xs uppercase mb-3">
              <CloudCheck className="w-4 h-4" />
              <span>Live Sync</span>
            </h4>
            <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
              Updates are reflected in the Parent Dashboard instantly upon saving. Corrections are allowed.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Attendance Register</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Grade: <span className="text-indigo-600 font-bold uppercase">{selectedClass}</span>
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={submitAttendance} 
                  disabled={!hasUnsavedChanges || isSubmitting} 
                  className={`px-8 py-3.5 font-black rounded-2xl transition-all shadow-xl flex items-center space-x-2 ${
                    hasUnsavedChanges 
                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' 
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-default'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudCheck className="w-5 h-5" />}
                  <span>{isSubmitting ? 'Syncing...' : hasUnsavedChanges ? 'Save Changes' : 'Synced with Cloud'}</span>
                </button>
              </div>
            </div>

            {showConfirm && (
              <div className="bg-emerald-500 text-white p-4 text-center text-sm font-black animate-in fade-in slide-in-from-top-2">
                ✓ Attendance successfully updated and sent to parents!
              </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Roll No.</th>
                    <th className="px-8 py-5">Student</th>
                    <th className="px-8 py-5">Fees Dues</th>
                    <th className="px-8 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 text-sm font-black text-indigo-600">#{student.rollNo}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-black text-slate-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                          (student.feesDue ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          ₹{(student.feesDue ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center space-x-2">
                          {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE].map(status => (
                            <button 
                              key={status} 
                              onClick={() => handleMark(student.id, status)} 
                              title={status}
                              className={`p-2.5 rounded-xl transition-all duration-300 ${
                                markedToday[student.id] === status 
                                  ? (status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 
                                     status === 'ABSENT' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 
                                     'bg-amber-600 text-white shadow-lg shadow-amber-200')
                                  : 'bg-slate-100 text-slate-300 hover:text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {status === AttendanceStatus.PRESENT ? <CheckCircle2 className="w-5 h-5" /> : 
                               status === AttendanceStatus.ABSENT ? <XCircle className="w-5 h-5" /> : 
                               <Clock className="w-5 h-5" />}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                        No students found in this grade.
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
