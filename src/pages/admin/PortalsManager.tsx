import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { PortalSite } from '../../types';
import { PencilSimple, Trash, Plus, ArrowUpRight, X, UploadSimple, Plugs, Info } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { useAuth } from '../../contexts/AuthContext';
import { AdminHeader } from '../../components/ui/AdminHeader';

interface PortalFormData {
  id?: string;
  title: string;
  category: string;
  url: string;
  customIcon?: string;
  description?: string;
}

const defaultFormData: PortalFormData = {
  title: '',
  category: '',
  url: '',
  customIcon: '',
  description: ''
};

export default function PortalsManager() {
  const { hasPermission } = useAuth();
  const [portals, setPortals] = useState<PortalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPortal, setViewPortal] = useState<PortalSite | null>(null);
  const [formData, setFormData] = useState<PortalFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [draggedPortalId, setDraggedPortalId] = useState<string | null>(null);

  useEffect(() => {
    fetchPortals();
    fetchCategoriesFromDB();
  }, []);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedCategory]);

  const fetchCategoriesFromDB = async () => {
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (data) {
      setDbCategories(data.map((c: any) => c.name));
    }
  };

  const fetchPortals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('portal_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) {
      toast.error('Gagal memuat portal: ' + error.message);
    } else {
      const mappedData = data.map((item: any) => ({
        ...item,
        clientOrType: item.client_or_type,
        customImage: item.custom_image
      }));
      setPortals(mappedData as PortalSite[]);
    }
    setLoading(false);
  };

  const portalCategories = portals.map(p => p.category);
  const allCategories = Array.from(new Set([...dbCategories, ...portalCategories]));
  const filterCategories = ['Semua', ...allCategories];

  const filteredPortals = portals.filter(portal => {
    const matchesSearch = portal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (portal.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || portal.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus portal ini?')) return;
    
    const portalToDel = portals.find(p => p.id === id);
    const { error } = await supabase.from('portal_items').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus: ' + error.message);
    } else {
      toast.success('Portal berhasil dihapus');
      setPortals(portals.filter(p => p.id !== id));
      
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && portalToDel) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          action: 'menghapus',
          target: `Portal ${portalToDel.title}`,
          type: 'error'
        });
      }
    }
  };

  const handleOpenModal = (portal?: PortalSite) => {
    if (portal) {
      setFormData({
        id: portal.id,
        title: portal.title,
        category: portal.category,
        url: portal.url,
        customIcon: portal.customImage || '',
        description: portal.description || ''
      });
    } else {
      setFormData({...defaultFormData, category: dbCategories[0] || ''});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
  };

  const handleFileUpload = async (file: File) => {
    const loadingToast = toast.loading('Mengunggah ikon...');
    const fileExt = file.name.split('.').pop();
    const fileName = `customIcon_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('portal_assets')
      .upload(`portals/${fileName}`, file);

    if (uploadError) {
      toast.error('Gagal mengunggah: ' + uploadError.message, { id: loadingToast });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portal_assets')
      .getPublicUrl(`portals/${fileName}`);

    setFormData(prev => ({ ...prev, customIcon: publicUrl }));
    toast.success('Ikon berhasil diunggah!', { id: loadingToast });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEdit = !!formData.id;
    const payload = {
      title: formData.title,
      category: formData.category,
      url: formData.url,
      custom_image: formData.customIcon,
      description: formData.description,
      client_or_type: 'Client'
    };
    
    const { data: userData } = await supabase.auth.getUser();

    if (isEdit) {
      const { error } = await supabase.from('portal_items').update(payload).eq('id', formData.id);
      if (error) {
        toast.error('Gagal memperbarui: ' + error.message);
      } else {
        toast.success('Portal berhasil diperbarui');
        if (userData.user) {
          await supabase.from('activity_logs').insert({
            user_id: userData.user.id,
            action: 'memperbarui',
            target: `Portal ${formData.title}`,
            type: 'info'
          });
        }
        fetchPortals();
        handleCloseModal();
      }
    } else {
      const { error } = await supabase.from('portal_items').insert(payload);
      if (error) {
        toast.error('Gagal menambahkan portal: ' + error.message);
      } else {
        toast.success('Portal berhasil ditambahkan');
        if (userData.user) {
          await supabase.from('activity_logs').insert({
            user_id: userData.user.id,
            action: 'membuat',
            target: `Portal ${formData.title}`,
            type: 'success'
          });
        }
        fetchPortals();
        handleCloseModal();
      }
    }
    setIsSubmitting(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex flex-col gap-6 mb-8">
        <AdminHeader 
          title="Kelola Portal" 
          subtitle="Kelola tautan portal dan integrasi layanan"
          action={
            hasPermission('portals', 'create') && (
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-[#1B3A6B] text-white px-5 py-2.5 rounded-lg font-medium tracking-wide shadow-[0_4px_14px_0_rgba(27,58,107,0.39)] hover:shadow-[0_6px_20px_rgba(27,58,107,0.23)] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-300"
              >
                <Plus weight="bold" />
                Tambah Portal
              </button>
            )
          }
        />

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari portal..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:border-[#1B3A6B] focus:ring-4 focus:ring-[#1B3A6B]/10 rounded-xl transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar hide-scrollbar">
            {filterCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#0B1E40] text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {portals.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plugs size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Belum Ada Portal</h3>
            <p className="text-slate-500 text-sm text-center mb-6">Anda belum menambahkan tautan portal apapun. Mulai dengan menambahkan integrasi pertama.</p>
            {hasPermission('portals', 'create') && (
              <button 
                onClick={() => handleOpenModal()}
                className="text-[#1B3A6B] font-medium hover:underline flex items-center gap-2"
              >
                <Plus weight="bold" /> Tambah Portal
              </button>
            )}
          </div>
        )}
        {filteredPortals.length === 0 && !loading && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[24px] border border-dashed border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256" className="mb-4 opacity-50"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
            <p className="text-lg font-medium text-slate-500">Tidak ada portal ditemukan</p>
            <p className="text-sm">Coba gunakan kata kunci atau kategori lain.</p>
          </div>
        )}

        {filteredPortals.slice(0, visibleCount).map((portal) => (
          <div 
            key={portal.id} 
            className={`group relative bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] border transition-all duration-300 flex flex-col cursor-pointer ${draggedPortalId === portal.id ? 'opacity-50 border-blue-500 scale-95' : 'border-slate-100/50 hover:-translate-y-1.5'}`}
            onClick={() => setViewPortal(portal)}
            draggable={selectedCategory === 'Semua' && searchQuery === '' && hasPermission('portals', 'update')}
            onDragStart={(e) => {
              if (selectedCategory !== 'Semua' || searchQuery !== '' || !hasPermission('portals', 'update')) return;
              setDraggedPortalId(portal.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (selectedCategory !== 'Semua' || searchQuery !== '') return;
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={async (e) => {
              e.preventDefault();
              if (selectedCategory !== 'Semua' || searchQuery !== '' || !hasPermission('portals', 'update')) return;
              if (!draggedPortalId || draggedPortalId === portal.id) return;
              
              const draggedIdx = portals.findIndex(p => p.id === draggedPortalId);
              const targetIdx = portals.findIndex(p => p.id === portal.id);
              if (draggedIdx === -1 || targetIdx === -1) return;
              
              const newPortals = [...portals];
              const [draggedItem] = newPortals.splice(draggedIdx, 1);
              newPortals.splice(targetIdx, 0, draggedItem);
              
              setPortals(newPortals);
              setDraggedPortalId(null);
              
              const loadingToast = toast.loading('Menyimpan urutan...');
              try {
                await Promise.all(
                  newPortals.map((p, idx) => 
                    supabase.from('portal_items').update({ sort_order: idx }).eq('id', p.id)
                  )
                );
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                  await supabase.from('activity_logs').insert({
                    user_id: userData.user.id,
                    action: 'mengurutkan ulang',
                    target: 'Daftar Portal',
                    type: 'info'
                  });
                }
                toast.success('Urutan berhasil disimpan', { id: loadingToast });
              } catch (err) {
                toast.error('Gagal menyimpan urutan', { id: loadingToast });
              }
            }}
            onDragEnd={() => setDraggedPortalId(null)}
          >
            {/* Top Image Area - Edge to Edge */}
            <div className="aspect-square w-full bg-slate-50 relative overflow-hidden flex items-center justify-center p-6">
              {portal.customImage ? (
                <img src={portal.customImage} alt={portal.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 group-hover:scale-105 transition-transform duration-700 rounded-xl">
                  <Plugs size={64} className="text-slate-300" weight="duotone" />
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-0 left-0 bg-[#1B3A6B] text-white px-3.5 py-1.5 rounded-br-2xl font-bold text-[11px] tracking-wide shadow-sm z-10">
                {portal.category}
              </div>

              {/* Hover Overlay & Actions */}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewPortal(portal); }}
                    className="w-12 h-12 flex items-center justify-center bg-white text-slate-700 hover:text-[#1B3A6B] rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                    title="Detail Portal"
                  >
                    <Info size={24} weight="bold" />
                  </button>
                  {hasPermission('portals', 'update') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(portal); }}
                      className="w-12 h-12 flex items-center justify-center bg-white text-slate-700 hover:text-[#1B3A6B] rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                      title="Edit Portal"
                    >
                      <PencilSimple size={24} weight="bold" />
                    </button>
                  )}
                  {hasPermission('portals', 'delete') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(portal.id); }}
                      className="w-12 h-12 flex items-center justify-center bg-white text-red-500 hover:text-red-600 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                      title="Delete Portal"
                    >
                      <Trash size={24} weight="bold" />
                    </button>
                  )}
                </div>
            </div>

            {/* Bottom Content Area - Clean and simple */}
            <div className="p-5 md:p-6 flex-1 flex flex-col bg-white z-10 relative">
              <h3 className="font-extrabold text-[#0B1E40] text-[17px] leading-snug group-hover:text-[#1B3A6B] transition-colors line-clamp-2">
                {portal.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredPortals.length && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="bg-white border border-slate-200 text-[#1B3A6B] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md hover:border-[#1B3A6B]/30 hover:bg-slate-50 active:scale-95 transition-all duration-300"
          >
            Muat Lebih Banyak ({filteredPortals.length - visibleCount} tersisa)
          </button>
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col relative transform transition-all border border-white/20 my-auto"
            style={{ animation: 'springBounce 0.3s ease-out' }}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{formData.id ? 'Edit Portal' : 'Tambah Portal Baru'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100">
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="portal-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Portal</label>
                    <Input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="contoh: HRIS System" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tautan URL</label>
                    <Input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://" />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                  <Select
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={dbCategories}
                    isCreatable={false}
                    placeholder="Pilih kategori dari daftar..."
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi</label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Deskripsi singkat tentang portal ini..." />
                </div>

                <div className="pt-2">
                  <label
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <p className="text-sm font-medium text-slate-700 mb-4">Ikon Portal</p>
                    {formData.customIcon ? (
                      <div className="flex flex-col items-center">
                        <img src={formData.customIcon} alt="Icon Preview" className="w-20 h-20 object-contain mb-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100" />
                        <span className="text-xs text-[#1B3A6B] font-medium bg-[#1B3A6B]/10 px-3 py-1 rounded-full">Ganti Gambar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                          <UploadSimple className="w-8 h-8 text-slate-400 group-hover:text-[#1B3A6B] transition-colors" />
                        </div>
                        <p className="text-sm text-slate-500 max-w-[200px]">Seret gambar ke sini atau klik untuk memilih file</p>
                        <p className="text-xs text-slate-400 mt-2">Maks. 2MB (PNG, JPG, SVG)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex gap-4 rounded-b-2xl">
              <button onClick={handleCloseModal} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-colors">
                Batal
              </button>
              <button form="portal-form" type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-[#1B3A6B] hover:bg-[#152e55] text-white font-semibold transition-colors disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Portal'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewPortal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setViewPortal(null)}></div>
          <div 
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative transform transition-all border border-white/20"
            style={{ animation: 'springBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            {/* Header Banner */}
            <div className="pt-14 pb-8 bg-gradient-to-b from-slate-100 to-white relative flex flex-col items-center justify-center w-full px-6">
              {/* Floating Close Button */}
              <button 
                onClick={() => setViewPortal(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors p-2.5 rounded-full hover:bg-slate-200/50 bg-white shadow-sm z-10"
              >
                <X size={20} weight="bold" />
              </button>

              {/* App Icon Container */}
              <div className="relative z-10 w-44 h-44 mb-8">
                {viewPortal.customImage ? (
                  <img src={viewPortal.customImage} alt={viewPortal.title} className="w-full h-full object-contain drop-shadow-2xl rounded-[32px]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white rounded-[32px] shadow-2xl border border-slate-100">
                    <Plugs size={72} className="text-slate-300" weight="duotone" />
                  </div>
                )}
              </div>
              
              {/* Badges directly under icon */}
              <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {viewPortal.category}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-8 pb-8 pt-2 relative z-10 text-center flex-1 flex flex-col">
              
              <h2 className="text-3xl font-extrabold text-[#0B1E40] tracking-tight mb-2">{viewPortal.title}</h2>
              
              <a href={viewPortal.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#1B3A6B] hover:underline mb-6 inline-block break-all">
                {viewPortal.url}
              </a>
              
              <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {viewPortal.description || "Belum ada deskripsi untuk portal ini."}
                </p>
              </div>

              <a 
                href={viewPortal.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 bg-[#1B3A6B] text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_20px_0_rgba(27,58,107,0.3)] hover:shadow-[0_12px_25px_rgba(27,58,107,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
              >
                Buka Portal <ArrowUpRight size={22} weight="bold" />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
