import React, { useState, Suspense, lazy, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { PortalSite } from '../types';
import { supabase } from '../lib/supabase';

// Below-fold components — lazy loaded to reduce initial bundle
const StatsSection = lazy(() => import('../components/StatsSection').then(m => ({ default: m.StatsSection })));
const PortalsShowcaseSection = lazy(() => import('../components/PortalsShowcaseSection').then(m => ({ default: m.PortalsShowcaseSection })));
const FooterSection = lazy(() => import('../components/FooterSection').then(m => ({ default: m.FooterSection })));
const SitePreviewModal = lazy(() => import('../components/ui/SitePreviewModal').then(m => ({ default: m.SitePreviewModal })));
const ContactModal = lazy(() => import('../components/ui/ContactModal').then(m => ({ default: m.ContactModal })));

export default function PublicPortal() {
  const [selectedSite, setSelectedSite] = useState<PortalSite | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPortalsExpanded, setIsPortalsExpanded] = useState(false);
  const [isPortalsClosing, setIsPortalsClosing] = useState(false);

  useEffect(() => {
    // Increment visitor count when public portal mounts (once per session)
    const incrementVisitor = async () => {
      try {
        if (!sessionStorage.getItem('has_visited_portal')) {
          await supabase.rpc('increment_visitor_count');
          sessionStorage.setItem('has_visited_portal', 'true');
        }
      } catch (e) {
        console.error('Failed to increment visitor count:', e);
      }
    };
    incrementVisitor();

    // Sync document title and favicon dynamically from site_settings
    const applyHeadMetadata = (data: any) => {
      if (!data) return;
      const titleParts = [data.portal_name?.trim(), data.company_name?.trim()].filter(Boolean);
      if (titleParts.length > 0) {
        document.title = titleParts.join(' — ');
      }
      if (data.favicon_url) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.favicon_url;
      }
    };

    supabase
      .from('site_settings')
      .select('portal_name, company_name, favicon_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => applyHeadMetadata(data));

    const headSub = supabase
      .channel('public:site_settings_head')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        applyHeadMetadata(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(headSub);
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExpandPortals = () => {
    setIsPortalsExpanded(true);
    setIsPortalsClosing(false);
    document.body.style.overflow = 'hidden';
  };

  const handleClosePortals = () => {
    setIsPortalsClosing(true);
    document.body.style.overflow = 'auto';
    setTimeout(() => {
      setIsPortalsExpanded(false);
      setIsPortalsClosing(false);
    }, 600);
  };

  return (
    <div className="bg-[#F7F8FA] min-h-screen text-[#1A202C] font-sans overflow-x-clip selection:bg-[#1B3A6B] selection:text-white">
      {/* 1. Hero Section with Sticky Header — eagerly loaded (above fold) */}
      <HeroSection
        onOpenContact={() => setIsContactOpen(true)}
        onNavigate={handleNavigate}
        onExpandPortals={handleExpandPortals}
      />

      {/* Portals Showcase (Expandable) — lazy */}
      <Suspense fallback={null}>
        {isPortalsExpanded && <PortalsShowcaseSection onClose={handleClosePortals} isClosing={isPortalsClosing} />}
      </Suspense>

      {/* 2. Stats Section — lazy */}
      <Suspense fallback={<div className="h-32 bg-[#2B3F56]" />}>
        <StatsSection />
      </Suspense>

      {/* Footer — lazy */}
      <Suspense fallback={null}>
        <FooterSection
          onOpenContact={() => setIsContactOpen(true)}
          onNavigate={handleNavigate}
        />
      </Suspense>

      {/* Modals — lazy */}
      <Suspense fallback={null}>
        <SitePreviewModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />
      </Suspense>
    </div>
  );
}
