import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { tasksApi, clientsApi, usersApi } from '@/services/api';
import { toast } from 'sonner';
import type { Task } from '@/types';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Array<{value: string; label: string}>>([]);
  const [professionals, setProfessionals] = useState<Array<{value: string; label: string}>>([]);
  const [, setAllTasks] = useState<Array<{value: string; label: string}>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      const [tasksRes, cliRes, profRes] = await Promise.all([
        tasksApi.list(statusFilter ? { status: statusFilter } : undefined),
        clientsApi.list(),
        usersApi.getProfessionals()
      ]);
      setTasks(tasksRes.data.tasks);
      setClients(cliRes.data.clients.map((c: any) => ({ value: c.id, label: c.company_name })));
      setProfessionals(profRes.data.users.map((u: any) => ({ value: u.id, label: u.name })));
      setAllTasks(tasksRes.data.tasks.map((t: Task) => ({ value: t.id, label: t.title })));
    } catch (err) { toast.error('Failed to load tasks'); }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async (data: any) => {
    try {
      await tasksApi.create(data);
      toast.success('Task created');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tasksApi.delete(deleteTarget.id);
      toast.success('Task deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Task Management</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Task
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={tasks.length} icon={Plus} />
          <StatCard label="Pending" value={tasks.filter(t => t.status === 'Pending').length} icon={Plus} color="#F59E0B" />
          <StatCard label="In Progress" value={tasks.filter(t => t.status === 'In Progress').length} icon={Plus} color="#3B82F6" />
          <StatCard label="Completed" value={tasks.filter(t => t.status === 'Completed').length} icon={Plus} color="#CFFF4A" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['', 'Pending', 'In Progress', 'Completed', 'Blocked'].map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-[#CFFF4A] text-[#08383A]' : 'bg-[#112224] text-[#8DA8A9] border border-[#1A3A3D]'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'title', label: 'Task' },
              { key: 'client_name', label: 'Client' },
              { key: 'assigned_professional_name', label: 'Assigned To' },
              { key: 'priority', label: 'Priority', render: (row) => <StatusBadge status={row.priority} /> },
              { key: 'deadline', label: 'Deadline', render: (row) => row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'dependencies', label: 'Deps', render: (row) => (
                <span className="text-[#8DA8A9] text-xs">{row.dependencies?.length || 0}</span>
              )},
            ]}
            data={tasks}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </div>
      </div>

      <CreateModal
        title="New Task"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'title', label: 'Task Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'client_id', label: 'Client', type: 'select', options: [{ value: '', label: 'None' }, ...clients] },
          { key: 'assigned_professional_id', label: 'Assigned Professional', type: 'select', options: [{ value: '', label: 'Unassigned' }, ...professionals] },
          { key: 'priority', label: 'Priority', type: 'select', options: [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }] },
          { key: 'deadline', label: 'Deadline', type: 'date' },
          { key: 'estimated_hours', label: 'Estimated Hours', type: 'number' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.title}?`}
        message="This will permanently remove this task."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
