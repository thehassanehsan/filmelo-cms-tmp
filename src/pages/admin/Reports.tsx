import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/DataTable';
import { dailyReportsApi, usersApi } from '@/services/api';
import { toast } from 'sonner';

export default function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProf, setSelectedProf] = useState('');
  const [expandedReport, setExpandedReport] = useState<any>(null);

  const fetchData = async () => {
    try {
      const params: any = {};
      if (selectedProf) params.professional_id = selectedProf;
      const [repRes, profRes] = await Promise.all([
        dailyReportsApi.list(params),
        usersApi.getProfessionals()
      ]);
      setReports(repRes.data.reports);
      setProfessionals(profRes.data.users);
    } catch (err) { toast.error('Failed to load reports'); }
  };

  useEffect(() => { fetchData(); }, [selectedProf]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Daily Reports</h1>

        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedProf}
            onChange={(e) => setSelectedProf(e.target.value)}
            className="px-3 py-2 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white text-sm"
          >
            <option value="">All Professionals</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6">
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'professional_name', label: 'Professional' },
              { key: 'hours_worked', label: 'Hours' },
              { key: 'report_text', label: 'Preview', render: (row) => (
                <span className="text-[#8DA8A9] text-xs truncate max-w-[200px] block">{row.report_text}</span>
              )},
            ]}
            data={reports}
            onEdit={(row) => setExpandedReport(row)}
          />
        </div>
      </div>

      {/* Report Detail Modal */}
      {expandedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setExpandedReport(null)}>
          <div className="w-full max-w-lg bg-[#112224] border border-white/10 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Daily Report</h3>
                <p className="text-[#8DA8A9] text-xs mt-1">{expandedReport.professional_name} | {new Date(expandedReport.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setExpandedReport(null)} className="text-[#8DA8A9] hover:text-white">Close</button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-[#CFFF4A]" />
              <span className="text-[#CFFF4A] text-sm font-bold">{expandedReport.hours_worked || 0} hours</span>
            </div>
            <div className="bg-[#09090B] rounded-lg p-4 text-sm text-[#E4E4E7] whitespace-pre-wrap leading-relaxed">
              {expandedReport.report_text}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
