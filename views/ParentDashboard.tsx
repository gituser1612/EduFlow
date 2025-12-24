
import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  Download, 
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { STUDENTS, MOCK_ATTENDANCE, MOCK_PAYMENTS } from '../constants';
import AttendanceCalendar from '../components/AttendanceCalendar';

interface ParentDashboardProps {
  studentId: string;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ studentId }) => {
  const student = STUDENTS.find(s => s.id === studentId);
  const myAttendance = MOCK_ATTENDANCE.filter(a => a.studentId === studentId);
  const myPayments = MOCK_PAYMENTS.filter(p => p.studentId === studentId);

  if (!student) return <div>Student not found.</div>;

  const presentCount = myAttendance.filter(a => a.status === 'PRESENT').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{student.name}'s Progress</h1>
          <p className="text-slate-500">Parent Dashboard • Grade {student.grade}</p>
        </div>
        <div className="flex items-center space-x-2">
          {student.feesDue > 0 && (
            <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Pending Fees: ${student.feesDue}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Calendar */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Attendance Score</p>
                <p className="text-2xl font-bold text-indigo-600">{presentCount} / {myAttendance.length} Days</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-700">85%</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Fee Status</p>
                <p className={`text-2xl font-bold ${student.feesDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {student.feesDue > 0 ? 'Due' : 'Clear'}
                </p>
              </div>
              <CreditCard className={`w-10 h-10 ${student.feesDue > 0 ? 'text-rose-200' : 'text-emerald-200'}`} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Attendance History</span>
            </h3>
            <AttendanceCalendar records={myAttendance} />
          </div>
        </div>

        {/* Right Column: Payments & Actions */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <TrendingUp className="absolute top-0 right-0 w-32 h-32 text-indigo-500 -mr-10 -mt-10 opacity-20" />
            <h3 className="text-lg font-bold mb-1">Make a Payment</h3>
            <p className="text-indigo-100 text-sm mb-6">Quickly settle outstanding school fees via UPI or Card.</p>
            <button className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Pay Now</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Payment History</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {myPayments.length > 0 ? myPayments.map(payment => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{payment.term}</p>
                    <p className="text-xs text-slate-500">{payment.date} • {payment.method}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-bold text-emerald-600">+${payment.amount}</p>
                    <button className="flex items-center space-x-1 text-indigo-600 text-xs hover:underline mt-1">
                      <Download className="w-3 h-3" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 italic text-sm">No payment records yet.</div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Teacher's Remark</p>
              <p className="text-xs text-amber-700 mt-1 italic">"Alex is participating well in math discussions, but needs to work on timely assignment submissions."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
