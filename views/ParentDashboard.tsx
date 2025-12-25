
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  CreditCard, 
  Download, 
  AlertCircle,
  TrendingUp,
  X,
  CheckCircle,
  Smartphone,
  CreditCard as CardIcon,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Loader2,
  History,
  Info,
  BadgeCheck,
  UserPlus,
  Search,
  GraduationCap
} from 'lucide-react';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { Student, PaymentRecord, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../supabase';

interface ParentDashboardProps {
  studentId: string | null;
  view?: 'performance' | 'attendance' | 'payments';
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ studentId: initialStudentId, view = 'performance' }) => {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(initialStudentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Link Student Form States
  const [linkRollNo, setLinkRollNo] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Year' | 'Month' | 'Week'>('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');

  const fetchData = async (id: string) => {
    setIsLoading(true);
    // 1. Fetch Student Info
    const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
    if (sData) {
      setStudent({
        id: sData.id,
        name: sData.name,
        grade: sData.grade,
        parentName: sData.parent_name,
        rollNo: sData.roll_no,
        feesDue: sData.fees_due,
        teacherId: sData.teacher_id,
        parentId: ''
      });
      setPaymentAmount(sData.fees_due);

      // 2. Fetch Attendance
      const { data: aData } = await supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false });
      if (aData) setAttendance(aData.map(a => ({ id: a.id, studentId: a.student_id, date: a.date, status: a.status as AttendanceStatus, notes: a.notes })));

      // 3. Fetch Payments
      const { data: pData } = await supabase.from('payments').select('*').eq('student_id', id).order('date', { ascending: false });
      if (pData) setPayments(pData.map(p => ({ id: p.id, studentId: p.student_id, amount: p.amount, date: p.date, method: p.method as any, term: p.term, receiptNo: p.receipt_no })));
    } else {
      setStudent(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeStudentId) {
      fetchData(activeStudentId);
    } else {
      setIsLoading(false);
    }
  }, [activeStudentId]);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setLinkError(null);

    try {
      // 1. Find student by roll number
      const { data: studentMatch, error: findError } = await supabase
        .from('students')
        .select('id, name')
        .eq('roll_no', linkRollNo)
        .single();

      if (findError || !studentMatch) {
        throw new Error("Student not found. Please verify the Roll Number with the administration.");
      }

      // 2. Update parent profile with linked student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please login again.");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ linked_id: studentMatch.id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Success state
      setActiveStudentId(studentMatch.id);
      // fetchData will be triggered by useEffect
    } catch (err: any) {
      setLinkError(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    if (attendanceFilter === 'All') return attendance;
    const now = new Date();
    return attendance.filter(a => {
      const d = new Date(a.date);
      if (attendanceFilter === 'Week') return d >= new Date(now.getTime() - 7 * 86400000);
      if (attendanceFilter === 'Month') return d >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return true;
    });
  }, [attendance, attendanceFilter]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || paymentAmount <= 0) return;
    setIsProcessing(true);

    const receiptNo = `RCP-${Math.floor(Math.random() * 900000) + 100000}`;
    const newPayment = {
      student_id: student.id,
      amount: paymentAmount,
      method: paymentMethod,
      term: 'Manual Fee Settlement',
      receipt_no: receiptNo,
      date: new Date().toISOString().split('T')[0]
    };

    const { error: pError } = await supabase.from('payments').insert([newPayment]);
    if (!pError) {
      const newBalance = Math.max(0, student.feesDue - paymentAmount);
      await supabase.from('students').update({ fees_due: newBalance }).eq('id', student.id);
      setStudent({ ...student, feesDue: newBalance });
      setPaymentSuccess(true);
      fetchData(student.id);
      setTimeout(() => { setIsPaymentModalOpen(false); setPaymentSuccess(false); }, 2000);
    } else {
      alert(pError.message);
    }
    setIsProcessing(false);
  };

  if (isLoading) return (
    <div className="h-96 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Accessing Portal...</p>
    </div>
  );

  // Link Child UI if no student is active
  if (!activeStudentId || !student) {
    return (
      <div className="max-w-2xl mx-auto py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 mb-6 ring-8 ring-indigo-50">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome to EduFlow</h2>
          <p className="text-slate-500 font-medium">Link your child's student account to view attendance and pay fees.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleLinkStudent} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Child's Roll Number</label>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="text" 
                  value={linkRollNo}
                  onChange={(e) => setLinkRollNo(e.target.value)}
                  placeholder="e.g. 101 or 102"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-xl font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
              {linkError && (
                <div className="mt-3 flex items-center space-x-2 text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{linkError}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLinking}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
              <span>{isLinking ? 'Verifying Student...' : 'Link Student Profile'}</span>
            </button>
          </form>

          <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-4">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-900 mb-1">Don't have a roll number?</p>
              <p className="text-amber-700 font-medium">Please contact the school office to get your child's official Roll Number for registration.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attendancePercentage = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100) : 100;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-slate-900">{student.name}'s Profile</h1><p className="text-slate-500 font-medium">Cloud Dashboard • {view}</p></div>
        <div className="flex items-center space-x-3">
          {student.feesDue > 0 && <div className="px-4 py-2 rounded-2xl border bg-rose-50 border-rose-100 text-rose-600 flex items-center space-x-2 animate-pulse"><AlertCircle className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-tight">Dues Pending</span></div>}
          <div className="px-4 py-2 rounded-2xl border bg-emerald-50 border-emerald-100 text-emerald-600 flex items-center space-x-2"><BadgeCheck className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-tight">Account Verified</span></div>
        </div>
      </div>

      {view === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance</p><p className="text-3xl font-black text-indigo-600">{attendancePercentage}%</p><TrendingUp className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-indigo-50 opacity-10" />
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Dues</p><p className={`text-3xl font-black ${student.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{student.feesDue.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><AttendanceCalendar records={attendance} /></div>
          </div>
          <div className="space-y-8"><div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden"><h3 className="text-xl font-bold mb-4">Quick Links</h3><div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"><span>Progress Report</span><ArrowRight className="w-4 h-4" /></button>
          </div></div></div>
        </div>
      )}

      {view === 'attendance' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between mb-8"><div><h3 className="text-xl font-black text-slate-900">Attendance Report</h3></div></div>
          <div className="overflow-x-auto"><table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Remarks</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAttendance.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold">{a.date}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{a.status}</span></td>
                  <td className="px-6 py-4 text-xs italic text-slate-400">{a.notes || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {view === 'payments' && (
        <div className="lg:col-span-2 space-y-8">
          {student.feesDue === 0 ? (
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-12 text-center"><CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-6" /><h3 className="text-3xl font-black text-emerald-900">Fees Fully Paid!</h3></div>
          ) : (
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
              <div><h3 className="text-2xl font-black mb-2">Secure Fee Payment</h3><p className="text-indigo-100 text-sm mb-6">Settlement required for child's term.</p><div className="bg-white/10 p-4 rounded-2xl border border-white/20"><p className="text-xs font-black uppercase">Outstanding</p><p className="text-4xl font-black">₹{student.feesDue.toLocaleString()}</p></div></div>
              <button onClick={() => setIsPaymentModalOpen(true)} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg shadow-xl mt-8 md:mt-0">Pay Online Now</button>
            </div>
          )}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"><div className="p-8 border-b border-slate-100"><h3 className="font-black text-slate-900">Payment Ledger</h3></div>
          <table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-4">Receipt</th><th className="px-8 py-4">Date</th><th className="px-8 py-4">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-8 py-6 text-sm font-black">{p.receiptNo}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">{p.date}</td>
                <td className="px-8 py-6 text-sm font-black text-emerald-600">₹{p.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isProcessing && setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            {paymentSuccess ? (
              <div className="text-center py-8"><CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-6" /><h3 className="text-2xl font-black text-slate-900">Success!</h3></div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-6">
                <h3 className="text-xl font-black text-slate-900">Complete Payment</h3>
                <input type="number" className="w-full bg-slate-50 border rounded-3xl p-5 text-3xl font-black text-slate-900 outline-none" value={paymentAmount} max={student.feesDue} onChange={e => setPaymentAmount(parseInt(e.target.value) || 0)} required />
                <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-2xl disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : `Authorize ₹${paymentAmount.toLocaleString()}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
