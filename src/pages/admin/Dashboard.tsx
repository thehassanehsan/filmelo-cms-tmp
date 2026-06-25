import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { dashboardApi, tasksApi, scheduleApi } from '@/services/api';
import type { Task, ScheduleEvent } from '@/types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_clients: 0, active_projects: 0, total_revenue: 0, pending_tasks: 0 });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, tasksRes, eventsRes] = await Promise.all([
          dashboardApi.admin(),
          tasksApi.list({ limit: 5 }),
          scheduleApi.list({ limit: 5 })
        ]);
        setStats(dashRes.data.stats);
        setRecentTasks(tasksRes.data.tasks.slice(0, 5));
        setUpcomingEvents(eventsRes.data.events.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={stats.total_clients} icon={Users} color="#CFFF4A" delay={0} />
          <StatCard label="Active Projects" value={stats.active_projects} icon={Briefcase} color="#3B82F6" delay={0.1} />
          <StatCard label="Total Revenue" value={`$${Number(stats.total_revenue).toLocaleString()}`} icon={DollarSign} color="#CFFF4A" delay={0.2} />
          <StatCard label="Pending Tasks" value={stats.pending_tasks} icon={AlertCircle} color="#F59E0B" delay={0.3} />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Add Client', path: '/admin/clients', icon: Users },
              { label: 'Create Task', path: '/admin/tasks', icon: Briefcase },
              { label: 'Schedule Event', path: '/admin/schedule', icon: AlertCircle },
            ].map((action) => (
              <motion.button
                key={action.path}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 bg-[#0A2426] border border-[#1A3A3D] rounded-xl p-4 hover:border-[#CFFF4A]/30 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-[#CFFF4A]/15">
                  <action.icon size={18} className="text-[#CFFF4A]" />
                </div>
                <span className="text-white text-sm font-medium">{action.label}</span>
                <Plus size={14} className="ml-auto text-[#8DA8A9]" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider">Recent Tasks</h3>
              <button onClick={() => navigate('/admin/tasks')} className="text-xs text-[#CFFF4A] hover:underline">View All</button>
            </div>
            <DataTable
              columns={[
                { key: 'title', label: 'Task' },
                { key: 'client_name', label: 'Client' },
                { key: 'assigned_professional_name', label: 'Assigned To' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={recentTasks}
              emptyMessage="No tasks yet"
            />
          </div>

          {/* Upcoming Events */}
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider">Upcoming Events</h3>
              <button onClick={() => navigate('/admin/schedule')} className="text-xs text-[#CFFF4A] hover:underline">View All</button>
            </div>
            <DataTable
              columns={[
                { key: 'title', label: 'Event' },
                { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
                { key: 'client_name', label: 'Client' },
                { key: 'location', label: 'Location' },
              ]}
              data={upcomingEvents}
              emptyMessage="No upcoming events"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
