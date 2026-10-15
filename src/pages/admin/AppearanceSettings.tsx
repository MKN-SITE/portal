import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AdminHeader } from '../../components/ui/AdminHeader';
import { 
  Buildings, 
  ShareNetwork, 
  WarningCircle, 
  EnvelopeSimple, 
  Phone,
  Image as ImageIcon,
  TextAlignLeft,
  InstagramLogo,
  TiktokLogo,
  FacebookLogo,
  TwitterLogo,
  LinkedinLogo,
  TextAa,
  UploadSimple
} from '@phosphor-icons/react';

export default function AppearanceSettings() {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('appearance', 'update');

  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const defaultSettings = { 
          company_name: 'PT. Multi Kontrol Nusantara',
          portal_name: 'MKN Portal',
          company_website: 'www.mkncorp.com',
          contact_phone: '0549-2026162',
          contact_email: 'contact@mkncorp.com',
          company_address: 'KPC Communication Building\nTango Delta D8, Sangatta',
          hero_title: 'Sinergi Terintegrasi',
          hero_subtitle: 'Satu portal untuk semua sistem. Pilih layanan yang ingin Anda akses.',
        };
        setSettings(defaultSettings);
        setInitialSettings(defaultSettings);
      } else {
        setSettings(data);
        setInitialSettings(data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat pengaturan identitas website');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki izin untuk mengubah pengaturan ini');
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').maybeSingle();
      
      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert([{ ...settings, id: 1 }]);
        error = insertError;
      }

      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('activity_logs').insert({
          user_id: userData.user.id,
          action: 'memperbarui',
          target: 'Pengaturan Identitas Website',
          type: 'success'
        });
      }

      toast.success('Pengaturan berhasil disimpan!');
      setInitialSettings(settings);
      setIsDirty(false);
    } catch (err: any) {
      toast.error('Gagal menyimpan pengaturan: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (!canUpdate) return;
    setSettings((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleFileUpload = async (file: File, field: 'logo_url' | 'favicon_url') => {
    if (!canUpdate) {
      toast.error('Anda tidak memiliki izin untuk mengunggah gambar');
      return;
    }
    const loadingToast = toast.loading('Mengunggah gambar...');
    const fileExt = file.name.split('.').pop();
    const fileName = `${field}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('portal_assets')
      .upload(`brand/${fileName}`, file, { upsert: true });

    if (uploadError) {
      toast.error('Gagal mengunggah: ' + uploadError.message, { id: loadingToast });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portal_assets')
      .getPublicUrl(`brand/${fileName}`);

    handleChange(field, publicUrl);
    toast.success('Gambar berhasil diunggah', { id: loadingToast });
  };

  const ImageUploadZone = ({ field, label, hint, value }: { field: 'logo_url' | 'favicon_url', label: string, hint?: string, value: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!canUpdate) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0], field);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          {value && canUpdate && (
            <button
              type="button"
              onClick={() => handleChange(field, '')}
              className="text-[11px] font-semibold text-red-500 hover:underline"
            >
              Reset ke Default
            </button>
          )}
        </div>
        <div 
          onClick={() => canUpdate && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (canUpdate) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group overflow-hidden ${
            !canUpdate ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50' : isDragging ? 'border-blue-500 bg-blue-50 cursor-pointer' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            disabled={!canUpdate}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0], field);
              }
            }}
          />
          {value ? (
            <div className="w-full h-full p-4 flex items-center justify-center relative">
              <img src={value} alt={label} className="max-w-full max-h-full object-contain drop-shadow-sm" />
              {canUpdate && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-md">Ubah Gambar</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500 gap-2">
              <UploadSimple size={28} className="text-slate-400 group-hover:text-blue-500 transition-colors" weight="duotone" />
              <span className="text-[11px] font-medium px-4 text-center">{hint || 'Klik atau seret file gambar (PNG/SVG/ICO) ke sini'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-slate-500">Memuat...</div>;

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      
      {/* Header */}
      <AdminHeader 
        title="Identitas Website" 
        subtitle="Kelola informasi dasar dan identitas visual portal Anda"
        action={
          canUpdate ? (
            <>
              {isDirty && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold border border-amber-200 mr-2">
                  <WarningCircle className="w-4 h-4" weight="fill" />
                  Perubahan belum disimpan
                </div>
              )}
              <button 
                onClick={() => {
                  setSettings(initialSettings);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Teks Beranda & Perusahaan */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <TextAa className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Teks Beranda & Perusahaan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Teks Judul Utama (Hero Title) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  disabled={!canUpdate}
                  value={settings.hero_title || ''} 
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Teks Sub-Judul (Hero Subtitle)</label>
                <textarea 
                  rows={2}
                  disabled={!canUpdate}
                  value={settings.hero_subtitle || ''} 
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors resize-y disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Teks Eksplorasi Portal */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <TextAa className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Pengaturan Menu Eksplorasi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Teks Judul Utama (Eksplorasi Title)</label>
                <textarea 
                  rows={2}
                  disabled={!canUpdate}
                  value={settings.explore_title || ''} 
                  onChange={(e) => handleChange('explore_title', e.target.value)}
                  placeholder="Makin produktif dengan berbagai *aplikasi digital*"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors resize-y disabled:bg-slate-50 disabled:text-slate-500"
                />
                <p className="text-[11px] font-medium text-slate-400">Gunakan tanda bintang untuk memberi warna oranye-merah. Contoh: Pusat Layanan *Terintegrasi*</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Teks Sub-Judul (Eksplorasi Subtitle)</label>
                <textarea 
                  rows={2}
                  disabled={!canUpdate}
                  value={settings.explore_subtitle || ''} 
                  onChange={(e) => handleChange('explore_subtitle', e.target.value)}
                  placeholder="Lengkapi dan lindungi semua aktivitas digital dengan layanan tambahan terbaik."
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors resize-y disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Gambar Karakter (Kiri)</label>
                <div 
                  onClick={() => {
                    if (!canUpdate) return;
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const loadingToast = toast.loading('Mengunggah gambar eksplorasi...');
                        const file = e.target.files[0];
                        const fileExt = file.name.split('.').pop();
                        const fileName = `explore_${Date.now()}.${fileExt}`;
                        supabase.storage
                          .from('portal_assets')
                          .upload(`hero/${fileName}`, file, { upsert: true })
                          .then(({ error }) => {
                            if (error) {
                              toast.error('Gagal mengunggah: ' + error.message, { id: loadingToast });
                            } else {
                              const { data } = supabase.storage.from('portal_assets').getPublicUrl(`hero/${fileName}`);
                              handleChange('explore_image_url', data.publicUrl);
                              toast.success('Gambar berhasil diunggah', { id: loadingToast });
                            }
                          });
                      }
                    };
                    input.click();
                  }}
                  className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group overflow-hidden border-slate-300 bg-slate-50 ${
                    canUpdate ? 'hover:bg-slate-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {settings.explore_image_url ? (
                    <div className="w-full h-full p-4 flex items-center justify-center relative">
                      <img src={settings.explore_image_url} alt="Explore Image" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                      {canUpdate && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-md">Ubah Gambar</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 gap-2">
                      <UploadSimple size={28} className="text-slate-400 group-hover:text-blue-500 transition-colors" weight="duotone" />
                      <span className="text-[11px] font-medium px-4 text-center">Klik untuk mengunggah gambar karakter PNG/WebP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banner Statistik */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <ImageIcon className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Pengaturan Banner Statistik</h2>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Gambar Latar Belakang (Background)</label>
              <div 
                onClick={() => {
                  if (!canUpdate) return;
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const loadingToast = toast.loading('Mengunggah gambar latar...');
                      const file = e.target.files[0];
                      const fileExt = file.name.split('.').pop();
                      const fileName = `stats_bg_${Date.now()}.${fileExt}`;
                      supabase.storage
                        .from('portal_assets')
                        .upload(`hero/${fileName}`, file, { upsert: true })
                        .then(({ error }) => {
                          if (error) {
                            toast.error('Gagal mengunggah: ' + error.message, { id: loadingToast });
                          } else {
                            const { data } = supabase.storage.from('portal_assets').getPublicUrl(`hero/${fileName}`);
                            handleChange('stats_bg_image', data.publicUrl);
                            toast.success('Gambar latar berhasil diunggah', { id: loadingToast });
                          }
                        });
                    }
                  };
                  input.click();
                }}
                className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all group overflow-hidden border-slate-300 bg-slate-50 ${
                  canUpdate ? 'hover:bg-slate-100 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {settings.stats_bg_image ? (
                  <div className="w-full h-full p-0 flex items-center justify-center relative">
                    <img src={settings.stats_bg_image} alt="Stats Background" className="w-full h-full object-cover" />
                    {canUpdate && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-md">Ubah Gambar</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500 gap-2">
                    <UploadSimple size={28} className="text-slate-400 group-hover:text-blue-500 transition-colors" weight="duotone" />
                    <span className="text-[11px] font-medium px-4 text-center">Klik untuk mengunggah gambar latar (JPG/PNG) disarankan ukuran lebar</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <Buildings className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Informasi Perusahaan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Perusahaan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  disabled={!canUpdate}
                  value={settings.company_name || ''} 
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Singkat Portal (Judul Tab Browser)</label>
                <input 
                  type="text" 
                  disabled={!canUpdate}
                  value={settings.portal_name || ''} 
                  onChange={(e) => handleChange('portal_name', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                />
                <p className="text-[11px] font-medium text-slate-400">Digunakan sebagai judul pada tab browser halaman publik.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL Website Resmi</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-sm font-medium">
                    https://
                  </span>
                  <input 
                    type="text" 
                    disabled={!canUpdate}
                    value={settings.company_website || ''} 
                    onChange={(e) => handleChange('company_website', e.target.value)}
                    placeholder="www.mkncorp.com"
                    className="flex-1 bg-white border border-slate-300 rounded-r-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Telepon / WhatsApp</label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    disabled={!canUpdate}
                    value={settings.contact_phone || ''} 
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Email Kontak Resmi</label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <EnvelopeSimple className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    disabled={!canUpdate}
                    value={settings.contact_email || ''} 
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tautan Media Sosial */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <ShareNetwork className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Tautan Media Sosial</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'facebook', label: 'facebook.com/', icon: <FacebookLogo weight="fill" className="w-6 h-6" />, bg: 'bg-[#1877F2]/10', color: 'text-[#1877F2]' },
                { id: 'twitter', label: 'x.com/', icon: <TwitterLogo weight="fill" className="w-6 h-6" />, bg: 'bg-slate-100', color: 'text-slate-900' },
                { id: 'linkedin', label: 'linkedin.com/in/', icon: <LinkedinLogo weight="fill" className="w-6 h-6" />, bg: 'bg-[#0A66C2]/10', color: 'text-[#0A66C2]' },
                { id: 'instagram', label: 'instagram.com/', icon: <InstagramLogo weight="fill" className="w-6 h-6" />, bg: 'bg-[#E4405F]/10', color: 'text-[#E4405F]' },
                { id: 'tiktok', label: 'tiktok.com/@', icon: <TiktokLogo weight="fill" className="w-6 h-6" />, bg: 'bg-slate-100', color: 'text-slate-900' },
              ].map((social) => (
                <div key={social.id} className="flex gap-4">
                  <div className={`w-11 h-11 rounded-full ${social.bg} ${social.color} flex items-center justify-center shrink-0 shadow-sm`}>
                    {social.icon}
                  </div>
                  <div className="flex flex-1 group">
                    <span className="hidden sm:inline-flex items-center px-4 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-sm font-medium min-w-[145px] transition-colors group-focus-within:border-blue-500">
                      {social.label}
                    </span>
                    <input 
                      type="text" 
                      disabled={!canUpdate}
                      value={settings[`${social.id}_url`] || ''} 
                      onChange={(e) => handleChange(`${social.id}_url`, e.target.value)}
                      placeholder="username atau URL lengkap"
                      className="flex-1 bg-white border border-slate-300 rounded-lg sm:rounded-l-none sm:rounded-r-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column - Logo & Footer Info (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Logo & Visual */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <ImageIcon className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Visual, Logo & Favicon</h2>
            </div>
            
            <div className="space-y-6">
              <ImageUploadZone
                field="logo_url"
                label="Logo Website (Opsional)"
                hint="Klik atau seret logo utama (PNG/SVG transparan)"
                value={settings.logo_url}
              />
              <ImageUploadZone
                field="favicon_url"
                label="Favicon Tab Browser (Opsional)"
                hint="Klik atau seret ikon persegi 32x32 / 64x64 (PNG/ICO/SVG)"
                value={settings.favicon_url}
              />
            </div>
          </div>

          {/* Pengaturan Footer */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <TextAlignLeft className="w-6 h-6 text-slate-700" weight="duotone" />
              <h2 className="text-lg font-bold text-slate-900">Deskripsi Footer</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Alamat Perusahaan</label>
                <textarea 
                  rows={4}
                  disabled={!canUpdate}
                  value={settings.company_address || ''} 
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  placeholder="Alamat lengkap..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors resize-y disabled:opacity-60"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
