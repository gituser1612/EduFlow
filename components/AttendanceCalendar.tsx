
import React from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ records }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const statusMap: Record<string, string> = {
    [AttendanceStatus.PRESENT]: 'bg-emerald-500 text-white',
    [AttendanceStatus.ABSENT]: 'bg-rose-500 text-white',
    [AttendanceStatus.LATE]: 'bg-amber-500 text-white',
    [AttendanceStatus.EXCUSED]: 'bg-indigo-500 text-white',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-700">October 2023</h4>
        <div className="flex space-x-3">
          {Object.entries(AttendanceStatus).map(([key, val]) => (
            <div key={key} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${statusMap[val]}`}></div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{key.slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
        ))}
        {days.map(day => {
          const dateStr = `2023-10-${day.toString().padStart(2, '0')}`;
          const record = records.find(r => r.date === dateStr);
          return (
            <div 
              key={day} 
              className={`h-10 w-full flex items-center justify-center rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-default
                ${record ? statusMap[record.status] : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
