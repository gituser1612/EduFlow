
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  FileDown,
  Wallet,
  CloudCheck,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { AttendanceStatus, Teacher, Student } from '../types';
import { supabase } from '../supabase';

interface TeacherDashboardProps {
  teacherId: string | null;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherId }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [markedToday, setMarkedToday] = useState<Record<string, AttendanceStatus>>({});
  const [initialMarks, setInitialMarks] = useState<Record<string, AttendanceStatus>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTodayAttendance = useCallback(async (studentIds: string[]) => {
    if (studentIds.length === 0) return;
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
    if (!teacherId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: teacherData, error: tError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (tError) throw tError;

      if (teacherData) {
        setTeacher({
          id: teacherData.id,
          name: teacherData.name,
          subject: teacherData.subject
        });
        
        // Fetch students assigned to this specific teacher record
        const { data: studentsData, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('teacher_id', teacherId);

        if (sError) throw sError;

        if (studentsData) {
          const mappedStudents = studentsData.map(s => ({
            id: s.id,
            name: s.name,
            parentName: s.parent_name,
            rollNo: s.roll_no,
            feesDue: s.fees_due ?? 0,
            teacherId: s.teacher_id,
            parentId: ''
          }));
          setStudents(mappedStudents);
          await fetchTodayAttendance(mappedStudents.map(s => s.id));
        }
      }
    } catch (err: any) {
      console.error("Dashboard sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [teacherId]);

  const handleMark = (student_id: string, status: AttendanceStatus) => {
    setMarkedToday(prev => ({ ...prev, [student_id]: status }));
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
    const reportData = students
      .filter(s => (s.feesDue ?? 0) > 0)
      .map(s => `${s.rollNo},${s.name},${s.feesDue}`);
    
    if (reportData.length === 0) {
      alert("All students have cleared their dues!");
      return;
    }

    const header = "Roll No,Student Name,Pending Fees (INR)\n";
    const csvContent = "data:text/csv;charset=utf-8," + header + reportData.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dues_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(markedToday) !== JSON.stringify(initialMarks);
  }, [markedToday, initialMarks]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Verifying Faculty Connection...</p>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
          <LinkIcon className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Profile Not Linked</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your user account hasn't been linked to a Teacher record yet. Please ask the <span className="text-indigo-600 font-bold">Administrator</span> to link your profile in the "Access Control" terminal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Workspace</h1>
          <p className="text-slate-500 font-medium">Hello, {teacher?.name || 'Instructor'}. Monitoring {students.length} students.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={downloadDuesReport}
            className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4 text-indigo-600" />
            <span>Dues Export</span>
          </button>
          <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center space-x-3 shadow-sm ring-4 ring-slate-50/50">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Students Under Care</p>
          <p className="text-4xl font-black text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Outstanding Dues</p>
          <p className="text-4xl font-black text-rose-600">₹{students.reduce((acc, s) => acc + (s.feesDue || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Clock className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendance Register</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status reflects to parent instantly</p>
             </div>
          </div>
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
            <span>{isSubmitting ? 'Syncing...' : hasUnsavedChanges ? 'Save Changes' : 'Synced'}</span>
          </button>
        </div>

        {showConfirm && (
          <div className="bg-emerald-600 text-white p-4 text-center text-xs font-black uppercase tracking-widest animate-in fade-in">
            ✓ Records successfully archived to cloud
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Roll ID</th>
                <th className="px-8 py-5">Student Details</th>
                <th className="px-8 py-5">Monthly Dues</th>
                <th className="px-8 py-5 text-center">Register Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.length > 0 ? students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-sm font-black text-indigo-600">#{student.rollNo}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border ${
                      (student.feesDue ?? 0) > 0 
                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
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
                          className={`p-3 rounded-2xl transition-all duration-300 ${
                            markedToday[student.id] === status 
                              ? (status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-50' : 
                                 status === 'ABSENT' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 ring-4 ring-rose-50' : 
                                 'bg-amber-600 text-white shadow-lg shadow-amber-200 ring-4 ring-amber-50')
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
                  <td colSpan={4} className="px-8 py-32 text-center text-slate-400 font-black uppercase text-xs tracking-[0.2em]">
                    No students currently assigned to your roster.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
