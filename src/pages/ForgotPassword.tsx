import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
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
        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-[#8DA8A9] text-sm mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-[#1A3A3D] rounded-lg bg-[#09090B] text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-sm font-bold text-[#08383A] bg-[#CFFF4A] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle size={48} className="mx-auto mb-4 text-[#CFFF4A]" />
            <h3 className="text-xl font-bold text-white mb-2">Check your email!</h3>
            <p className="text-[#8DA8A9] text-sm mb-6">
              We've sent a password reset link to <span className="text-[#CFFF4A]">{email}</span>
            </p>
          </div>
        )}
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
