import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { PAGE_DEFINITIONS, PagePermission, DEFAULT_EDITOR_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from '../../config/permissions';
import { Eye, Plus, PencilSimple, Trash, FloppyDisk, ArrowCounterClockwise, Info, ShieldCheck } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Select } from '../../components/ui/Select';

export default function PermissionManager() {
  const [selectedRole, setSelectedRole] = useState<'editor' | 'user'>('editor');
  const [permissions, setPermissions] = useState<Record<string, PagePermission>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, PagePermission>>({});
  
  const { user, hasPermission, refreshPermissions } = useAuth();
  const canUpdatePermissions = hasPermission('permissions', 'update');

  useEffect(() => {
    fetchPermissions(selectedRole);
  }, [selectedRole]);

  const fetchPermissions = async (role: 'editor' | 'user') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role);

      if (error) throw error;

      const baseDefaults = role === 'editor' ? DEFAULT_EDITOR_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
      const perms: Record<string, PagePermission> = {};
      
      Object.entries(baseDefaults).forEach(([key, val]) => {
        perms[key] = { ...val };
      });
      
      if (data && data.length > 0) {
        data.forEach(row => {
          perms[row.page] = {
            can_view: row.can_view,
            can_create: row.can_create,
            can_update: row.can_update,
            can_delete: row.can_delete,
          };
        });
      }

      setPermissions(perms);
      setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast.error('Gagal memuat pengaturan izin: ' + (error?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (pageKey: string, action: keyof PagePermission) => {
    if (!canUpdatePermissions) return;
    setPermissions(prev => {
      const newPerms = { ...prev };
      const currentPerm = newPerms[pageKey] || { can_view: false, can_create: false, can_update: false, can_delete: false };
      const newValue = !currentPerm[action];
      
      const updatedPerm = { ...currentPerm, [action]: newValue };

      if (action === 'can_view' && !newValue) {
        updatedPerm.can_create = false;
        updatedPerm.can_update = false;
        updatedPerm.can_delete = false;
      }

      if ((action === 'can_create' || action === 'can_update' || action === 'can_delete') && newValue) {
        updatedPerm.can_view = true;
      }

      newPerms[pageKey] = updatedPerm;
      setHasChanges(true);
      return newPerms;
    });
  };

  const handleReset = () => {
    if (!canUpdatePermissions) return;
    const defaults = selectedRole === 'editor' ? DEFAULT_EDITOR_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
    setPermissions(JSON.parse(JSON.stringify(defaults)));
    setHasChanges(true);
    toast.success('Direset ke pengaturan bawaan. Jangan lupa simpan perubahan.');
  };

  const handleCancel = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!canUpdatePermissions) return;
    try {
      setSaving(true);
      for (const [page, p] of Object.entries(permissions)) {
        const perm = p as PagePermission;
        const { error } = await supabase.rpc('update_role_permission', {
          p_role: selectedRole,
          p_page: page,
          p_can_view: perm.can_view,
          p_can_create: perm.can_create,
          p_can_update: perm.can_update,
          p_can_delete: perm.can_delete,
        });
        
        if (error) {
          console.error('RPC Error details:', error);
          throw error;
        }
      }

      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'memperbarui',
          target: `Izin Role ${selectedRole === 'editor' ? 'Editor' : 'User Biasa'}`,
          type: 'info'
        });
      }
      
      await refreshPermissions();
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);
      toast.success('Perubahan izin berhasil disimpan');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const editablePages = PAGE_DEFINITIONS.filter(p => p.key !== 'profile');

  const ToggleSwitch = ({ 
    isEnabled, 
    onClick, 
  }: { 
    isEnabled: boolean; 
    onClick: () => void; 
  }) => (
    <button
      onClick={onClick}
      disabled={!canUpdatePermissions}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        !canUpdatePermissions ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isEnabled ? 'bg-[#1B3A6B]' : 'bg-slate-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
        isEnabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B]"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-24">
      <AdminHeader title="Pengaturan Izin" subtitle="Kelola hak akses untuk berbagai role pengguna" />
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800">Pilih Role Pengguna</h3>
          <p className="text-sm text-slate-500 mt-0.5">Izin di bawah ini akan diterapkan pada role yang Anda pilih</p>
        </div>
        <div className="w-full sm:w-64">
          <Select 
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'user', label: 'User Biasa' }
            ]}
            value={selectedRole}
            onChange={(val) => {
              if (hasChanges) {
                if (window.confirm('Ada perubahan yang belum disimpan. Yakin ingin mengganti role dan membuang perubahan?')) {
                  setSelectedRole(val as 'editor' | 'user');
                }
              } else {
                setSelectedRole(val as 'editor' | 'user');
              }
            }}
          />
        </div>
      </div>

      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" weight="fill" />
        <p className="text-sm text-amber-800 font-medium">Perubahan izin akan berlaku saat pengguna {selectedRole === 'editor' ? 'Editor' : 'User Biasa'} login kembali atau memuat ulang halaman.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-700 w-1/3">Modul & Halaman</th>
                <th className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Eye className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Lihat</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Plus className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Tambah</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <PencilSimple className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Edit</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Trash className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Hapus</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {editablePages.map((page) => {
                const currentPerms = permissions[page.key] || { can_view: false, can_create: false, can_update: false, can_delete: false };
                
                return (
                  <tr key={page.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{page.label}</div>
                          <div className="text-sm text-slate-500 mt-0.5">{page.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ToggleSwitch 
                        isEnabled={currentPerms.can_view}
                        onClick={() => handleToggle(page.key, 'can_view')}
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      {page.supportsCreate ? (
                        <ToggleSwitch 
                          isEnabled={currentPerms.can_create}
                          onClick={() => handleToggle(page.key, 'can_create')}
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {page.supportsUpdate ? (
                        <ToggleSwitch 
                          isEnabled={currentPerms.can_update}
                          onClick={() => handleToggle(page.key, 'can_update')}
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {page.supportsDelete ? (
                        <ToggleSwitch 
                          isEnabled={currentPerms.can_delete}
                          onClick={() => handleToggle(page.key, 'can_delete')}
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasChanges && canUpdatePermissions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 z-50 flex flex-wrap items-center justify-center gap-4 transition-transform animate-fade-in-up">
          <button 
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowCounterClockwise className="w-5 h-5" />
            Reset ke Default
          </button>
          
          <button 
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl font-medium text-white bg-[#1B3A6B] hover:bg-[#152e55] shadow-lg shadow-[#1B3A6B]/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FloppyDisk className="w-5 h-5" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </div>
  );
}
