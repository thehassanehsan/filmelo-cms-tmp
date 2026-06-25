import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!token) { toast.error('Invalid reset token'); return; }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#112224] border border-white/10 rounded-2xl p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
        <p className="text-[#8DA8A9] text-sm mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-[#1A3A3D] rounded-lg bg-[#09090B] text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all"
                placeholder="Min 8 characters"
              />
            </div>
            <p className="text-[10px] text-[#8DA8A9] mt-1">Min 8 chars, 1 uppercase, 1 number recommended</p>
          </div>
          <div>
            <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-[#1A3A3D] rounded-lg bg-[#09090B] text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all"
                placeholder="Confirm your password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-sm font-bold text-[#08383A] bg-[#CFFF4A] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <button
          onClick={() => navigate('/login')}
          className="mt-6 flex items-center gap-2 text-sm text-[#CFFF4A] hover:text-[#FF4DA6] transition-colors"
        >
          <ArrowLeft size={16} /> Back to login
        </button>
      </motion.div>
    </div>
  );
}
