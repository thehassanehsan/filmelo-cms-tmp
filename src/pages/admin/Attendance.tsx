import { useEffect, useState } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { attendanceApi, usersApi } from '@/services/api';
import { toast } from 'sonner';

export default function AdminAttendance() {
  const [entries, setEntries] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    try {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const [attRes, profRes] = await Promise.all([
        attendanceApi.list(params),
        usersApi.getProfessionals()
      ]);
      setEntries(attRes.data.entries);
      setProfessionals(profRes.data.users);
    } catch (err) { toast.error('Failed to load attendance'); }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);
  const presentToday = todayEntries.filter(e => e.status === 'Present').length;
  const absentToday = todayEntries.filter(e => e.status === 'Absent').length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Attendance</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Present Today" value={presentToday} icon={Clock} color="#CFFF4A" />
          <StatCard label="Absent Today" value={absentToday} icon={Clock} color="#FF4DA6" />
          <StatCard label="Total Entries" value={entries.length} icon={CalendarDays} />
          <StatCard label="Professionals" value={professionals.length} icon={Clock} color="#3B82F6" />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs text-[#8DA8A9] mb-1 block">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#8DA8A9] mb-1 block">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white text-sm" />
          </div>
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'professional_name', label: 'Professional' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'check_in', label: 'Check In' },
              { key: 'check_out', label: 'Check Out' },
              { key: 'notes', label: 'Notes' },
            ]}
            data={entries}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
