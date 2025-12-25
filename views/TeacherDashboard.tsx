
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
  ChevronDown,
  Loader2
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    // 1. Fetch Teacher Info
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacherData) {
      setTeacher({
        id: teacherData.id,
        name: teacherData.name,
        subject: teacherData.subject,
        assignedClasses: teacherData.assigned_classes || []
      });
      if (teacherData.assigned_classes?.length > 0) {
        setSelectedClass(teacherData.assigned_classes[0]);
      }
    }

    // 2. Fetch Assigned Students
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('teacher_id', teacherId);

    if (studentsData) {
      setStudents(studentsData.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        parentName: s.parent_name,
        rollNo: s.roll_no,
        feesDue: s.fees_due,
        teacherId: s.teacher_id,
        parentId: '' // We don't necessarily need this here
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeacherData();
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
      studentCount: students.filter(s => s.grade === cls).length
    }));
  }, [teacher, students]);

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarkedToday(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    
    const records = Object.entries(markedToday).map(([studentId, status]) => ({
      student_id: studentId,
      date: today,
      status: status,
      notes: '' 
    }));

    const { error } = await supabase
      .from('attendance')
      .insert(records);

    if (!error) {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
      setMarkedToday({});
    } else {
      alert(error.message);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Classroom...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher's Workspace</h1>
          <p className="text-slate-500">Welcome back, {teacher?.name}. Manage your classes.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center space-x-3 shadow-sm">
          <CalendarCheck className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><BookOpen className="w-7 h-7" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Classes</p><p className="text-3xl font-black text-slate-900">{teacher?.assignedClasses.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Users className="w-7 h-7" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Students</p><p className="text-3xl font-black text-slate-900">{students.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><CheckCircle2 className="w-7 h-7" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Marked Now</p><p className="text-3xl font-black text-slate-900">{Object.keys(markedToday).length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center space-x-2"><Filter className="w-4 h-4 text-indigo-400" /><span>Class Breakdown</span></h3>
            <div className="space-y-3">
              {classStats.map(stat => (
                <button key={stat.name} onClick={() => setSelectedClass(stat.name)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedClass === stat.name ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <span className="text-sm font-bold">Class {stat.name}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg text-xs">{stat.studentCount} Students</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div><h3 className="text-lg font-bold text-slate-900">Attendance Register</h3><p className="text-sm text-slate-500">Viewing: <span className="font-bold text-indigo-600">{selectedClass}</span></p></div>
              <div className="flex items-center space-x-3">
                <button onClick={submitAttendance} disabled={Object.keys(markedToday).length === 0 || isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Register'}
                </button>
              </div>
            </div>
            {showConfirm && <div className="bg-emerald-50 p-4 text-center text-emerald-700 font-bold animate-pulse">✓ Attendance synced to cloud!</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <tr><th className="px-6 py-5">Roll No.</th><th className="px-6 py-5">Student Name</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Remarks</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600">#{student.rollNo}</td>
                      <td className="px-6 py-4 flex items-center space-x-3"><div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">{student.name.charAt(0)}</div><span className="text-sm font-semibold text-slate-900">{student.name}</span></td>
                      <td className="px-6 py-4"><div className="flex space-x-1">
                        {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE].map(status => (
                          <button key={status} onClick={() => handleMark(student.id, status)} className={`p-2 rounded-xl transition-all ${markedToday[student.id] === status ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            {status === AttendanceStatus.PRESENT ? <CheckCircle2 className="w-5 h-5" /> : status === AttendanceStatus.ABSENT ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </button>
                        ))}
                      </div></td>
                      <td className="px-6 py-4"><input type="text" placeholder="Add remark..." className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs w-full" /></td>
                    </tr>
                  ))}
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
