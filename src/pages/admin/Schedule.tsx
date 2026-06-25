import { useEffect, useState } from 'react';
import { Plus, Clock, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { scheduleApi, clientsApi, usersApi } from '@/services/api';
import { toast } from 'sonner';
import type { ScheduleEvent } from '@/types';

export default function AdminSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [clients, setClients] = useState<Array<{value: string; label: string}>>([]);
  const [, setProfessionals] = useState<Array<{value: string; label: string}>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEvent | null>(null);

  const fetchData = async () => {
    try {
      const [schRes, cliRes, profRes] = await Promise.all([
        scheduleApi.list(),
        clientsApi.list(),
        usersApi.getProfessionals()
      ]);
      setEvents(schRes.data.events);
      setClients(cliRes.data.clients.map((c: any) => ({ value: c.id, label: c.company_name })));
      setProfessionals(profRes.data.users.map((u: any) => ({ value: u.id, label: u.name })));
    } catch (err) { toast.error('Failed to load schedule'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await scheduleApi.create(data);
      toast.success('Event scheduled');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await scheduleApi.delete(deleteTarget.id);
      toast.success('Event deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Master Schedule</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Event
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6 hover:border-[#CFFF4A]/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <StatusBadge status={event.status} />
                <button onClick={() => setDeleteTarget(event)} className="text-[#8DA8A9] hover:text-[#FF4DA6] opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  Delete
                </button>
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{event.title}</h3>
              <p className="text-sm text-[#8DA8A9] mb-4">{event.client_name}</p>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center gap-2 text-[#8DA8A9]">
                  <Clock size={14} className="text-[#CFFF4A]" />
                  {new Date(event.date).toLocaleString()}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-[#8DA8A9]">
                    <MapPin size={14} className="text-[#CFFF4A]" />
                    {event.location}
                  </div>
                )}
              </div>
              {event.assigned_professionals && event.assigned_professionals.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {event.assigned_professionals.map((p: any) => (
                    <span key={p.id} className="text-[10px] bg-[#112224] text-[#CFFF4A] px-2 py-0.5 rounded">{p.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreateModal
        title="New Event"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'client_id', label: 'Client', type: 'select', options: [{ value: '', label: 'None' }, ...clients] },
          { key: 'date', label: 'Date & Time', type: 'datetime-local', required: true },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: [{ value: 'Upcoming', label: 'Upcoming' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }] },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.title}?`}
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
