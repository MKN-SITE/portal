import { ServiceItem, ProjectCardData } from '../types';
import erpppImg from '../assets/images/erppp.jpg';
import logoMkn from '../assets/images/logo_mkn.png';
import videoOnward from '../assets/images/onward.mp4';
import hsesclassImg from '../assets/images/hsesclass.png';
import msdclassImg from '../assets/images/msdclass.png';
import cctvmknImg from '../assets/images/cctvmkn.png';
import iconPm from '../assets/images/icon_pm.png';

export interface CompanyInfo {
  name: string;
  tagline: string;
  subtagline: string;
  established: string;
  location: string;
  totalProjects: string;
  activePortals: string;
  clientCount: string;
  satisfactionRate: string;
  authType: string;
}

export const COMPANY_INFO: CompanyInfo = {
  name: 'MKN PORTAL HUB',
  tagline: 'Pusat Akses & Direktori Web Portal Perusahaan',
  subtagline: 'Satu pintu akses terpadu untuk seluruh sistem operasional, portal manajemen, dan layanan digital MKN.',
  established: '2021',
  location: 'Sangatta, Kalimantan Timur',
  totalProjects: '8 Portal',
  activePortals: '8 Portal Live',
  clientCount: '5 Kategori',
  satisfactionRate: '99.99%',
  authType: 'SSO Enforced'
};

export interface MarqueeItem {
  id: string;
  title: string;
  company: string;
  gif: string;
  url: string;
  category: string;
  tags: string[];
  description: string;
  status: 'Active' | 'Beta' | 'Enterprise';
  statusColor: 'emerald' | 'amber' | 'red';
  customImage?: string;
  previewImage?: string;
  customIcon?: string;
}

export const MARQUEE_PORTALS: MarqueeItem[] = [
  {
    id: 'mkn-smart-portal',
    title: 'MKN Smart Portal',
    company: 'MKN Smart System',
    gif: '',
    url: 'https://mknsmart.my.id/',
    category: 'Operasional & Sistem',
    tags: ['MKN Smart', 'Operasional', 'Live Web', 'Realtime'],
    description: 'Portal resmi MKN Smart untuk manajemen operasional cerdas, pemantauan sistem, dan integrasi layanan internal.',
    status: 'Active',
    statusColor: 'emerald',
    customIcon: logoMkn
  },
  {
    id: 'mkn-pm-ops-portal',
    title: 'MKN PM Ops Portal',
    company: 'MKN PM Operations',
    gif: '',
    url: 'https://pm.mknops.web.id/',
    category: 'Operasional & Sistem',
    tags: ['Preventive Maintenance', 'PM Ops', 'Live Web', 'Tracking'],
    description: 'Portal pemeliharaan preventif (Preventive Maintenance Ops) dan sistem operasional harian untuk inspeksi, perawatan berkala, dan pemantauan perangkat.',
    status: 'Active',
    statusColor: 'emerald',
    customIcon: iconPm
  },
  {
    id: 'mkn-erp-portal',
    title: 'MKN Enterprise ERP Portal',
    company: 'MKN ERP System',
    gif: '',
    url: 'https://erp-mkn.starbit.id/login',
    category: 'Manajemen & Analitik',
    tags: ['ERP System', 'Starbit Cloud', 'Keuangan', 'Inventaris'],
    description: 'Portal ERP terpadu perusahaan untuk manajemen inventaris, keuangan, sumber daya, dan modul operasional bisnis MKN.',
    status: 'Enterprise',
    statusColor: 'emerald',
    customImage: erpppImg
  },
  {
    id: 'hses-kpc-training',
    title: 'HSES KPC Daftar Training',
    company: 'KPC HSES Class',
    gif: '',
    url: 'https://kpc-hsesclass.azurewebsites.net/',
    category: 'Training & Sertifikasi',
    tags: ['HSES', 'KPC', 'Training', 'Safety'],
    description: 'Portal pendaftaran dan manajemen pelatihan HSES (Health, Safety, Environment & Security) KPC untuk karyawan dan kontraktor.',
    status: 'Active',
    statusColor: 'emerald',
    previewImage: hsesclassImg
  },
  {
    id: 'msd-refresh',
    title: 'MSD Refresh',
    company: 'MSD Portal',
    gif: '',
    url: 'https://atdportal.netlify.app/',
    category: 'Layanan & Dukungan',
    tags: ['MSD', 'Portal', 'Layanan', 'Dukungan'],
    description: 'Portal MSD untuk layanan dan dukungan teknis perusahaan.',
    status: 'Active',
    statusColor: 'emerald',
    previewImage: msdclassImg
  },
  {
    id: 'cctv-mkn-site',
    title: 'CCTV MKN SITE',
    company: 'MKN Security System',
    gif: '',
    url: 'http://10.80.16.29/doc/page/login.asp?_1785559389694',
    category: 'Keamanan & Monitoring',
    tags: ['CCTV', 'Security', 'Monitoring', 'Local Network'],
    description: 'Portal monitoring CCTV MKN Site. Catatan: Hanya dapat diakses melalui IE Mode dan Local Network MKN.',
    status: 'Active',
    statusColor: 'amber',
    previewImage: cctvmknImg
  }
];

export const COMPANY_SOLUTIONS: ServiceItem[] = [
  {
    number: '01',
    title: 'Portal Operasional & Manajemen Sistem',
    description: 'Akses langsung ke platform kerja harian, pelaporan tugas, dan pemantauan sistem operasional perusahaan secara terpusat.'
  },
  {
    number: '02',
    title: 'Portal Analitik & Dashboard Eksekutif',
    description: 'Ringkasan data kinerja bisnis waktu nyata, indikator KPI utama, dan laporan strategi untuk manajemen.'
  },
  {
    number: '03',
    title: 'Portal Layanan Karyawan & HR Suite',
    description: 'Layanan mandiri karyawan untuk pengajuan administrasi, direktori tim, serta reservasi fasilitas perusahaan.'
  },
  {
    number: '04',
    title: 'Portal Pengembang & Infrastruktur Cloud',
    description: 'Dokumentasi API resmi, pemantauan server cloud, dan pustaka komponen desain untuk tim teknis.'
  },
  {
    number: '05',
    title: 'Portal Informasi & Keamanan Terpadu',
    description: 'Pusat pengumuman resmi, standar aset merek, dan pintu masuk portal terenkripsi khusus eksekutif.'
  }
];

export const FEATURED_PROJECTS: ProjectCardData[] = [];

export const DECORATIVE_IMAGES = {
  group3D: logoMkn,
  videoOnward: videoOnward
};
