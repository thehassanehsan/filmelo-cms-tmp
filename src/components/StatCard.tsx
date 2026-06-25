import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, color = '#CFFF4A', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6 hover:border-[#CFFF4A]/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">{label}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}
