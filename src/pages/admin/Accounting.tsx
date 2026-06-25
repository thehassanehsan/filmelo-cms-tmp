import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import CreateModal from '@/components/modals/CreateModal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { accountingApi, clientsApi } from '@/services/api';
import { toast } from 'sonner';
import type { AccountingEntry } from '@/types';

export default function AdminAccounting() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [clients, setClients] = useState<Array<{value: string; label: string}>>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AccountingEntry | null>(null);
  const [filterType, setFilterType] = useState('');

  const fetchData = async () => {
    try {
      const [accRes, clientsRes] = await Promise.all([
        accountingApi.list(filterType ? { type: filterType } : undefined),
        clientsApi.list()
      ]);
      setEntries(accRes.data.entries);
      setSummary(accRes.data.summary);
      setClients(clientsRes.data.clients.map((c: any) => ({ value: c.id, label: c.company_name })));
    } catch (err) { toast.error('Failed to load data'); }
  };

  useEffect(() => { fetchData(); }, [filterType]);

  const handleCreate = async (data: any) => {
    try {
      await accountingApi.create(data);
      toast.success('Entry created');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await accountingApi.delete(deleteTarget.id);
      toast.success('Entry deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Accounting</h1>
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#CFFF4A] text-[#08383A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all">
            <Plus size={16} /> New Entry
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Income" value={`$${summary.income.toLocaleString()}`} icon={TrendingUp} color="#CFFF4A" />
          <StatCard label="Total Expenses" value={`$${summary.expense.toLocaleString()}`} icon={TrendingDown} color="#FF4DA6" />
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#CFFF4A]/5 rounded-full blur-2xl" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9] mb-2 relative z-10">Net Profit</p>
            <p className={`text-3xl font-bold relative z-10 ${summary.net >= 0 ? 'text-white' : 'text-[#FF4DA6]'}`}>
              ${summary.net.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {['', 'Income', 'Expense'].map((type) => (
            <button
              key={type || 'all'}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === type ? 'bg-[#CFFF4A] text-[#08383A]' : 'bg-[#112224] text-[#8DA8A9] border border-[#1A3A3D]'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'description', label: 'Description' },
              { key: 'client_name', label: 'Client' },
              { key: 'category', label: 'Category' },
              { key: 'type', label: 'Type', render: (row) => (
                <span className={`text-xs font-bold ${row.type === 'Income' ? 'text-[#CFFF4A]' : 'text-[#FF4DA6]'}`}>{row.type}</span>
              )},
              { key: 'amount', label: 'Amount', render: (row) => (
                <span className={`font-bold ${row.type === 'Income' ? 'text-[#CFFF4A]' : 'text-[#FF4DA6]'}`}>
                  {row.type === 'Income' ? '+' : '-'}${Number(row.amount).toLocaleString()}
                </span>
              )},
            ]}
            data={entries}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </div>
      </div>

      <CreateModal
        title="New Transaction"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        fields={[
          { key: 'description', label: 'Description', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'Income', label: 'Income' }, { value: 'Expense', label: 'Expense' }] },
          { key: 'amount', label: 'Amount', type: 'number', required: true },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'client_id', label: 'Client', type: 'select', options: [{ value: '', label: 'None' }, ...clients] },
          { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Production, Equipment' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Transaction?"
        message="This will permanently remove this entry."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
