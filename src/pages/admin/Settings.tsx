import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { toast } from 'sonner';
import { User, Shield } from 'lucide-react';

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    backup_email: user?.backup_email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error('Failed to update profile'); }
    setIsSaving(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setIsSaving(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setIsSaving(false);
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-[#0A2426] border border-[#1A3A3D]">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#CFFF4A] data-[state=active]:text-[#08383A]">
            <User size={14} className="mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#CFFF4A] data-[state=active]:text-[#08383A]">
            <Shield size={14} className="mr-2" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6 max-w-lg">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Email</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-[#8DA8A9] cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Backup Email</label>
                <input
                  type="email"
                  value={profileForm.backup_email}
                  onChange={(e) => setProfileForm({ ...profileForm, backup_email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                  placeholder="recovery@email.com"
                />
              </div>
              <button onClick={handleProfileSave} disabled={isSaving} className="bg-[#CFFF4A] text-[#08383A] px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="bg-[#0A2426] border border-[#1A3A3D] rounded-2xl p-6 max-w-lg">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2 block">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-[#09090B] border border-[#1A3A3D] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF4A]"
                />
              </div>
              <button onClick={handlePasswordChange} disabled={isSaving} className="bg-[#CFFF4A] text-[#08383A] px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-all disabled:opacity-50">
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
