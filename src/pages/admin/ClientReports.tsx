import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { clientReportsApi, clientsApi } from '@/services/api';
import { toast } from 'sonner';
import type { ClientReport } from '@/types';

export default function AdminClientReports() {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [clients, setClients] = useState<Array<{value: string; label: string}>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientReport | null>(null);
  const [viewReport, setViewReport] = useState<ClientReport | null>(null);

  const fetchData = async () => {
    try {
      const [repRes, cliRes] = await Promise.all([
        clientReportsApi.list(),
        clientsApi.list()
      ]);
      setReports(repRes.data.reports);
      setClients(cliRes.data.clients.map((c: any) => ({ value: c.id, label: c.company_name })));
    } catch (err) { toast.error('Failed to load reports'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await clientReportsApi.create(data);
      toast.success('Report created');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientReportsApi.delete(deleteTarget.id);
      toast.success('Report deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  const handleTogglePublish = async (report: ClientReport) => {
    try {
      await clientReportsApi.update(report.id, { is_published: !report.is_published });
      toast.success(report.is_published ? 'Report unpublished' : 'Report published');
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Client Reports</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Report
          </button>
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'client_name', label: 'Client' },
              { key: 'report_type', label: 'Type', render: (row) => <StatusBadge status={row.report_type} /> },
              { key: 'is_published', label: 'Status', render: (row) => <StatusBadge status={row.is_published ? 'Published' : 'Pending'} /> },
              { key: 'created_at', label: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString() },
            ]}
            data={reports}
            onEdit={(row) => setViewReport(row)}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </div>
      </div>

      <CreateModal
        title="New Client Report"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'client_id', label: 'Client', type: 'select', required: true, options: clients },
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'report_type', label: 'Type', type: 'select', options: [{ value: 'Progress', label: 'Progress' }, { value: 'Financial', label: 'Financial' }, { value: 'Final', label: 'Final' }, { value: 'Weekly', label: 'Weekly' }] },
          { key: 'content', label: 'Content', type: 'textarea', required: true },
        ]}
      />

      {/* View/Edit Modal */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewReport(null)}>
          <div className="w-full max-w-2xl bg-[#112224] border border-white/10 rounded-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-xl">{viewReport.title}</h3>
                <p className="text-[#8DA8A9] text-sm mt-1">{viewReport.client_name} | {viewReport.report_type}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleTogglePublish(viewReport)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewReport.is_published ? 'bg-[#CFFF4A]/20 text-[#CFFF4A]' : 'bg-[#1A3A3D] text-[#8DA8A9]'}`}>
                  {viewReport.is_published ? 'Published' : 'Draft'}
                </button>
                <button onClick={() => setViewReport(null)} className="text-[#8DA8A9] hover:text-white">Close</button>
              </div>
            </div>
            <div className="bg-[#09090B] rounded-lg p-6 text-sm text-[#E4E4E7] whitespace-pre-wrap leading-relaxed">
              {viewReport.content}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Report?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
