import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Activity, Database, BarChart2, ShieldCheck, Headset, Cctv, Menu, X } from 'lucide-react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { LogoIntroModal } from './ui/LogoIntroModal';
import { FadeIn } from './ui/FadeIn';
import { MarqueeItem } from '../data/portalData';
import { optimizeImage } from '../lib/imageUtils';
import { supabase } from '../lib/supabase';
import logoMkn from '../assets/images/logo_mkn.png';

const getIconForPortal = (index: number, className: string = "") => {
  const icons = [Settings, Activity, Database, BarChart2, ShieldCheck, Headset, Cctv];
  const Icon = icons[index % icons.length];
  return <Icon className={className} />;
};

interface HeroSectionProps {
  onOpenContact: () => void;
  onNavigate: (page: 'overview' | 'gallery' | 'projects') => void;
  onExpandPortals?: () => void;
}

// LIGHT THEME COLORS based on Synergy MKN Logo (Coral, Cyan, Deep Blue)
const CARD_THEMES = [
  { // Coral
    outerRing: 'ring-[#E85D44]/20',
    innerRing: 'bg-[#E85D44]/10 text-[#E85D44]',
    btnBg: 'bg-[#E85D44]/10',
    btnHover: 'group-hover:bg-[#E85D44] group-hover:text-white',
    btnText: 'text-[#E85D44]'
  },
  { // Cyan
    outerRing: 'ring-[#38BDF8]/20',
    innerRing: 'bg-[#38BDF8]/10 text-[#38BDF8]',
    btnBg: 'bg-[#38BDF8]/10',
    btnHover: 'group-hover:bg-[#38BDF8] group-hover:text-white',
    btnText: 'text-[#38BDF8]'
  },
  { // Deep Blue
    outerRing: 'ring-[#1E3A8A]/20',
    innerRing: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
    btnBg: 'bg-[#1E3A8A]/10',
    btnHover: 'group-hover:bg-[#1E3A8A] group-hover:text-white',
    btnText: 'text-[#1E3A8A]'
  },
  { // Soft Emerald
    outerRing: 'ring-emerald-500/20',
    innerRing: 'bg-emerald-500/10 text-emerald-600',
    btnBg: 'bg-emerald-500/10',
    btnHover: 'group-hover:bg-emerald-500 group-hover:text-white',
    btnText: 'text-emerald-600'
  },
  { // Purple
    outerRing: 'ring-purple-500/20',
    innerRing: 'bg-purple-500/10 text-purple-600',
    btnBg: 'bg-purple-500/10',
    btnHover: 'group-hover:bg-purple-500 group-hover:text-white',
    btnText: 'text-purple-600'
  },
];

const PortalAppItem = ({ portal, theme, themeIdx }: { key?: string | number, portal: MarqueeItem, theme: typeof CARD_THEMES[0], themeIdx: number, idx: number }) => {
  const displayTitle = portal.title.replace(' Portal', '');
  
  const handleClick = () => {
    supabase.rpc('increment_portal_click', { p_portal_id: portal.id }).then(() => {}).catch(() => {});
  };

  return (
    <a
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={displayTitle}
      className="group/card relative flex flex-col items-center text-center gap-1.5 p-2.5 rounded-2xl sm:flex-row sm:items-center sm:text-left sm:gap-4 sm:p-4 sm:rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:border-white/30 hover:-translate-y-1 transition-all duration-300 outline-none w-full h-full"
    >
      <div className={`w-12 h-12 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover/card:scale-105 ${!portal.customIcon ? 'bg-white shadow-sm p-1 border-2 border-white/90 overflow-hidden rounded-full' : ''}`}>
         {portal.customIcon ? (
           <img src={optimizeImage(portal.customIcon, 96)} alt={displayTitle} loading="lazy" className="w-full h-full object-contain rounded-xl" />
         ) : (
           <div className={`w-full h-full ${theme.innerRing} flex items-center justify-center rounded-full text-[10px] sm:text-xs font-black`}>
             {getIconForPortal(themeIdx, `w-5 h-5 md:w-6 md:h-6`)}
           </div>
         )}
      </div>
      <div className="flex flex-col relative z-10 sm:flex-grow sm:pr-4 w-full justify-center min-w-0">
         <h3 className="text-[10px] leading-tight min-h-[2.4em] sm:min-h-0 sm:text-[13px] md:text-[15px] font-bold text-white sm:leading-snug drop-shadow-sm line-clamp-2">{displayTitle}</h3>
      </div>
    </a>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenContact, onExpandPortals }) => {
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bgImageIdx, setBgImageIdx] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [siteSettings, setSiteSettings] = useState({
    portal_name: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    logo_url: ''
  });
  const [portals, setPortals] = useState<MarqueeItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const [settingsRes, slidersRes, portalsRes] = await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 1).single(),
        supabase.from('hero_sliders').select('image_url').order('display_order', { ascending: true }),
        supabase.from('portal_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
      ]);

      if (settingsRes.data) {
        setSiteSettings(prev => ({
          ...prev,
          portal_name: settingsRes.data.portal_name || prev.portal_name,
          hero_title: settingsRes.data.hero_title || prev.hero_title,
          hero_subtitle: settingsRes.data.hero_subtitle || prev.hero_subtitle,
          hero_image_url: settingsRes.data.hero_image_url || '',
          logo_url: settingsRes.data.logo_url || ''
        }));
      }

      if (slidersRes.data && slidersRes.data.length > 0) {
        setHeroImages(slidersRes.data.map(item => item.image_url));
      } else {
        setHeroImages([]);
      }

      if (portalsRes.data && portalsRes.data.length > 0) {
        const mappedPortals = portalsRes.data.map((item: any) => ({
          ...item,
          clientOrType: item.client_or_type,
          customImage: item.custom_image,
          customIcon: item.custom_image
        }));
        setPortals(mappedPortals as MarqueeItem[]);
      }
      
      setIsLoading(false);
    };

    fetchSettings();

    const portalsSubscription = supabase
      .channel('public:portal_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_items' }, () => {
        fetchSettings();
      })
      .subscribe();

    const slidersSubscription = supabase
      .channel('public:hero_sliders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_sliders' }, () => {
        fetchSettings();
      })
      .subscribe();

    const settingsSubscription = supabase
      .channel('public:site_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(portalsSubscription);
      supabase.removeChannel(slidersSubscription);
      supabase.removeChannel(settingsSubscription);
    };
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setBgImageIdx((prev) => (prev + 1) % heroImages.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroImages]);

  useEffect(() => {
    if (heroImages.length === 0) return;
    heroImages.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [heroImages]);

  const filteredPortals = useMemo(() => {
    if (!searchQuery.trim()) return portals;
    const lowerQuery = searchQuery.toLowerCase();
    return portals.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
      (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
      (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }, [searchQuery, portals]);

  const [colWidth, setColWidth] = useState(0);
  const [visibleCols, setVisibleCols] = useState(4);
  const [gapSize, setGapSize] = useState(20);

  useEffect(() => {
    const measure = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const isMobile = window.innerWidth < 640;
        const gap = isMobile ? 8 : 20;
        const cols = 4;
        setGapSize(gap);
        setVisibleCols(cols);
        const w = (containerWidth - (cols - 1) * gap) / cols;
        setColWidth(w);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [filteredPortals.length]);

  const scrollLeft = () => {
    if (scrollContainerRef.current && colWidth > 0) {
      const scrollAmount = visibleCols * colWidth + (visibleCols - 1) * gapSize;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current && colWidth > 0) {
      const scrollAmount = visibleCols * colWidth + (visibleCols - 1) * gapSize;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div id="home" className="relative bg-[#F8FAFC] min-h-screen text-slate-900 font-sans selection:bg-[#3B82F6] selection:text-white flex flex-col overflow-hidden">
      
      {/* SVG Filter for Logo */}
      <svg width="0" height="0" className="absolute pointer-events-none" style={{ visibility: 'hidden' }}>
        <filter id="mkn-logo-filter" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            0.999 -2.017 -1.000 0 1
           -0.001 -1.017 -1.000 0 1
           -1.367  1.069 -1.000 0 1
            0      0      0     1 0
          " />
        </filter>
      </svg>

      {/* Background Image Slider */}
      {heroImages.map((img, idx) => (
        <div 
          key={img + idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out ${idx === bgImageIdx ? 'opacity-100' : 'opacity-0'} pointer-events-none`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      {/* Seamless transition into the Dark Stats Section */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2B3F56] via-transparent to-transparent pointer-events-none" />

      {/* Top Scrim (Dark) to ensure white text is always readable */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${isScrolled || isMobileNavOpen ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/60' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
          
          {/* Logo Container */}
          <div 
            className={`flex items-center cursor-pointer group transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onClick={() => setIsIntroOpen(true)}
          >
            <div className="w-auto h-14 md:h-20 flex items-center justify-center p-1 group-hover:scale-105 transition-transform overflow-hidden">
              <img 
                src={siteSettings.logo_url || logoMkn} 
                alt={siteSettings.portal_name || 'MKN Logo'} 
                className="max-h-full object-contain transition-all duration-300" 
                style={!isScrolled && !isMobileNavOpen ? { filter: 'url(#mkn-logo-filter) drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' } : {}}
              />
            </div>
          </div>

          {/* Desktop Navigation Container */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className={`relative text-[13px] font-bold uppercase tracking-wider transition-all duration-300 py-2 group cursor-pointer ${isScrolled ? 'text-slate-600 hover:text-[#233B8E]' : 'text-white/90 hover:text-white'}`}
            >
              Beranda
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full group-hover:w-full transition-all duration-300 ease-out ${isScrolled ? 'bg-[#233B8E]' : 'bg-white'}`} />
            </button>
            <button 
              onClick={onExpandPortals} 
              className={`relative text-[13px] font-bold uppercase tracking-wider transition-all duration-300 py-2 group cursor-pointer ${isScrolled ? 'text-[#E05A44] hover:text-[#c44935]' : 'text-white/90 hover:text-white'}`}
            >
              Eksplorasi Portal
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full group-hover:w-full transition-all duration-300 ease-out ${isScrolled ? 'bg-[#E05A44]' : 'bg-white'}`} />
            </button>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Menu Navigasi"
            className={`md:hidden p-2.5 rounded-xl transition-colors ${
              isScrolled || isMobileNavOpen
                ? 'text-slate-800 hover:bg-slate-100'
                : 'text-white bg-white/10 hover:bg-white/20 backdrop-blur-md'
            }`}
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-2 shadow-lg">
            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
            >
              Beranda
            </button>
            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                onExpandPortals?.();
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-bold uppercase tracking-wider text-[#E05A44] hover:bg-rose-50"
            >
              Eksplorasi Portal
            </button>
            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                onOpenContact();
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-bold uppercase tracking-wider text-[#1B3A6B] hover:bg-blue-50"
            >
              Bantuan & Kontak
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto px-6 pt-32 pb-24">
        <div className="w-full flex flex-col items-center justify-center min-h-[50vh] mt-[-40px]">
          
          {/* Main Content */}
          <div className={`w-full max-w-4xl mx-auto flex flex-col items-center text-center relative z-10 px-4 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
            <FadeIn y={30} duration={0.8} className="w-full mb-8">
              
              <h1 className="text-5xl md:text-7xl lg:text-7xl font-black tracking-tight mb-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 leading-[1.2]">
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#E05A44] via-[#2BA5D4] to-[#233B8E] pb-2 drop-shadow-xl"
                  style={{ 
                    WebkitTextStroke: '2px white'
                  }}
                >
                  {siteSettings.hero_title}
                </span>
              </h1>
              
              <p 
                className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow-md"
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}
              >
                {siteSettings.hero_subtitle}
              </p>
            </FadeIn>

            {/* Search Bar */}
            <FadeIn y={30} delay={0.2} duration={0.8} className="w-full max-w-2xl mx-auto px-4 mt-2 mb-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                  <MagnifyingGlass weight="bold" className="h-5 w-5 text-white/60 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari aplikasi, kategori, atau layanan..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-4 pl-16 pr-6 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all shadow-lg text-base font-medium"
                />
              </div>
            </FadeIn>
          </div>

          {/* Carousel Section */}
          <FadeIn y={40} delay={0.3} duration={1} className="w-full relative">
            {isLoading ? (
              <div className="h-[200px] w-full max-w-6xl mx-auto" />
            ) : filteredPortals.length > 0 ? (
              <div className="w-full relative flex justify-center px-4">
                <div className="w-full max-w-[1350px] mx-auto flex items-center gap-4 md:gap-6 px-4 group">
                  {/* Panah Kiri */}
                  <button 
                    onClick={scrollLeft} 
                    className="shrink-0 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-md p-3 md:p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[3]" />
                  </button>

                  {/* Slider Container */}
                  <div 
                    ref={scrollContainerRef} 
                    className="flex-1 flex gap-2 sm:gap-5 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-4 sm:py-6"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {Array.from({ length: Math.ceil(filteredPortals.length / 2) }).map((_, colIdx) => {
                      const colItems = filteredPortals.slice(colIdx * 2, colIdx * 2 + 2);
                      return (
                        <div 
                          key={colIdx} 
                          className="shrink-0 snap-start flex flex-col gap-2 sm:gap-5"
                          style={colWidth > 0 ? { width: `${colWidth}px` } : { width: '85%' }}
                        >
                          {colItems.map((portal, idx) => {
                            const globalIdx = colIdx * 2 + idx;
                            const themeIdx = portals.findIndex(p => p.id === portal.id) % CARD_THEMES.length;
                            const theme = CARD_THEMES[themeIdx >= 0 ? themeIdx : 0];
                            return (
                              <div key={`${portal.id}-${globalIdx}`} className="w-full">
                                <PortalAppItem portal={portal} theme={theme} themeIdx={themeIdx} idx={globalIdx} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Panah Kanan */}
                  <button 
                    onClick={scrollRight} 
                    className="shrink-0 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-md p-3 md:p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm w-full max-w-2xl mx-auto px-6 mt-4">
                <p className="text-slate-600 text-lg font-medium">Tidak ada aplikasi yang sesuai dengan "{searchQuery}"</p>
              </div>
            )}
          </FadeIn>

          {/* Lihat Semua Portal Button */}
          <FadeIn y={20} delay={0.5} duration={1}>
            <button 
              onClick={onExpandPortals}
              className="mt-2 px-8 py-3.5 rounded-full border border-white/20 bg-white/10 hover:bg-[#E05A44] hover:border-[#E05A44] active:bg-[#E85D44] active:scale-95 text-white font-bold text-[14px] tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(224,90,68,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group mx-auto cursor-pointer sm:backdrop-blur-md"
            >
              Lihat Semua Portal 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 stroke-[3]" />
            </button>
          </FadeIn>

        </div>
      </main>

      <LogoIntroModal isOpen={isIntroOpen} onClose={() => setIsIntroOpen(false)} />
      
      {/* Hide Webkit Scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};