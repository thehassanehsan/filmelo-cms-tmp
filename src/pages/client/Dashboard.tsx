import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, FileText, CalendarDays, MapPin, Download } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { dashboardApi, tasksApi, clientReportsApi, scheduleApi } from '@/services/api';

import type { Task, ClientReport, ScheduleEvent } from '@/types';

export default function ClientDashboard() {
  const [stats, setStats] = useState({ active_projects: 0, completed_tasks: 0, total_reports: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [viewReport, setViewReport] = useState<ClientReport | null>(null);

  const fetchData = async () => {
    try {
      const [dashRes, tasksRes, repRes, evRes] = await Promise.all([
        dashboardApi.client(),
        tasksApi.list(),
        clientReportsApi.list(),
        scheduleApi.list()
      ]);
      setStats(dashRes.data.stats);
      setTasks(tasksRes.data.tasks);
      setReports(repRes.data.reports);
      setEvents(evRes.data.events);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <DashboardLayout role="client" showSidebar={false}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-[#0A2426] p-6 rounded-2xl border border-[#1A3A3D]">
          <h1 className="text-2xl font-bold text-white">Welcome to Filmelo Media</h1>
          <p className="text-sm text-[#8DA8A9] mt-1">Your project dashboard and reports.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Projects" value={stats.active_projects} icon={Briefcase} color="#CFFF4A" delay={0} />
          <StatCard label="Tasks Completed" value={stats.completed_tasks} icon={CheckCircle} color="#CFFF4A" delay={0.1} />
          <StatCard label="Reports Available" value={stats.total_reports} icon={FileText} color="#3B82F6" delay={0.2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Progress */}
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">Task Progress</h3>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-[#09090B] rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.deadline && (
                      <p className="text-xs text-[#8DA8A9] mt-2">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                    )}
                    {task.description && (
                      <p className="text-xs text-[#8DA8A9] mt-1">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8DA8A9] text-sm text-center py-8">No active tasks</p>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Reports */}
            <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">Recent Reports</h3>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-[#09090B] rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{report.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={report.report_type} />
                          <span className="text-xs text-[#8DA8A9]">{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewReport(report)}
                        className="px-3 py-1.5 bg-[#CFFF4A]/20 text-[#CFFF4A] rounded-lg text-xs font-bold hover:bg-[#CFFF4A]/30 transition-all"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8DA8A9] text-sm text-center py-8">No reports available yet</p>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#8DA8A9] uppercase tracking-wider mb-4">Upcoming Events</h3>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 bg-[#09090B] rounded-xl p-4">
                      <CalendarDays size={16} className="text-[#CFFF4A] shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                        <p className="text-xs text-[#8DA8A9]">{new Date(event.date).toLocaleDateString()}</p>
                        {event.location && (
                          <p className="text-xs text-[#8DA8A9] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8DA8A9] text-sm text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report View Modal */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewReport(null)}>
          <div className="w-full max-w-2xl bg-[#112224] border border-white/10 rounded-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-xl">{viewReport.title}</h3>
                <p className="text-[#8DA8A9] text-sm mt-1">{viewReport.client_name} | {viewReport.report_type}</p>
              </div>
              <button onClick={() => setViewReport(null)} className="text-[#8DA8A9] hover:text-white">Close</button>
            </div>
            <div className="bg-[#09090B] rounded-lg p-6 text-sm text-[#E4E4E7] whitespace-pre-wrap leading-relaxed">
              {viewReport.content}
            </div>
            {viewReport.attachment_url && (
              <a href={viewReport.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-[#CFFF4A] hover:underline text-sm">
                <Download size={14} /> Download Attachment
              </a>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
