import { useEffect, useState } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { salesApi, clientsApi, usersApi } from '@/services/api';
import { toast } from 'sonner';
import type { Sale } from '@/types';

const STAGES = ['Lead Generation', 'Pitch Sent', 'Negotiation', 'Closed Won'];

export default function AdminSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Array<{value: string; label: string}>>([]);
  const [professionals, setProfessionals] = useState<Array<{value: string; label: string}>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);

  const fetchData = async () => {
    try {
      const [salesRes, clientsRes, profsRes] = await Promise.all([
        salesApi.list(),
        clientsApi.list(),
        usersApi.getProfessionals()
      ]);
      setSales(salesRes.data.sales);
      setClients(clientsRes.data.clients.map((c: any) => ({ value: c.id, label: c.company_name })));
      setProfessionals(profsRes.data.users.map((u: any) => ({ value: u.id, label: u.name })));
    } catch (err) { toast.error('Failed to load data'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await salesApi.create(data);
      toast.success('Deal created');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleUpdate = async (data: any) => {
    if (!editingSale) return;
    try {
      await salesApi.update(editingSale.id, data);
      toast.success('Deal updated');
      setEditingSale(null);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await salesApi.delete(deleteTarget.id);
      toast.success('Deal deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  const totalValue = sales.reduce((sum, s) => sum + Number(s.value), 0);
  const avgDealSize = sales.length > 0 ? totalValue / sales.length : 0;
  const wonDeals = sales.filter(s => s.stage === 'Closed Won');
  const winRate = sales.length > 0 ? (wonDeals.length / sales.length * 100).toFixed(0) : 0;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Deal
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">Total Pipeline</p>
            <p className="text-2xl font-bold text-white mt-1">${totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">Avg Deal Size</p>
            <p className="text-2xl font-bold text-white mt-1">${avgDealSize.toLocaleString()}</p>
          </div>
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">Win Rate</p>
            <p className="text-2xl font-bold text-[#CFFF4A] mt-1">{winRate}%</p>
          </div>
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">Total Deals</p>
            <p className="text-2xl font-bold text-white mt-1">{sales.length}</p>
          </div>
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="min-w-[280px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white">{stage}</h3>
                <span className="text-xs text-[#8DA8A9] bg-[#1A3A3D] px-2 py-0.5 rounded-full">
                  {sales.filter(s => s.stage === stage).length}
                </span>
              </div>
              <div className="bg-[#0A2426]/50 border border-[#1A3A3D]/50 rounded-xl p-3 space-y-3 min-h-[400px]">
                {sales.filter(s => s.stage === stage).map((sale) => (
                  <motion.div
                    key={sale.id}
                    layout
                    className="bg-[#0A2426] border border-[#1A3A3D] p-4 rounded-xl cursor-pointer hover:border-[#CFFF4A]/50 transition-all group"
                    onClick={() => setEditingSale(sale)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-[#3F3F46] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{sale.deal_name}</h4>
                        <p className="text-xs text-[#8DA8A9] mt-1">{sale.client_name}</p>
                        <p className="text-sm font-bold text-[#CFFF4A] mt-2">${Number(sale.value).toLocaleString()}</p>
                        {sale.probability && (
                          <div className="mt-2 w-full bg-[#1A3A3D] rounded-full h-1.5">
                            <div className="bg-[#CFFF4A] h-1.5 rounded-full" style={{ width: `${sale.probability}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(sale); }} className="text-[11px] text-[#FF4DA6] hover:underline">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateModal
        title="New Deal"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'deal_name', label: 'Deal Name', type: 'text', required: true },
          { key: 'client_id', label: 'Client', type: 'select', required: true, options: clients },
          { key: 'value', label: 'Value', type: 'number' },
          { key: 'stage', label: 'Stage', type: 'select', options: STAGES.map(s => ({ value: s, label: s })) },
          { key: 'close_date', label: 'Expected Close', type: 'date' },
          { key: 'assigned_closer_id', label: 'Assigned Closer', type: 'select', options: [{ value: '', label: 'Unassigned' }, ...professionals] },
          { key: 'probability', label: 'Probability (%)', type: 'number' },
          { key: 'notes', label: 'Notes', type: 'textarea' },
        ]}
      />

      {editingSale && (
        <CreateModal
          title="Edit Deal"
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
          onSubmit={handleUpdate}
          fields={[
            { key: 'deal_name', label: 'Deal Name', type: 'text', required: true },
            { key: 'client_id', label: 'Client', type: 'select', required: true, options: clients },
            { key: 'value', label: 'Value', type: 'number' },
            { key: 'stage', label: 'Stage', type: 'select', options: STAGES.map(s => ({ value: s, label: s })) },
            { key: 'close_date', label: 'Expected Close', type: 'date' },
            { key: 'assigned_closer_id', label: 'Assigned Closer', type: 'select', options: [{ value: '', label: 'Unassigned' }, ...professionals] },
            { key: 'probability', label: 'Probability (%)', type: 'number' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.deal_name}?`}
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
