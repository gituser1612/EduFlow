
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
        setTeacher({
          id: teacherData.id,
          name: teacherData.name,
          subject: teacherData.subject
        });
        
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
      alert("No students with pending dues found.");
      return;
    }

    const header = "Roll No,Student Name,Pending Fees (INR)\n";
    const csvContent = "data:text/csv;charset=utf-8," + header + reportData.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `My_Students_Dues_Report.csv`);
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
          <h1 className="text-2xl font-black text-slate-900">Faculty Workspace</h1>
          <p className="text-slate-500 font-medium">Synced Attendance & Fees • {teacher?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={downloadDuesReport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">My Students</p>
          <p className="text-3xl font-black text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-10" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-3xl font-black text-rose-600">₹{students.reduce((acc, s) => acc + (s.feesDue || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Attendance Register</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Marking daily attendance for all assigned students.</p>
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
          <div className="bg-emerald-500 text-white p-4 text-center text-sm font-black animate-in fade-in">
            ✓ Attendance successfully updated!
          </div>
        )}

        <div className="overflow-x-auto">
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
              {students.length > 0 ? students.map((student) => (
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
                    No students assigned to your profile yet.
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
