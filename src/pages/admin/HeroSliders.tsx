import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { Image as ImageIcon, UploadSimple, Trash, ArrowUp, ArrowDown, WarningCircle } from '@phosphor-icons/react';

interface SliderItem {
  id: string;
  image_url: string;
  display_order: number;
}

export default function HeroSliders() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('sliders', 'create');
  const canUpdate = hasPermission('sliders', 'update');
  const canDelete = hasPermission('sliders', 'delete');

  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [initialSliders, setInitialSliders] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_sliders')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setSliders(data || []);
      setInitialSliders(JSON.parse(JSON.stringify(data || [])));
      setIsDirty(false);
    } catch (err: any) {
      toast.error('Gagal memuat data slider');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!canCreate) {
      toast.error('Anda tidak memiliki izin untuk menambah slider');
      return;
    }
    const uploadToast = toast.loading(`Mengunggah ${files.length} gambar...`);
    const newSliders = [...sliders];
    let uploadCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const fileExt = file.name.split('.').pop();
      const fileName = `slider_${Date.now()}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portal_assets')
        .upload(`sliders/${fileName}`, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('portal_assets')
          .getPublicUrl(`sliders/${fileName}`);
        
        newSliders.push({
          id: `new_${Date.now()}_${i}`,
          image_url: publicUrl,
          display_order: newSliders.length
        });
        uploadCount++;
      }
    }

    if (uploadCount > 0) {
      setSliders(newSliders);
      setIsDirty(true);
      toast.success(`${uploadCount} gambar berhasil diunggah`, { id: uploadToast });
    } else {
      toast.error('Gagal mengunggah gambar', { id: uploadToast });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canCreate) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const moveSlider = (index: number, direction: 'up' | 'down') => {
    if (!canUpdate) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sliders.length - 1) return;

    const newSliders = [...sliders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newSliders[index];
    newSliders[index] = newSliders[targetIndex];
    newSliders[targetIndex] = temp;

    newSliders.forEach((s, i) => s.display_order = i);

    setSliders(newSliders);
    setIsDirty(true);
  };

  const removeSlider = (index: number) => {
    if (!canDelete && !sliders[index].id.startsWith('new_')) {
      toast.error('Anda tidak memiliki izin untuk menghapus slider');
      return;
    }
    const newSliders = sliders.filter((_, i) => i !== index);
    newSliders.forEach((s, i) => s.display_order = i);
    setSliders(newSliders);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const saveToast = toast.loading('Menyimpan perubahan slider...');
    try {
      // 1. Identify deleted existing rows
      const currentIds = new Set(sliders.filter(s => !s.id.startsWith('new_')).map(s => s.id));
      const removedIds = initialSliders.filter(s => !currentIds.has(s.id)).map(s => s.id);

      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('hero_sliders')
          .delete()
          .in('id', removedIds);
        if (deleteError) throw deleteError;
      }

      // 2. Update existing rows' display_order
      const existingToUpdate = sliders
        .map((s, idx) => ({ ...s, display_order: idx }))
        .filter(s => !s.id.startsWith('new_'));

      for (const item of existingToUpdate) {
        const { error: updateError } = await supabase
          .from('hero_sliders')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (updateError) throw updateError;
      }

      // 3. Insert newly uploaded sliders
      const newToInsert = sliders
        .map((s, idx) => ({ image_url: s.image_url, display_order: idx, isNew: s.id.startsWith('new_') }))
        .filter(s => s.isNew)
        .map(({ image_url, display_order }) => ({ image_url, display_order }));

      if (newToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('hero_sliders')
          .insert(newToInsert);
        if (insertError) throw insertError;
      }

      // 4. Log activity
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          action: 'memperbarui',
          target: 'Slider Beranda',
          details: `Total ${sliders.length} gambar slider aktif`,
          type: 'success'
        });
      }

      toast.success('Slider berhasil disimpan!', { id: saveToast });
      setIsDirty(false);
      fetchSliders();
    } catch (err: any) {
      toast.error('Gagal menyimpan slider: ' + err.message, { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Memuat...</div>;

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      
      {/* Header */}
      <AdminHeader 
        title="Slider Beranda" 
        subtitle="Kelola gambar latar belakang slider di Halaman Utama"
        action={
          (canCreate || canUpdate || canDelete) ? (
            <>
              {isDirty && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold border border-amber-200 mr-2">
                  <WarningCircle className="w-4 h-4" weight="fill" />
                  Perubahan belum disimpan
                </div>
              )}
              <button 
                onClick={() => {
                  setSliders(JSON.parse(JSON.stringify(initialSliders)));
                  setIsDirty(false);
                }}
                disabled={!isDirty || saving}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isDirty && !saving
                    ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'
                    : 'text-slate-400 bg-transparent border border-transparent'
                }`}
              >
                Batalkan
              </button>
              <button 
                onClick={handleSave}
                disabled={!isDirty || saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                  isDirty && !saving
                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5' 
                    : 'bg-slate-400 text-white/90 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </>
          ) : undefined
        }
      />

      <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <ImageIcon className="w-6 h-6 text-slate-700" weight="duotone" />
          <h2 className="text-lg font-bold text-slate-900">Kelola Gambar Slider</h2>
        </div>

        {/* Upload Zone */}
        {canCreate && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative w-full h-40 mb-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
              }}
            />
            <div className="flex flex-col items-center text-slate-500 gap-3">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadSimple size={24} className="text-blue-500" weight="bold" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 mb-1">Klik atau seret file ke sini</p>
                <p className="text-[11px] font-medium text-slate-400">Mendukung upload banyak file sekaligus (JPG/PNG)</p>
              </div>
            </div>
          </div>
        )}

        {/* Sliders List */}
        <div className="space-y-4">
          {sliders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" weight="duotone" />
              <h3 className="text-sm font-bold text-slate-700 mb-1">Belum ada slider</h3>
              <p className="text-xs text-slate-500">Unggah gambar di atas untuk menambahkan slider beranda.</p>
            </div>
          ) : (
            sliders.map((slider, index) => (
              <div key={slider.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-sm">
                
                {/* Image Preview */}
                <div className="w-full md:w-48 h-28 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  <img src={slider.image_url} alt="Slider" className="w-full h-full object-cover" />
                </div>
                
                {/* Info */}
                <div className="flex-1 w-full text-center md:text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Slider #{index + 1}</p>
                  <p className="text-sm font-medium text-slate-700 truncate max-w-sm" title={slider.image_url}>
                    {slider.image_url.split('/').pop()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                  {canUpdate && (
                    <>
                      <button 
                        onClick={() => moveSlider(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="Naikkan urutan"
                      >
                        <ArrowUp size={20} weight="bold" />
                      </button>
                      <button 
                        onClick={() => moveSlider(index, 'down')}
                        disabled={index === sliders.length - 1}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                        title="Turunkan urutan"
                      >
                        <ArrowDown size={20} weight="bold" />
                      </button>
                    </>
                  )}
                  {(canDelete || slider.id.startsWith('new_')) && (
                    <>
                      <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                      <button 
                        onClick={() => removeSlider(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus gambar"
                      >
                        <Trash size={20} weight="bold" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
