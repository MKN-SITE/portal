import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Plus, Trash, PencilSimple, Key, UserPlus } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'admin' });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchUsers();
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user);
    });
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admin_users');
      
    if (error) {
      toast.error('Gagal memuat pengguna: ' + error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Edit mode: only update role (and optionally password)
        if (formData.password && formData.password.length >= 6) {
          // Update password via RPC
          const { error: pwError } = await supabase.rpc('admin_update_password', {
            p_email: formData.email,
            p_password: formData.password
          });
          if (pwError) throw pwError;
        }
        // Update role
        const { error: roleError } = await supabase.rpc('assign_user_role', {
          p_email: formData.email,
          p_role: formData.role
        });
        if (roleError) throw roleError;
        toast.success(`Berhasil memperbarui peran ${formData.email}`);
      } else {
        // Create mode: use create_or_assign_admin RPC for instant verified user creation
        if (!formData.password || formData.password.length < 6) {
          toast.error('Password harus minimal 6 karakter');
          setIsSubmitting(false);
          return;
        }

        const { error: createError } = await supabase.rpc('create_or_assign_admin', {
          p_email: formData.email,
          p_password: formData.password,
          p_role: formData.role
        });

        if (createError) throw createError;
        toast.success(`Berhasil menambahkan pengguna ${formData.email} sebagai ${formData.role}`);
      }

      setIsModalOpen(false);
      setFormData({ email: '', password: '', role: 'admin' });
      setIsEditMode(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengguna');
    }
    setIsSubmitting(false);
  };

  const handleRemoveRole = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Akun akan dihapus permanen.')) return;
    
    const { error } = await supabase.rpc('delete_admin_user', {
      p_user_id: userId
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    }
  };

  const handleResetPassword = async (email: string) => {
    const newPassword = window.prompt(`Masukkan password baru untuk ${email}:`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password harus minimal 6 karakter');
      return;
    }

    toast.promise(
      (async () => {
        const { error } = await supabase.rpc('admin_update_password', {
          p_email: email,
          p_password: newPassword
        });
        if (error) throw error;
      })(),
      {
        loading: 'Mereset password...',
        success: 'Password berhasil direset',
        error: (err) => `Gagal mereset password: ${err.message}`
      }
    );
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      
      {/* Header */}
      <AdminHeader 
        title="Pengguna Admin" 
        subtitle="Kelola akses dan peran pengguna di dalam sistem portal"
        action={
          <button 
            onClick={() => {
              setFormData({ email: '', password: '', role: 'admin' });
              setIsEditMode(false);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" weight="bold" /> Tambah Pengguna
          </button>
        }
      />

      <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Peran (Role)</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Dibuat Pada</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada pengguna admin.</td></tr>
              ) : users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-semibold text-slate-900">{u.email || 'Unknown User'}</span>
                      {sessionUser?.id === u.user_id && (
                         <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Anda</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5" weight="fill" />
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'editor' ? 'Editor' : u.role.toUpperCase()}
                      </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-4 px-6 flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleResetPassword(u.email)}
                      className="text-slate-400 hover:text-blue-600 transition-colors" title="Reset Password"
                    >
                      <Key className="w-5 h-5" weight="fill" />
                    </button>
                    <button 
                      onClick={() => {
                        setFormData({ email: u.email, password: '', role: u.role });
                        setIsEditMode(true);
                        setIsModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-slate-900 transition-colors" title="Edit">
                      <PencilSimple className="w-5 h-5" weight="bold" />
                    </button>
                    <button 
                      onClick={() => handleRemoveRole(u.user_id)}
                      className="text-slate-400 hover:text-red-500 transition-colors" title="Hapus Pengguna">
                      <Trash className="w-5 h-5" weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah/Edit Admin */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {isEditMode ? 'Ubah peran atau password pengguna.' : 'Buat akun baru dengan hak akses ke sistem.'}
              </p>
            </div>
            
            <form onSubmit={handleAssignRole} className="p-6 space-y-5" autoComplete="off">
              {/* Fake hidden inputs to stop Chrome autofill */}
              <input type="email" name="fakeusernameremembered" style={{display: 'none'}} />
              <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Pengguna</label>
                <Input
                  type="email"
                  name="new_user_email"
                  required
                  autoComplete="new-password"
                  disabled={isEditMode}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@mkn.co.id"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEditMode ? 'Password Baru (Kosongkan jika tidak ingin mengubah)' : 'Password'}
                </label>
                <Input
                  type="password"
                  name="new_user_password"
                  autoComplete="new-password"
                  required={!isEditMode}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Peran (Role)</label>
                <Select
                  value={formData.role}
                  onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                  options={[
                    { value: 'admin', label: 'Super Admin (Akses Penuh)' },
                    { value: 'editor', label: 'Editor (Hanya kelola portal)' },
                  ]}
                  placeholder="Pilih Peran..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setIsEditMode(false); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
