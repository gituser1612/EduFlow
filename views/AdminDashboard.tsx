
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  Wallet, 
  TrendingUp,
  RefreshCw,
  X,
  BellRing,
  Activity,
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import StatCard from '../components/StatCard';
import { supabase } from '../supabase';

const AdminDashboard: React.FC = () => {
  const [revenueTimeframe, setRevenueTimeframe] = useState<'day' | 'month' | 'year'>('month');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert' | 'update'} | null>(null);
  
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    attendanceRate: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  const showNotification = (message: string, type: 'success' | 'alert' | 'update' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: tCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      
      const now = new Date();
      let query = supabase.from('payments').select('amount, date');
      
      if (revenueTimeframe === 'day') {
        const todayStr = now.toISOString().split('T')[0];
        query = query.eq('date', todayStr);
      } else if (revenueTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('date', startOfMonth);
      } else if (revenueTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        query = query.gte('date', startOfYear);
      }

      const { data: pData } = await query;
      const totalRev = pData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const { data: aData } = await supabase.from('attendance').select('status');
      const totalA = aData?.length || 0;
      const presentA = aData?.filter(a => a.status === 'PRESENT').length || 0;
      const rate = totalA > 0 ? Math.round((presentA / totalA) * 100) : 100;

      setCounts({
        students: sCount || 0,
        teachers: tCount || 0,
        revenue: totalRev,
        attendanceRate: rate
      });

      setAttendanceData([
        { name: 'Week 1', attendance: Math.max(0, rate - 4) },
        { name: 'Week 2', attendance: Math.max(0, rate - 1) },
        { name: 'Week 3', attendance: Math.min(100, rate + 2) },
        { name: 'Week 4', attendance: rate },
      ]);

      const baseRev = Math.max(totalRev, 5000);
      setRevenueData([
        { name: 'Mon', collected: baseRev * 0.12 },
        { name: 'Tue', collected: baseRev * 0.15 },
        { name: 'Wed', collected: baseRev * 0.18 },
        { name: 'Thu', collected: baseRev * 0.25 },
        { name: 'Fri', collected: baseRev * 0.3 },
      ]);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const attendanceChannel = supabase
      .channel('admin-live-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, () => {
        showNotification("Cloud Sync: New attendance records updated.", "update");
        fetchDashboardData();
      })
      .subscribe();
    return () => { supabase.removeChannel(attendanceChannel); };
  }, [revenueTimeframe]);

  return (
    <div className="space-y-8 pb-12 relative animate-in fade-in duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900">Analytics Terminal</h1>
            <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5" />
              Live Feed
            </div>
          </div>
          <p className="text-slate-500 font-medium">Monitoring campus data.</p>
        </div>
        <button onClick={fetchDashboardData} className="flex items-center space-x-2 px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-black text-sm">
          <RefreshCw className={`w-4 h-4 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Syncing...' : 'Sync Database'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={counts.students} icon={Users} color="indigo" />
        <StatCard title="Active Faculty" value={counts.teachers} icon={UserSquare2} color="emerald" />
        <StatCard title="Attendance Score" value={`${counts.attendanceRate}%`} icon={CalendarCheck} color="amber" />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600"><Wallet className="w-6 h-6" /></div>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              {(['day', 'month', 'year'] as const).map((t) => (
                <button key={t} onClick={() => setRevenueTimeframe(t)} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${revenueTimeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{t.charAt(0)}</button>
              ))}
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900">₹{counts.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="chart-container-dark p-8 rounded-[2.5rem]">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-8">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Attendance Stream</span>
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dx={-10} domain={[0, 100]} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: 'none'}} />
                  <Area type="monotone" dataKey="attendance" stroke="#818cf8" strokeWidth={4} fill="url(#colorAttend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container-dark p-8 rounded-[2.5rem]">
            <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Revenue Trend (₹)</span>
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dx={-10} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: 'none'}} />
                  <Bar dataKey="collected" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      {notification && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border border-white/10 backdrop-blur-xl">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center"><BellRing className="w-5 h-5 text-indigo-400 animate-tada" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">System Alert</p><p className="text-sm font-bold text-slate-100">{notification.message}</p></div>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
