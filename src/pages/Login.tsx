import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Briefcase, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [role, setRole] = useState<'professional' | 'admin'>('professional');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#09090B] font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#08383A] flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(207,255,74,0.08)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-8xl font-black text-[#CFFF4A] tracking-tighter" style={{ textShadow: '4px 4px 0px #FF4DA6' }}>
            FM
          </h1>
          <h2 className="text-3xl font-bold text-[#CFFF4A] mt-4 tracking-tight" style={{ textShadow: '2px 2px 0px #FF4DA6' }}>
            FILMELO MEDIA
          </h2>
          <p className="mt-6 text-[#8DA8A9] text-sm font-medium tracking-[0.2em] uppercase">
            Internal Agency Operating System
          </p>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#09090B] relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Secure Gateway</h2>
            <p className="text-[#8DA8A9] mt-2 text-sm">Enter your credentials to access the workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div className="flex p-1 bg-[#112224] border border-[#1A3A3D] rounded-lg">
              <button
                type="button"
                onClick={() => setRole('professional')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all ${
                  role === 'professional'
                    ? 'bg-[#CFFF4A] text-[#08383A] shadow-lg'
                    : 'text-[#8DA8A9] hover:text-white'
                }`}
              >
                <Briefcase size={16} /> Professional
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all ${
                  role === 'admin'
                    ? 'bg-[#FF4DA6] text-white shadow-lg'
                    : 'text-[#8DA8A9] hover:text-white'
                }`}
              >
                <ShieldAlert size={16} /> Administrator
              </button>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#1A3A3D] rounded-lg bg-[#09090B] text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-medium text-[#CFFF4A] hover:text-[#FF4DA6] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#1A3A3D] rounded-lg bg-[#09090B] text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-lg shadow-[0_0_15px_rgba(207,255,74,0.2)] text-sm font-bold text-[#08383A] bg-[#CFFF4A] hover:bg-white hover:shadow-[0_0_25px_rgba(255,77,166,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CFFF4A] transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              {isLoading ? 'Authenticating...' : 'Authenticate & Enter'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[#8DA8A9] uppercase tracking-wider">
            Don't have an account? Contact your administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
