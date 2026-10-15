import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Info,
  DotsSixVertical,
  Gear,
  CarProfile,
  Buildings,
  ShieldCheck,
  FileText,
  PencilSimple,
  Trash,
  X,
  BookOpen,
  Users as UsersIcon,
  Lightning,
  Globe,
  Wrench,
  ChartBar,
  Briefcase,
  Heart
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  portal_count?: number;
}

const ICON_OPTIONS = [
  { name: 'Gear', label: 'Operasional', component: Gear },
  { name: 'CarProfile', label: 'Kendaraan', component: CarProfile },
  { name: 'Buildings', label: 'Infrastruktur', component: Buildings },
  { name: 'ShieldCheck', label: 'Keamanan', component: ShieldCheck },
  { name: 'FileText', label: 'Dokumen', component: FileText },
  { name: 'BookOpen', label: 'Training', component: BookOpen },
  { name: 'UsersIcon', label: 'SDM', component: UsersIcon },
  { name: 'Lightning', label: 'Utilitas', component: Lightning },
  { name: 'Globe', label: 'Web', component: Globe },
  { name: 'Wrench', label: 'Maintenance', component: Wrench },
  { name: 'ChartBar', label: 'Laporan', component: ChartBar },
  { name: 'Briefcase', label: 'Manajemen', component: Briefcase },
  { name: 'Heart', label: 'Layanan', component: Heart },
];

export default function Categories() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('categories', 'create');
  const canUpdate = hasPermission('categories', 'update');
  const canDelete = hasPermission('categories', 'delete');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Gear' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const logActivity = async (action: string, target: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', details?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('activity_logs').insert({
        user_id: userData.user.id,
        action,
        target,
        details,
        type,
      });
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (catError) throw catError;

      const { data: portalData } = await supabase
        .from('portal_items')
        .select('category');

      const countMap: Record<string, number> = {};
      (portalData || []).forEach((p: any) => {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      });

      const enriched = (catData || []).map(cat => ({
        ...cat,
        portal_count: countMap[cat.name] || 0,
      }));

      setCategories(enriched);
    } catch {
      toast.error('Gagal mengambil kategori');
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean, name: string) => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki izin untuk mengubah kategori');
      return;
    }
    const { error } = await supabase.from('categories').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui status');
    } else {
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      await logActivity(!currentStatus ? 'mengaktifkan' : 'menonaktifkan', `Kategori ${name}`, 'info');
      toast.success(`Kategori ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, icon: category.icon || 'Gear' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', icon: 'Gear' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', icon: 'Gear' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    setIsSubmitting(true);

    if (editingCategory) {
      const oldName = editingCategory.name;
      const newName = formData.name.trim();
      const { error } = await supabase
        .from('categories')
        .update({ name: newName, icon: formData.icon })
        .eq('id', editingCategory.id);

      if (error) {
        toast.error('Gagal memperbarui: ' + error.message);
      } else {
        // If category name changed, also update linked portal_items so they don't get orphaned
        if (oldName !== newName) {
          await supabase
            .from('portal_items')
            .update({ category: newName })
            .eq('category', oldName);
        }
        await logActivity('memperbarui', `Kategori ${newName}`, 'info');
        toast.success('Kategori berhasil diperbarui');
        handleCloseModal();
        fetchCategories();
      }
    } else {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
      const newName = formData.name.trim();
      const { error } = await supabase
        .from('categories')
        .insert({ 
          name: newName, 
          icon: formData.icon, 
          is_active: true, 
          display_order: maxOrder + 1 
        });

      if (error) {
        toast.error('Gagal menambahkan: ' + error.message);
      } else {
        await logActivity('membuat', `Kategori ${newName}`, 'success');
        toast.success('Kategori berhasil ditambahkan');
        handleCloseModal();
        fetchCategories();
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (cat: Category) => {
    if (cat.portal_count && cat.portal_count > 0) {
      toast.error(`Tidak bisa menghapus "${cat.name}" karena masih memiliki ${cat.portal_count} portal terhubung`);
      return;
    }
    if (!confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      toast.error('Gagal menghapus: ' + error.message);
    } else {
      await logActivity('menghapus', `Kategori ${cat.name}`, 'error');
      toast.success('Kategori berhasil dihapus');
      setCategories(categories.filter(c => c.id !== cat.id));
    }
  };

  const handleDropCategory = async (targetId: string) => {
    if (!canUpdate || !draggedCategoryId || draggedCategoryId === targetId) return;

    const draggedIdx = categories.findIndex(c => c.id === draggedCategoryId);
    const targetIdx = categories.findIndex(c => c.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const reordered = [...categories];
    const [draggedItem] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);

    const updatedWithOrder = reordered.map((c, idx) => ({ ...c, display_order: idx }));
    setCategories(updatedWithOrder);
    setDraggedCategoryId(null);

    const loadingToast = toast.loading('Menyimpan urutan kategori...');
    try {
      await Promise.all(
        updatedWithOrder.map((c, idx) =>
          supabase.from('categories').update({ display_order: idx }).eq('id', c.id)
        )
      );
      await logActivity('mengurutkan ulang', 'Kategori Layanan', 'info');
      toast.success('Urutan kategori berhasil disimpan', { id: loadingToast });
    } catch {
      toast.error('Gagal menyimpan urutan kategori', { id: loadingToast });
      fetchCategories();
    }
  };

  const getPhosphorIcon = (iconName: string) => {
    const found = ICON_OPTIONS.find(i => i.name === iconName);
    return found?.component || null;
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      
      {/* Header */}
      <AdminHeader 
        title="Kategori Layanan" 
        subtitle="Kategori digunakan untuk memfilter portal di halaman eksplorasi publik"
        action={
          canCreate && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" weight="bold" /> Tambah Kategori
            </button>
          )
        }
      />

      {/* Info Alert */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
        <Info className="w-5 h-5 text-slate-500 shrink-0" weight="regular" />
        <p className="text-sm font-medium text-slate-700">
          Seret ikon titik enam di sebelah kiri untuk mengatur urutan tampil kategori di halaman publik.
        </p>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Memuat kategori...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gear className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Belum Ada Kategori</h3>
            <p className="text-slate-500 text-sm mb-4">Mulai dengan menambahkan kategori pertama untuk portal Anda.</p>
            {canCreate && (
              <button 
                onClick={() => handleOpenModal()}
                className="text-slate-900 font-medium hover:underline flex items-center gap-2 mx-auto"
              >
                <Plus weight="bold" /> Tambah Kategori
              </button>
            )}
          </div>
        ) : categories.map((cat) => {
          const IconComponent = getPhosphorIcon(cat.icon);
          return (
            <div
              key={cat.id}
              draggable={canUpdate}
              onDragStart={(e) => {
                if (!canUpdate) return;
                setDraggedCategoryId(cat.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!canUpdate) return;
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropCategory(cat.id);
              }}
              onDragEnd={() => setDraggedCategoryId(null)}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-all group ${
                draggedCategoryId === cat.id ? 'opacity-50 bg-blue-50/40' : ''
              }`}
            >
              {/* Drag Handle */}
              <div
                className={`text-slate-300 group-hover:text-slate-400 transition-colors ${
                  canUpdate ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-40'
                }`}
                title={canUpdate ? 'Seret untuk mengubah urutan' : undefined}
              >
                <DotsSixVertical className="w-5 h-5" weight="bold" />
              </div>

              {/* Icon Container */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                cat.is_active 
                  ? 'bg-blue-50 border-blue-100 text-blue-700' 
                  : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
                {IconComponent ? (
                  <IconComponent className="w-5 h-5" weight="fill" />
                ) : (
                  <span className="font-bold text-sm">{cat.name.charAt(0)}</span>
                )}
              </div>

              {/* Text & Count */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <h3 className={`font-semibold truncate ${cat.is_active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {cat.name}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  cat.portal_count && cat.portal_count > 0
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.portal_count || 0} Portal
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                
                {/* Toggle Switch */}
                <button 
                  onClick={() => handleToggle(cat.id, cat.is_active, cat.name)}
                  disabled={!canUpdate}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${
                    !canUpdate ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    cat.is_active ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                  title={cat.is_active ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    cat.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>

                {(canUpdate || canDelete) && <div className="w-px h-6 bg-slate-200"></div>}

                {/* Edit */}
                {canUpdate && (
                  <button 
                    onClick={() => handleOpenModal(cat)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title="Edit Kategori"
                  >
                    <PencilSimple className="w-[18px] h-[18px]" weight="bold" />
                  </button>
                )}
                {/* Delete */}
                {canDelete && (
                  <button 
                    onClick={() => handleDelete(cat)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Hapus Kategori"
                  >
                    <Trash className="w-[18px] h-[18px]" weight="bold" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            style={{ animation: 'springBounce 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingCategory ? 'Ubah nama atau ikon kategori' : 'Buat kategori baru untuk portal'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100">
                <X size={18} weight="bold" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Kategori</label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="contoh: Manajemen, Training, dll"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Pilih Ikon</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((icon) => {
                    const Comp = icon.component;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                          formData.icon === icon.name
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-700'
                        }`}
                        title={icon.label}
                      >
                        <Comp className="w-5 h-5" weight={formData.icon === icon.name ? 'fill' : 'regular'} />
                        <span className="truncate w-full text-center">{icon.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
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
