import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { clientsApi, usersApi } from '@/services/api';
import { toast } from 'sonner';
import type { Client } from '@/types';

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Array<{value: string; label: string}>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, completed: 0 });

  const fetchClients = async () => {
    try {
      const res = await clientsApi.list();
      setClients(res.data.clients);
      const all = res.data.clients;
      setStats({
        total: all.length,
        active: all.filter((c: Client) => c.status === 'Active').length,
        paused: all.filter((c: Client) => c.status === 'Paused').length,
        completed: all.filter((c: Client) => c.status === 'Completed').length,
      });
    } catch (err) { toast.error('Failed to load clients'); }
  };

  const fetchProfessionals = async () => {
    try {
      const res = await usersApi.getProfessionals();
      setProfessionals(res.data.users.map((u: any) => ({ value: u.id, label: u.name })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchClients(); fetchProfessionals(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await clientsApi.create(data);
      toast.success('Client created');
      setIsCreateOpen(false);
      fetchClients();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to create client'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientsApi.delete(deleteTarget.id);
      toast.success('Client deleted');
      setDeleteTarget(null);
      fetchClients();
    } catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">CRM & Clients</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Client
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} icon={Plus} />
          <StatCard label="Active" value={stats.active} icon={Plus} color="#CFFF4A" />
          <StatCard label="Paused" value={stats.paused} icon={Plus} color="#F59E0B" />
          <StatCard label="Completed" value={stats.completed} icon={Plus} color="#3B82F6" />
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'company_name', label: 'Company' },
              { key: 'contact_name', label: 'Contact' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'assigned_professional_name', label: 'Assigned Professional' },
              { key: 'revenue', label: 'Revenue', render: (row) => `$${Number(row.revenue).toLocaleString()}` },
            ]}
            data={clients}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </div>
      </div>

      <CreateModal
        title="New Client"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'company_name', label: 'Company Name', type: 'text', required: true },
          { key: 'contact_name', label: 'Contact Name', type: 'text' },
          { key: 'user_email', label: 'Client Email', type: 'email', required: true, placeholder: 'For portal access' },
          { key: 'user_password', label: 'Initial Password', type: 'password', placeholder: 'Min 8 characters' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'type', label: 'Type', type: 'select', options: [{ value: 'Project', label: 'Project' }, { value: 'Retainer', label: 'Retainer' }] },
          { key: 'industry', label: 'Industry', type: 'text' },
          { key: 'assigned_professional_id', label: 'Assigned Professional', type: 'select', options: [{ value: '', label: 'Unassigned' }, ...professionals] },
          { key: 'notes', label: 'Notes', type: 'textarea' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.company_name}?`}
        message="This action cannot be undone. All associated data will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
