import { useEffect, useState } from 'react';
import { Plus, UserCheck } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { usersApi, authApi } from '@/services/api';
import { toast } from 'sonner';

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await usersApi.list({ role: 'professional' });
      setProfessionals(res.data.users);
    } catch (err) { toast.error('Failed to load professionals'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await authApi.register({ ...data, role: 'professional' });
      toast.success('Professional added');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget.id);
      toast.success('Professional deactivated');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Professionals</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> Add Professional
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={professionals.length} icon={UserCheck} />
          <StatCard label="Active" value={professionals.filter(p => p.is_active).length} icon={UserCheck} color="#CFFF4A" />
          <StatCard label="Inactive" value={professionals.filter(p => !p.is_active).length} icon={UserCheck} color="#FF4DA6" />
          <StatCard label="Avg Tasks" value="--" icon={UserCheck} color="#3B82F6" />
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'full_name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              { key: 'is_active', label: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Paused'} /> },
              { key: 'phone', label: 'Phone' },
              { key: 'last_login', label: 'Last Login', render: (row) => row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never' },
            ]}
            data={professionals}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </div>
      </div>

      <CreateModal
        title="Add Professional"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'full_name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Min 8 characters' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Deactivate ${deleteTarget?.full_name}?`}
        message="This user will no longer be able to log in."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
