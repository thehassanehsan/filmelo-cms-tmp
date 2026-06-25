import { motion } from 'framer-motion';
import { Pencil, Trash2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  emptyMessage?: string;
}

export default function DataTable({ columns, data, onEdit, onDelete, emptyMessage = 'No data available' }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8DA8A9]">
        <Inbox size={48} className="mb-4 opacity-30" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1A3A3D]">
            {columns.map((col) => (
              <th key={col.key} className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8DA8A9]">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="py-3 px-4 w-24" />}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={row.id || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-[#1A3A3D]/50 hover:bg-[#112224]/50 transition-colors group"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-[13px]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8DA8A9] hover:text-[#CFFF4A]" onClick={() => onEdit(row)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8DA8A9] hover:text-[#FF4DA6]" onClick={() => onDelete(row)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
