
import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Download, 
  AlertCircle,
  X,
  CheckCircle,
  Smartphone,
  CreditCard as CardIcon,
  ArrowRight,
  ShieldCheck,
  Loader2,
  History,
  Info,
  BadgeCheck,
  GraduationCap,
  Sparkles,
  Zap,
  ReceiptText,
  QrCode,
  Timer,
  LogOut,
  FileText
} from 'lucide-react';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { Student, PaymentRecord, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../supabase';
import { jsPDF } from 'jspdf';

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

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'gateway' | 'success'>('form');

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receiptAmount, setReceiptAmount] = useState<number>(0); 
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [lastReceipt, setLastReceipt] = useState<string>('');
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(240); 
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async (id: string) => {
    setIsLoading(true);
    const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
    if (sData) {
      setStudent({
        id: sData.id,
        name: sData.name,
        grade: sData.grade,
        parentName: sData.parent_name,
        rollNo: sData.roll_no,
        feesDue: sData.fees_due ?? 0,
        teacherId: sData.teacher_id,
        parentId: ''
      });
      setPaymentAmount(prev => prev === 0 ? (sData.fees_due ?? 0) : prev);

      const { data: aData } = await supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false });
      if (aData) setAttendance(aData.map(a => ({ id: a.id, studentId: a.student_id, date: a.date, status: a.status as AttendanceStatus, notes: a.notes })));

      const { data: pData } = await supabase.from('payments').select('*').eq('student_id', id).order('date', { ascending: false });
      if (pData) setPayments(pData.map(p => ({ 
        id: p.id, 
        studentId: p.student_id, 
        amount: p.amount ?? 0, 
        date: p.date, 
        method: p.method as any, 
        term: p.term, 
        receiptNo: p.receipt_no 
      })));
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

  useEffect(() => {
    if (paymentStep === 'gateway' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      closePaymentModal();
      alert("Payment session expired. Please try again.");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentStep, timeLeft]);

  const startPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || paymentAmount <= 0) return;
    setReceiptAmount(paymentAmount); 
    setPaymentStep('gateway');
    setTimeLeft(240);
  };

  const finalizePayment = async () => {
    if (!student || receiptAmount <= 0) return;
    
    const receiptNo = `RCP-${Math.floor(Math.random() * 900000) + 100000}`;
    const today = new Date().toISOString().split('T')[0];
    setLastReceipt(receiptNo);
    setLastPaymentDate(new Date().toLocaleString());

    const newPayment = {
      student_id: student.id,
      amount: receiptAmount,
      method: paymentMethod,
      term: 'Tuition Fees',
      receipt_no: receiptNo,
      date: today
    };

    const { error: pError } = await supabase.from('payments').insert([newPayment]);
    if (!pError) {
      const newBalance = Math.max(0, (student.feesDue ?? 0) - receiptAmount);
      await supabase.from('students').update({ fees_due: newBalance }).eq('id', student.id);
      
      setStudent(prev => prev ? { ...prev, feesDue: newBalance } : null);
      setPaymentStep('success');
      fetchData(student.id);
    } else {
      alert(pError.message);
      setPaymentStep('form');
    }
  };

  const generateReceiptPDF = () => {
    if (!student) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EduFlow Academy', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FEE PAYMENT RECEIPT', pageWidth - margin - 40, 25);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text('123 Education Lane, Tech City, 560001', margin, 50);
    doc.text('Contact: +91 98765 43210 | support@eduflow.com', margin, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt ID: ${lastReceipt}`, pageWidth - margin - 50, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 55);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 65, pageWidth - margin, 65);

    doc.setFontSize(12);
    doc.text('Student Details', margin, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, margin, 85);
    doc.text(`Roll No: ${student.rollNo}`, margin, 90);
    doc.text(`Class: ${student.grade}`, margin, 95);

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 105, pageWidth - (margin * 2), 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin + 5, 115);
    doc.text('Amount (INR)', pageWidth - margin - 35, 115);
    
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 5, 118, pageWidth - margin - 5, 118);
    doc.text('School Tuition Fees - Academic Term', margin + 5, 128);
    doc.text(`Rs. ${receiptAmount.toLocaleString()}`, pageWidth - margin - 35, 128);
    
    doc.line(margin + 5, 135, pageWidth - margin - 5, 135);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid', margin + 5, 142);
    doc.text(`Rs. ${receiptAmount.toLocaleString()}`, pageWidth - margin - 35, 142);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Payment Mode: ${paymentMethod}`, margin, 160);
    doc.text(`Transaction Time: ${lastPaymentDate}`, margin, 165);
    doc.text(`Status: Verified Successfully`, margin, 170);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text('Authorized Signatory', pageWidth - margin - 45, 190);
    
    doc.save(`EduFlow_Receipt_${lastReceipt}.pdf`);
  };

  const closePaymentModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPaymentModalOpen(false);
    setPaymentStep('form');
    setTimeLeft(240);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const attendancePercentage = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100) : 100;

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setLinkError(null);
    
    try {
      // 1. Verify student exists with this roll number
      const { data: studentData, error: studentFetchError } = await supabase
        .from('students')
        .select('id')
        .eq('roll_no', linkRollNo)
        .maybeSingle();
      
      if (studentFetchError) throw studentFetchError;

      if (!studentData) {
        setLinkError("Roll Number not found. Please contact your institute administration.");
        setIsLinking(false);
        return;
      }

      // 2. Data Integrity: Check if this student is already linked to another user profile
      const { data: existingLink, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('linked_id', studentData.id)
        .maybeSingle();

      if (profileCheckError) throw profileCheckError;

      if (existingLink) {
        setLinkError("Student with this roll number is already associate with one parent account. Please contact institute administration");
        setIsLinking(false);
        return;
      }

      // 3. Link student to current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLinkError("Session expired. Please sign in again.");
        setIsLinking(false);
        return;
      }

      const { error: linkError } = await supabase
        .from('profiles')
        .update({ linked_id: studentData.id })
        .eq('id', user.id);

      if (linkError) throw linkError;

      // Success - update state
      setActiveStudentId(studentData.id);

    } catch (err: any) {
      setLinkError("Student with this roll number is already associate with one parent account. Please contact institute administration");
      console.error("Linking Error:", err);
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading) return (
    <div className="h-96 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Connecting Portal...</p>
    </div>
  );

  if (!activeStudentId || !student) {
    return (
      <div className="max-w-2xl mx-auto py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 mb-6 ring-8 ring-indigo-50">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Connect Your Child</h2>
          <p className="text-slate-500 font-medium">Please enter the roll number provided by the institute.</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleLinkStudent} className="space-y-6">
            <input 
              type="text" 
              value={linkRollNo} 
              onChange={(e) => setLinkRollNo(e.target.value)} 
              placeholder="Student Roll No" 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-xl font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
              required 
            />
            <button 
              type="submit" 
              disabled={isLinking}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Link Profile</span>}
            </button>
            {linkError && <p className="text-rose-500 text-center font-bold text-sm leading-relaxed">{linkError}</p>}
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button onClick={handleSignOut} className="w-full py-4 text-slate-400 hover:text-rose-600 font-bold text-sm flex items-center justify-center space-x-2 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Not your account? Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-slate-900">{student.name}'s Dashboard</h1><p className="text-slate-500 font-medium">{student.grade} • Roll #{student.rollNo}</p></div>
        <div className="flex items-center space-x-3">
          {(student.feesDue ?? 0) > 0 && <div className="px-4 py-2 rounded-2xl border bg-rose-50 border-rose-100 text-rose-600 flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-tight">Payment Due</span></div>}
          <div className="px-4 py-2 rounded-2xl border bg-indigo-50 border-indigo-100 text-indigo-600 flex items-center space-x-2"><BadgeCheck className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-tight">Verified Student</span></div>
        </div>
      </div>

      {view === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                <p className="text-3xl font-black text-indigo-600">{attendancePercentage}%</p>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${attendancePercentage}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Balance</p>
                <p className={`text-3xl font-black ${(student.feesDue ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{(student.feesDue ?? 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Academic Year 2024-25</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><AttendanceCalendar records={attendance} /></div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
               <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform duration-700" />
               <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center space-x-2">
                 <Zap className="w-5 h-5 text-amber-400" />
                 <span>Smart Actions</span>
               </h3>
               <div className="space-y-3 relative z-10">
                 <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors">
                   <span>ID Card Generation</span>
                   <Download className="w-4 h-4" />
                 </button>
                 <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors">
                   <span>Apply for Leave</span>
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {view === 'attendance' && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Historical Attendance</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Cloud Data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-8 py-4">Date</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Verification</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.length > 0 ? attendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-700">{a.date}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                        a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 
                        a.status === 'ABSENT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center text-[10px] text-slate-400 font-bold space-x-1">
                        <BadgeCheck className="w-3 h-3 text-emerald-500" />
                        <span>Teacher Verified</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-8 py-20 text-center font-bold text-slate-400">No attendance records found yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {(student.feesDue ?? 0) === 0 ? (
              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                <Sparkles className="absolute top-[-20%] left-[-10%] w-64 h-64 text-emerald-200/30" />
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 border-4 border-emerald-500">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-emerald-900 mb-2">Account Fully Paid</h3>
                <p className="text-emerald-700 font-bold uppercase text-[10px] tracking-[0.2em]">Zero Outstanding Balance</p>
              </div>
            ) : (
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <Zap className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black">Online Fee Payment</h3>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 inline-block">
                      <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest mb-1">Payable Balance</p>
                      <p className="text-5xl font-black tracking-tight">₹{(student.feesDue ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPaymentModalOpen(true)} className="bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">Pay Balance Now</button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-900">Transaction History</h3>
                <History className="w-5 h-5 text-slate-300" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="px-8 py-5">Receipt No</th><th className="px-8 py-5">Date</th><th className="px-8 py-5">Method</th><th className="px-8 py-5 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-6 text-sm font-black text-indigo-600">{p.receiptNo || 'Pending'}</td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{p.date}</td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">{p.method}</td>
                        <td className="px-8 py-6 text-sm font-black text-emerald-600 text-right">₹{(p.amount ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                 <ShieldCheck className="w-6 h-6" />
               </div>
               <h4 className="font-black text-slate-900 mb-2">Bank-Grade Security</h4>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">All transactions are secured with 256-bit SSL encryption. Digital receipts are generated instantly.</p>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closePaymentModal}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[500px] flex flex-col transition-all">
            
            {paymentStep === 'form' && (
              <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Confirm Payment</h3>
                  <button onClick={closePaymentModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-black text-slate-400 mr-2">₹</span>
                    <input type="number" className="bg-transparent w-full text-4xl font-black text-slate-900 outline-none" value={paymentAmount} max={student.feesDue} onChange={e => setPaymentAmount(parseInt(e.target.value) || 0)} required />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setPaymentMethod('UPI')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-indigo-200'}`}><Smartphone className="w-6 h-6" /><span className="text-xs font-black">UPI / Scan</span></button>
                    <button onClick={() => setPaymentMethod('Card')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'Card' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-indigo-200'}`}><CardIcon className="w-6 h-6" /><span className="text-xs font-black">Bank Card</span></button>
                  </div>
                </div>

                <button onClick={startPayment} disabled={paymentAmount <= 0} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 disabled:opacity-50"><ShieldCheck className="w-5 h-5" /><span>Authorize & Pay</span></button>
              </div>
            )}

            {paymentStep === 'gateway' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between w-full mb-4">
                   <div className="flex items-center space-x-2 text-indigo-600"><Timer className="w-5 h-5 animate-pulse" /><span className="text-xl font-black font-mono">{formatTime(timeLeft)}</span></div>
                   <button onClick={closePaymentModal} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="relative group">
                  <div className="w-56 h-56 bg-white rounded-3xl border-2 border-indigo-600 p-6 shadow-2xl flex items-center justify-center relative overflow-hidden"><QrCode className="w-full h-full text-slate-900" /></div>
                  <div className="mt-4 flex flex-col items-center"><p className="text-2xl font-black text-slate-900">₹{receiptAmount.toLocaleString()}</p></div>
                </div>
                <button onClick={finalizePayment} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"><span>Simulate Success</span><ArrowRight className="w-4 h-4" /></button>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="flex-1 flex flex-col p-8 space-y-6 animate-in slide-in-from-bottom-12 duration-700">
                <div className="flex justify-center -mt-16 mb-4"><div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl border-[6px] border-white animate-bounce"><CheckCircle className="w-12 h-12" /></div></div>
                <div className="text-center"><h3 className="text-3xl font-black text-slate-900">Payment Success!</h3><p className="text-emerald-600 font-black uppercase text-[10px] tracking-[0.2em] mt-1">Transaction Verified</p></div>
                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12"><ReceiptText className="w-48 h-48" /></div>
                  <div className="space-y-5 relative z-10"><div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-4"><span className="text-[10px] font-black text-slate-400 uppercase">Receipt Id</span><span className="text-sm font-black text-indigo-600">{lastReceipt}</span></div><div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Amount Paid</span><span className="text-xl font-black text-slate-900">₹{receiptAmount.toLocaleString()}</span></div></div>
                </div>
                <div className="space-y-3"><button onClick={closePaymentModal} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl">Back to Dashboard</button><button onClick={generateReceiptPDF} className="w-full py-4 bg-white text-indigo-600 border border-indigo-100 rounded-2xl font-black text-xs hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2"><FileText className="w-4 h-4" /><span>Download Receipt PDF</span></button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
