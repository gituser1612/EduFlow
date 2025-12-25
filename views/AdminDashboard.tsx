
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  Wallet, 
  FileDown,
  BarChart3,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import StatCard from '../components/StatCard';
import GeminiInsights from '../components/GeminiInsights';
import { STUDENTS, TEACHERS } from '../constants';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

const AdminDashboard: React.FC = () => {
  const [attendanceRange, setAttendanceRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [revenueRange, setRevenueRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [syncKey, setSyncKey] = useState(0);

  // Load attendance from local storage to show teacher updates
  const liveAttendanceData = useMemo(() => {
    const logs = JSON.parse(localStorage.getItem('eduflow_attendance_log') || '[]');
    // Simply showing count for now
    return logs;
  }, [syncKey]);

  // Attendance Data (Mock + Live simulation)
  const attendanceData = {
    daily: [
      { name: '08 AM', attendance: 45 },
      { name: '10 AM', attendance: 92 },
      { name: '12 PM', attendance: 88 },
      { name: '02 PM', attendance: 85 },
      { name: '04 PM', attendance: 70 },
    ],
    monthly: [
      { name: 'Week 1', attendance: 85 },
      { name: 'Week 2', attendance: 92 },
      { name: 'Week 3', attendance: 88 },
      { name: 'Week 4', attendance: liveAttendanceData.length > 0 ? 98 : 95 },
    ],
    yearly: [
      { name: 'Jan', attendance: 80 }, { name: 'Feb', attendance: 82 }, { name: 'Mar', attendance: 85 },
      { name: 'Apr', attendance: 88 }, { name: 'May', attendance: 90 }, { name: 'Jun', attendance: 75 },
      { name: 'Jul', attendance: 70 }, { name: 'Aug', attendance: 85 }, { name: 'Sep', attendance: 92 },
      { name: 'Oct', attendance: 94 }, { name: 'Nov', attendance: 91 }, { name: 'Dec', attendance: 89 },
    ]
  };

  // Fee/Revenue Data in Rupees
  const feeData = {
    daily: [
      { name: 'Mon', collected: 12000, due: 3000 },
      { name: 'Tue', collected: 21000, due: 1500 },
      { name: 'Wed', collected: 8000, due: 6000 },
      { name: 'Thu', collected: 34000, due: 1000 },
      { name: 'Fri', collected: 15000, due: 4000 },
    ],
    monthly: [
      { name: 'Oct 01', collected: 450000, due: 120000 },
      { name: 'Oct 08', collected: 320000, due: 80000 },
      { name: 'Oct 15', collected: 670000, due: 200000 },
      { name: 'Oct 22', collected: 410000, due: 50000 },
    ],
    yearly: [
      { name: 'Q1', collected: 1500000, due: 300000 },
      { name: 'Q2', collected: 1800000, due: 250000 },
      { name: 'Q3', collected: 1200000, due: 450000 },
      { name: 'Q4', collected: 2200000, due: 120000 },
    ]
  };

  const getRevenueValue = () => {
    if (revenueRange === 'daily') return '₹42,500';
    if (revenueRange === 'monthly') return '₹12,84,000';
    return '₹67,00,000';
  };

  const getAttendanceValue = () => {
    // If teacher marked attendance, bump the mock number
    if (liveAttendanceData.length > 0) return '96.5%';
    if (attendanceRange === 'daily') return '92%';
    if (attendanceRange === 'monthly') return '94.2%';
    return '88.5%';
  };

  const classBreakdown = [
    { name: 'Grade 9th', value: STUDENTS.filter(s => s.grade === '9th').length },
    { name: 'Grade 10th', value: STUDENTS.filter(s => s.grade === '10th').length },
    { name: 'Grade 11th', value: 12 },
    { name: 'Grade 12th', value: 8 },
  ];

  const exportToExcel = (type: string) => {
    alert(`Exporting ${type} record in Excel format...`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Institute Analytics</h1>
            <button 
              onClick={() => setSyncKey(prev => prev + 1)} 
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Sync Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-500">Comprehensive overview of academic and financial health.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => exportToExcel('Attendance')}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm font-semibold">Attendance Excel</span>
          </button>
          <button 
            onClick={() => exportToExcel('Fees')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-semibold">Full Report</span>
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={STUDENTS.length + 20} icon={Users} color="indigo" trend="+15%" />
        <StatCard title="Active Teachers" value={TEACHERS.length} icon={UserSquare2} color="emerald" />
        
        {/* Interactive Attendance Card */}
        <div className="relative group">
          <StatCard 
            title={`Attendance (${attendanceRange})`} 
            value={getAttendanceValue()} 
            icon={CalendarCheck} 
            color="amber" 
            trend={liveAttendanceData.length > 0 ? '+8%' : '+2.4%'} 
          />
          <div className="absolute top-2 right-2 flex bg-slate-100 p-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {(['daily', 'monthly', 'yearly'] as const).map(r => (
              <button 
                key={r}
                onClick={() => setAttendanceRange(r)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${attendanceRange === r ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
              >
                {r[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Revenue Card */}
        <div className="relative group">
          <StatCard 
            title={`Revenue (${revenueRange})`} 
            value={getRevenueValue()} 
            icon={Wallet} 
            color="indigo" 
            trend="+12%" 
          />
          <div className="absolute top-2 right-2 flex bg-slate-100 p-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {(['daily', 'monthly', 'yearly'] as const).map(r => (
              <button 
                key={r}
                onClick={() => setRevenueRange(r)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${revenueRange === r ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
              >
                {r[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Attendance Overview</h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['daily', 'monthly', 'yearly'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAttendanceRange(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${attendanceRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData[attendanceRange]}>
                  <defs>
                    <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`${(value ?? 0).toLocaleString()}%`, 'Attendance']}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAttend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fees Collection Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Fee Collection & Dues (₹)</h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['daily', 'monthly', 'yearly'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRevenueRange(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${revenueRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData[revenueRange]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`₹${(value ?? 0).toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="due" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side Column */}
        <div className="space-y-8">
          {/* Class Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Students per Class</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {classBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {classBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  <span className="text-xs font-semibold text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <GeminiInsights context={`
            School Analytics Summary (Rupees):
            - Revenue Period: ${revenueRange}
            - Current Attendance Score: ${getAttendanceValue()}
            - High performing class: Grade 10th
            - Financial Summary: Revenue trend is positive at ${getRevenueValue()}
            - Live Updates: ${liveAttendanceData.length} records synced from teachers.
          `} />

          {/* Quick Actions */}
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <TrendingUp className="absolute top-[-20px] right-[-20px] w-32 h-32 text-indigo-500 opacity-10 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-4 relative z-10">Daily Admin Tasks</h3>
            <ul className="space-y-4 relative z-10">
              {[
                'Sync attendance logs from teachers',
                'Generate monthly fee invoices',
                'Update teacher class assignments',
                'Review parent feedback forms'
              ].map((task, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] bg-slate-800">
                    {i+1}
                  </div>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
            <button className="w-full mt-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors relative z-10">
              Manage Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
