interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  Active: 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  Present: 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  Completed: 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  Published: 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  'Closed Won': 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  Pending: 'bg-[#1A3A3D] text-[#8DA8A9]',
  Paused: 'bg-[#1A3A3D] text-[#8DA8A9]',
  Absent: 'bg-[#FF4DA6]/20 text-[#FF4DA6]',
  'In Progress': 'bg-blue-500/20 text-blue-400',
  Upcoming: 'bg-blue-500/20 text-blue-400',
  Late: 'bg-amber-500/20 text-amber-400',
  Blocked: 'bg-[#FF4DA6]/20 text-[#FF4DA6]',
  High: 'bg-orange-500/20 text-orange-400',
  Urgent: 'bg-[#FF4DA6]/20 text-[#FF4DA6]',
  Medium: 'bg-blue-500/20 text-blue-400',
  Low: 'bg-[#1A3A3D] text-[#8DA8A9]',
  Income: 'bg-[#CFFF4A]/20 text-[#CFFF4A]',
  Expense: 'bg-[#FF4DA6]/20 text-[#FF4DA6]',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-[#1A3A3D] text-[#8DA8A9]';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {status}
    </span>
  );
}
