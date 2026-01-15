
import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Clock, 
  Calendar, 
  Receipt, 
  History, 
  ChevronRight,
  ShieldCheck,
  Loader2,
  BadgeCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { Student, PaymentRecord, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../supabase';

const DASHBOARD_CACHE_KEY = 'eduflow_parent_multi_child';

interface ParentDashboardProps {
  studentId: string | null;
  view?: 'performance' | 'attendance' | 'payments';
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ view = 'performance' }) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | 'NOT_MARKED'>('NOT_MARKED');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all students linked to this parent's email
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try cache first for instant reload
        const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setChildren(parsed);
          if (!activeStudent) setActiveStudent(parsed[0]);
          setIsLoading(false);
        }

        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('parent_email', user.email);

        if (studentsData && studentsData.length > 0) {
          const mapped = studentsData.map(s => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            parentName: s.parent_name,
            rollNo: s.roll_no,
            feesDue: s.fees_due ?? 0,
            teacherId: s.teacher_id,
            parentId: user.id
          }));
          setChildren(mapped);
          sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(mapped));
          if (!activeStudent) setActiveStudent(mapped[0]);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Fetch data for the active child
  useEffect(() => {
    if (!activeStudent) return;

    const fetchChildData = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        const [attRes, payRes] = await Promise.all([
          supabase.from('attendance').select('*').eq('student_id', activeStudent.id).order('date', { ascending: false }),
          supabase.from('payments').select('*').eq('student_id', activeStudent.id).order('date', { ascending: false })
        ]);

        if (attRes.data) {
          const records = attRes.data.map(a => ({
            id: a.id,
            studentId: a.student_id,
            date: a.date,
            status: a.status as AttendanceStatus,
          }));
          setAttendance(records);
          const todayRec = records.find(r => r.date === today);
          setTodayStatus(todayRec ? todayRec.status : 'NOT_MARKED');
        }

        if (payRes.data) {
          setPayments(payRes.data.map(p => ({
            id: p.id,
            studentId: p.student_id,
            amount: p.amount,
            date: p.date,
            method: p.method as any,
            term: p.term,
            receiptNo: p.receipt_no
          })));
        }
      } catch (err) {
        console.error("Error fetching child data:", err);
      }
    };

    fetchChildData();
  }, [activeStudent]);

  const statusColors = {
    [AttendanceStatus.PRESENT]: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    [AttendanceStatus.ABSENT]: 'bg-rose-50 border-rose-100 text-rose-700',
    [AttendanceStatus.LATE]: 'bg-amber-50 border-amber-100 text-amber-700',
    'NOT_MARKED': 'bg-slate-50 border-slate-100 text-slate-400',
    [AttendanceStatus.EXCUSED]: 'bg-indigo-50 border-indigo-100 text-indigo-700'
  };

  const statusIcons = {
    [AttendanceStatus.PRESENT]: <CheckCircle2 className="w-12 h-12" />,
    [AttendanceStatus.ABSENT]: <XCircle className="w-12 h-12" />,
    [AttendanceStatus.LATE]: <Clock className="w-12 h-12" />,
    'NOT_MARKED': <AlertTriangle className="w-12 h-12" />,
    [AttendanceStatus.EXCUSED]: <BadgeCheck className="w-12 h-12" />
  };

  if (isLoading && children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">CONNECTING PORTAL...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-8 px-4">
        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-slate-100">
          <Smartphone className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Identity Not Found</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Please request the administration to link your email address to your student's record for instant access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      {/* Header & Switcher */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {activeStudent?.name}'s Dashboard
            </h1>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
              ROLL ID: #{activeStudent?.rollNo}
            </p>
          </div>

          {children.length > 1 && (
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar scroll-smooth">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setActiveStudent(child)}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                    activeStudent?.id === child.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'performance' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HERO TODAY STATUS CARD */}
            <div className={`p-10 rounded-[3rem] border-2 transition-all shadow-xl flex flex-col items-center text-center space-y-6 ${statusColors[todayStatus]}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status: Today</p>
              <div className="p-6 rounded-[2.5rem] bg-white/70 backdrop-blur-md border border-white/60 shadow-inner">
                {statusIcons[todayStatus]}
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter uppercase mb-2">
                  {todayStatus === 'NOT_MARKED' ? 'PENDING' : todayStatus}
                </h3>
                <p className="text-xs font-bold opacity-70 leading-relaxed">
                  {todayStatus === 'NOT_MARKED' 
                    ? 'Faculty has not yet updated the register.' 
                    : `Verified on ${new Date().toLocaleDateString()}`}
                </p>
              </div>
            </div>

            {/* BALANCE OVERVIEW */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Balance</p>
              <div className="p-6 rounded-[2.5rem] bg-slate-50 text-slate-300">
                <Receipt className="w-12 h-12" />
              </div>
              <div>
                <h3 className={`text-4xl font-black tracking-tighter mb-2 ${(activeStudent?.feesDue ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{(activeStudent?.feesDue ?? 0).toLocaleString()}
                </h3>
                <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  (activeStudent?.feesDue ?? 0) > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {(activeStudent?.feesDue ?? 0) > 0 ? 'Dues Pending' : 'Account Balanced'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <AttendanceCalendar records={attendance} />
          </div>
        </div>
      )}

      {view === 'attendance' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Full Register Log</h3>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="divide-y divide-slate-50">
            {attendance.length > 0 ? attendance.map(rec => (
              <div key={rec.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                <div className="space-y-1">
                  <p className="text-base font-black text-slate-900">
                    {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital Stamp Verified</p>
                </div>
                <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border ${statusColors[rec.status]}`}>
                  {rec.status}
                </span>
              </div>
            )) : (
              <div className="py-24 text-center space-y-4">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No history available.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'payments' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 px-2">Payment Records</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {payments.length > 0 ? payments.map(pay => (
              <div key={pay.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6 relative group hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Receipt #</p>
                    <p className="text-xl font-black text-slate-900">{pay.receiptNo}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    SETTLED
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-y border-dashed border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{pay.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                    <p className="text-sm font-black text-slate-700">{pay.method}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <History className="w-4 h-4" />
                    <span className="text-xs font-bold">{new Date(pay.date).toLocaleString()}</span>
                  </div>
                  <button className="flex items-center space-x-2 text-indigo-600 font-black text-[10px] uppercase group">
                    <span>PDF Receipt</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No transactions recorded.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center space-x-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
               <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black leading-tight">Secure Cloud Vault</p>
              <p className="text-xs text-slate-400 font-medium">All fee transactions are cryptographically signed and archived for 5 years.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
