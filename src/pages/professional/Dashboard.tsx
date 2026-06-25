import { useEffect, useState } from 'react';
import { Clock, CheckCircle, ClipboardList, CalendarDays, Send } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { dashboardApi, tasksApi, scheduleApi, attendanceApi, dailyReportsApi } from '@/services/api';
import { toast } from 'sonner';
import type { Task, ScheduleEvent } from '@/types';

export default function ProDashboard() {
  const [stats, setStats] = useState({ my_tasks: 0, completed_tasks: 0, hours_this_week: 0, punched_in_today: false });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [reportText, setReportText] = useState('');
  const [reportHours, setReportHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPunchedIn, setHasPunchedIn] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, tasksRes, schRes] = await Promise.all([
        dashboardApi.professional(),
        tasksApi.list(),
        scheduleApi.list()
      ]);
      setStats(dashRes.data.stats);
      setTasks(tasksRes.data.tasks.slice(0, 10));
      setSchedule(schRes.data.events.slice(0, 5));
      setHasPunchedIn(dashRes.data.stats.punched_in_today);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePunchIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      await attendanceApi.create({ date: today, status: 'Present', check_in: time });
      setHasPunchedIn(true);
      toast.success('Attendance logged!');
    } catch (err) { toast.error('Failed to punch in'); }
  };

  const handleTaskStatus = async (task: Task, newStatus: string) => {
    try {
      await tasksApi.update(task.id, { status: newStatus });
      toast.success(`Task marked ${newStatus}`);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) { toast.error('Please write a report'); return; }
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await dailyReportsApi.create({ date: today, report_text: reportText, hours_worked: parseFloat(reportHours) || 0 });
      toast.success('Report submitted!');
      setReportText('');
      setReportHours('');
    } catch (err) { toast.error('Failed to submit'); }
    setIsSubmitting(false);
  };

  const proModules = [
    { name: 'Dashboard', path: '/professional/dashboard' },
  ];

  return (
    <DashboardLayout role="professional" modules={proModules} showSidebar={false}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0A2426] p-6 rounded-2xl border border-[#1A3A3D]">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-[#8DA8A9] mt-1">Review your tasks, check the schedule, and log your hours.</p>
          </div>
          <button
            onClick={handlePunchIn}
            disabled={hasPunchedIn}
            className={`mt-4 md:mt-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              hasPunchedIn
                ? 'bg-[#1A3A3D] text-[#8DA8A9] cursor-not-allowed'
                : 'bg-[#08383A] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <Clock size={16} /> {hasPunchedIn ? 'Punched In for the Day' : 'Punch In (Attendance)'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="My Tasks" value={stats.my_tasks} icon={ClipboardList} color="#CFFF4A" delay={0} />
          <StatCard label="Completed" value={stats.completed_tasks} icon={CheckCircle} color="#CFFF4A" delay={0.1} />
          <StatCard label="Hours This Week" value={stats.hours_this_week} icon={Clock} color="#3B82F6" delay={0.2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">My Tasks</h3>
            <DataTable
              columns={[
                { key: 'title', label: 'Task' },
                { key: 'client_name', label: 'Client' },
                { key: 'deadline', label: 'Deadline', render: (row) => row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={tasks}
              onEdit={(row) => {
                if (row.status === 'Pending') handleTaskStatus(row, 'In Progress');
                else if (row.status === 'In Progress') handleTaskStatus(row, 'Completed');
              }}
              emptyMessage="No tasks assigned"
            />
            {tasks.map((task) => (
              <div key={task.id} className="flex gap-2 mt-2">
                {task.status === 'Pending' && (
                  <button onClick={() => handleTaskStatus(task, 'In Progress')} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Start Work</button>
                )}
                {task.status === 'In Progress' && (
                  <button onClick={() => handleTaskStatus(task, 'Completed')} className="text-xs bg-[#CFFF4A]/20 text-[#CFFF4A] px-2 py-1 rounded">Mark Complete</button>
                )}
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Schedule */}
            <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">My Schedule</h3>
              <div className="space-y-3">
                {schedule.map((event) => (
                  <div key={event.id} className="bg-[#09090B] rounded-xl p-4">
                    <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                    <p className="text-xs text-[#8DA8A9] mt-1">{event.client_name}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#8DA8A9]">
                      <CalendarDays size={12} className="text-[#CFFF4A]" />
                      {new Date(event.date).toLocaleString()}
                    </div>
                  </div>
                ))}
                {schedule.length === 0 && <p className="text-[#8DA8A9] text-sm text-center py-4">No upcoming events</p>}
              </div>
            </div>

            {/* Daily Report */}
            <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4 flex items-center gap-2">
                <ClipboardList size={16} /> End of Day Update
              </h3>
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Today I finished..."
                  className="w-full h-28 p-3 rounded-lg bg-[#09090B] border border-[#1A3A3D] text-white placeholder:text-[#3F3F46] text-sm focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] resize-none"
                />
                <input
                  type="number"
                  value={reportHours}
                  onChange={(e) => setReportHours(e.target.value)}
                  placeholder="Hours worked"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090B] border border-[#1A3A3D] text-white placeholder:text-[#3F3F46] text-sm focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#CFFF4A] text-[#08383A] py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={14} /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
