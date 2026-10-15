import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  SquaresFour, 
  FolderOpen, 
  Folders, 
  Users, 
  CaretRight,
  Palette,
  ImageSquare,
  ShieldCheck,
  Clock,
  List,
  Globe,
  ArrowUpRight,
  X
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/images/logo_mkn.png';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, session, canAccessPage } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil keluar');
    navigate('/admin/login');
  };

  // All possible nav items — filtered by permission
  const allNavItems = [
    { name: 'Ringkasan', path: '/admin', icon: SquaresFour, page: 'dashboard', group: 'UMUM' },
    { name: 'Kelola Portal', path: '/admin/portals', icon: FolderOpen, page: 'portals', group: 'PORTAL & LAYANAN' },
    { name: 'Kategori Layanan', path: '/admin/categories', icon: Folders, page: 'categories', group: 'PORTAL & LAYANAN' },
    { name: 'Identitas Website', path: '/admin/appearance', icon: Palette, page: 'appearance', group: 'PENGATURAN' },
    { name: 'Slider Beranda', path: '/admin/sliders', icon: ImageSquare, page: 'sliders', group: 'PENGATURAN' },
    { name: 'Pengguna Admin', path: '/admin/users', icon: Users, page: 'users', group: 'PENGATURAN' },
    { name: 'Pengaturan Izin', path: '/admin/permissions', icon: ShieldCheck, page: 'permissions', group: 'PENGATURAN' },
    { name: 'Aktivitas & Log', path: '/admin/activity', icon: Clock, page: 'activity', group: 'PENGATURAN' },
  ];

  // Filter items by permission and group them
  const visibleItems = allNavItems.filter(item => canAccessPage(item.page));
  const navGroups = Object.entries(
    visibleItems.reduce((groups, item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
      return groups;
    }, {} as Record<string, typeof allNavItems>)
  ).map(([label, items]) => ({ label, items }));

  const roleLabel = userRole === 'admin' ? 'Super Admin' : userRole === 'editor' ? 'Editor' : 'User Biasa';

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col md:flex-row font-sans text-slate-900 bg-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-[#1e293b] text-white shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shrink-0">
            <img src={logo} alt="MKN Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight">MKN Portal Hub</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" weight="bold" /> : <List className="w-5 h-5" weight="bold" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Slate & Cobalt Enterprise (Dark Navy) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 ${
          isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed ? 'md:w-[80px]' : 'md:w-[280px]'
        } transition-all duration-300 ease-in-out bg-[#0f172a] border-r border-[#1e293b] flex flex-col shrink-0`}
      >
        {/* Brand Area (Desktop) */}
        <div className={`hidden md:flex px-5 py-6 items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
             <div className="bg-white p-1.5 rounded-lg shrink-0">
               <img src={logo} alt="MKN Logo" className="w-7 h-7 object-contain" />
             </div>
             {!isCollapsed && (
                <div className="overflow-hidden">
                  <h2 className="text-base font-bold text-white tracking-tight leading-none truncate">MKN Portal Hub</h2>
                </div>
             )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            <List className="w-5 h-5" weight="bold" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 md:py-2 space-y-8 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <div className={`px-6 text-xs font-bold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'md:text-center md:text-[10px]' : ''}`}>
                {isCollapsed ? <span className="hidden md:inline">{group.label.substring(0, 3)}</span> : null}
                <span className={isCollapsed ? 'md:hidden' : ''}>{group.label}</span>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={item.name}
                      className={`group flex items-center ${isCollapsed ? 'md:justify-center md:py-3 justify-between py-2.5 pr-4 pl-5' : 'justify-between py-2.5 pr-4 pl-5'} transition-all duration-200 relative ${
                        isActive 
                          ? 'text-white bg-white/5' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3b82f6] rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#3b82f6]' : 'text-slate-500 group-hover:text-slate-300'} transition-colors shrink-0`} weight={isActive ? 'fill' : 'regular'} />
                        <span className={`font-medium text-sm whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>
                      </div>
                      {isActive && <CaretRight className={`w-3.5 h-3.5 text-slate-500 ${isCollapsed ? 'md:hidden' : ''}`} weight="bold" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1e293b] flex flex-col gap-2">
          <Link 
            to="/"
            target="_blank"
            title="Buka Halaman Portal"
            className={`w-full flex items-center ${isCollapsed ? 'md:justify-center md:p-2 justify-between p-3' : 'justify-between p-3'} rounded-xl hover:bg-white/5 transition-colors cursor-pointer group text-left text-slate-300 hover:text-white`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center shrink-0 border border-[#3b82f6]/30">
                <Globe className="w-4 h-4 text-[#3b82f6]" weight="bold" />
              </div>
              <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <p className="text-sm font-bold truncate">
                  Lihat Portal
                </p>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Buka halaman publik
                </p>
              </div>
            </div>
            <ArrowUpRight className={`w-4 h-4 text-slate-500 group-hover:text-[#3b82f6] transition-colors shrink-0 ${isCollapsed ? 'md:hidden' : ''}`} weight="bold" />
          </Link>
          
          <div className="h-px bg-[#1e293b] w-full my-1"></div>

          <Link 
            to="/admin/profile"
            title="Profil Saya"
            className={`w-full flex items-center ${isCollapsed ? 'md:justify-center md:p-2 justify-between p-3' : 'justify-between p-3'} rounded-xl hover:bg-white/5 transition-colors cursor-pointer group text-left`}
          >
            <div className="flex items-center gap-3">
              {session?.user?.user_metadata?.avatar_url ? (
                <img 
                  src={session.user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-slate-300">
                    {((session?.user?.user_metadata?.full_name || session?.user?.email) || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <p className="text-sm font-bold text-white truncate">
                  {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Pengguna'}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {roleLabel}
                </p>
              </div>
            </div>
            <CaretRight className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ${isCollapsed ? 'md:hidden' : ''}`} weight="bold" />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#ffffff]">
        <div className="p-6 sm:p-8 md:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
