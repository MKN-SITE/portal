import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { Input } from '../../components/ui/Input';
import { User, Key, SignOut, Camera } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { session, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Profile State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || '');
      setFullName(session.user.user_metadata?.full_name || '');
      setAvatarUrl(session.user.user_metadata?.avatar_url || '');
    }
  }, [session]);

  const logActivity = async (target: string) => {
    if (session?.user.id) {
      await supabase.from('activity_logs').insert({
        user_id: session.user.id,
        action: 'memperbarui',
        target: target,
        type: 'success'
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Silakan masukkan password lama Anda');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsUpdatingPassword(true);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user.email || '',
      password: oldPassword
    });

    if (signInError) {
      toast.error('Password lama salah');
      setIsUpdatingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error('Gagal memperbarui password: ' + error.message);
    } else {
      toast.success('Password berhasil diperbarui');
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      await logActivity('Password Profil');
    }
    setIsUpdatingPassword(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    const updates: { data: any, email?: string } = {
      data: { 
        full_name: fullName,
        avatar_url: avatarUrl
      }
    };

    const isEmailChanged = email !== session?.user.email;
    if (isEmailChanged) {
      updates.email = email;
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      toast.error('Gagal memperbarui profil: ' + error.message);
    } else {
      if (isEmailChanged) {
        toast.success('Profil diperbarui. Cek kotak masuk email baru untuk verifikasi.');
      } else {
        toast.success('Profil berhasil diperbarui');
      }
      await logActivity('Informasi Profil');
      await supabase.auth.refreshSession();
    }
    setIsUpdatingProfile(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    const toastId = toast.loading('Mengunggah foto...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${session?.user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portal_assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal_assets')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success('Foto berhasil diunggah, klik Simpan Profil untuk menerapkan', { id: toastId });
    } catch (error: any) {
      toast.error('Gagal mengunggah foto', { id: toastId });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil keluar');
    navigate('/admin/login');
  };

  const userEmail = session?.user?.email || '';
  const initial = (fullName || userEmail).charAt(0).toUpperCase();
  const roleLabel = userRole === 'admin' ? 'Super Admin' : userRole === 'editor' ? 'Editor' : 'User Biasa';

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      <AdminHeader 
        title="Profil Saya" 
        subtitle="Kelola informasi akun dan keamanan Anda"
        action={
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <SignOut className="w-4 h-4" weight="bold" /> Keluar (Logout)
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Info & Edit */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
            
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-white text-white flex items-center justify-center text-3xl font-bold shadow-md">
                  {initial || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border-4 border-transparent">
                <Camera className="w-8 h-8 text-white" weight="fill" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1 truncate w-full" title={fullName || userEmail}>
              {fullName || userEmail.split('@')[0]}
            </h2>
            <p className="text-sm text-slate-500 mb-4">{userEmail}</p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
              <User className="w-3.5 h-3.5" weight="fill" />
              {roleLabel}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Data Diri</h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap / Username</label>
              <Input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Email</label>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-[#1B3A6B] hover:bg-[#152e55] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* Password Update Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            
            <div className="p-8 pb-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Key className="w-6 h-6 text-emerald-600" weight="fill" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Keamanan Akun</h3>
                <p className="text-slate-500 text-sm mt-1">Ganti password akun Anda.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password Saat Ini</label>
                <Input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama Anda"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit"
                  disabled={!oldPassword || !password || !confirmPassword || isUpdatingPassword}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                    oldPassword && password && confirmPassword && !isUpdatingPassword
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isUpdatingPassword ? 'Memperbarui...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
