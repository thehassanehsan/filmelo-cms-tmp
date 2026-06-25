import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, TrendingUp, DollarSign, Calendar,
  ClipboardList, UserCheck, Clock, FileText, FileBarChart,
  Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const modules = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'CRM & Clients', path: '/admin/clients', icon: Users },
  { name: 'Sales Pipeline', path: '/admin/sales', icon: TrendingUp },
  { name: 'Accounting', path: '/admin/accounting', icon: DollarSign },
  { name: 'Master Schedule', path: '/admin/schedule', icon: Calendar },
  { name: 'Task Management', path: '/admin/tasks', icon: ClipboardList },
  { name: 'Professionals', path: '/admin/professionals', icon: UserCheck },
  { name: 'Attendance', path: '/admin/attendance', icon: Clock },
  { name: 'Daily Reports', path: '/admin/reports', icon: FileText },
  { name: 'Client Reports', path: '/admin/client-reports', icon: FileBarChart },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-30 bg-[#0A2426] border-r border-[#1A3A3D] flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#1A3A3D] relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-[#CFFF4A] font-black text-xl shrink-0" style={{ textShadow: '2px 2px 0px #FF4DA6' }}>FM</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-white font-bold text-sm whitespace-nowrap"
              >
                FILMELO OS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#112224] border border-[#1A3A3D] rounded-full flex items-center justify-center text-[#8DA8A9] hover:text-[#CFFF4A] transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {modules.map((mod) => {
          const isActive = location.pathname === mod.path;
          const Icon = mod.icon;
          return (
            <button
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#112224] text-[#CFFF4A] border-l-[3px] border-[#CFFF4A]'
                  : 'text-[#8DA8A9] hover:text-white hover:bg-[#112224]/50'
              }`}
              title={collapsed ? mod.name : undefined}
            >
              <Icon size={20} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {mod.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#1A3A3D]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#CFFF4A]/20 flex items-center justify-center text-[#CFFF4A] font-bold text-xs shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-[10px] text-[#8DA8A9] uppercase">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8DA8A9] hover:text-[#FF4DA6]" onClick={logout}>
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
