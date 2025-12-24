
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default StatCard;
