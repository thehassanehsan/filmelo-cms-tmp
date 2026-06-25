import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopNavigationProps {
  modules?: Array<{ name: string; path: string }>;
  role: 'admin' | 'professional' | 'client';
}

export default function TopNavigation({ modules, role }: TopNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const roleLabel = role === 'admin' ? 'ADMIN' : role === 'professional' ? 'PROFESSIONAL' : 'CLIENT';

  return (
    <nav className="sticky top-0 z-40 h-16 w-full backdrop-blur-xl bg-[#09090B]/80 border-b border-[#1A3A3D]/50 px-6 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#1A3A3D]">
          <img src="/fmlogo_2.jpg" alt="Filmelo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-white font-bold tracking-tight text-sm">
          FILMELO <span className="text-[10px] text-[#8DA8A9] ml-1 uppercase tracking-wider">{roleLabel}</span>
        </h2>
      </div>

      {/* Center modules */}
      {modules && modules.length > 0 && (
        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
          {modules.map((mod) => (
            <button
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                location.pathname === mod.path
                  ? 'bg-[#08383A] shadow-sm text-[#CFFF4A]'
                  : 'text-[#8DA8A9] hover:text-white'
              }`}
            >
              {mod.name}
            </button>
          ))}
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-[#8DA8A9] hover:text-[#CFFF4A]" onClick={toggleTheme}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="ghost" size="icon" className="text-[#8DA8A9] hover:text-[#CFFF4A] relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4DA6] rounded-full" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 bg-[#CFFF4A]/20 text-[#CFFF4A] hover:bg-[#CFFF4A]/30">
              <User size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#112224] border-[#1A3A3D] text-white">
            <DropdownMenuItem className="cursor-pointer hover:bg-[#1A3A3D]" onClick={() => navigate(`/${role}/settings`)}>
              <User size={14} className="mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#1A3A3D] text-[#FF4DA6]" onClick={logout}>
              <LogOut size={14} className="mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
