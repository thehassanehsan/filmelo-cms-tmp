import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'professional' | 'client';
  modules?: Array<{ name: string; path: string }>;
  showSidebar?: boolean;
}

export default function DashboardLayout({ children, role, modules, showSidebar = true }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]">
      {showSidebar && role === 'admin' && <Sidebar />}
      <div className={showSidebar && role === 'admin' ? 'ml-64' : ''}>
        <TopNavigation modules={modules} role={role} />
        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8 max-w-[1400px] mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
