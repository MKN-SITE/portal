// Permission action types
export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

// All possible page keys in the admin dashboard
export type PageKey = 'dashboard' | 'portals' | 'categories' | 'appearance' | 'sliders' | 'users' | 'permissions' | 'activity' | 'profile';

// Permission for a single page
export interface PagePermission {
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

// Full permission set for a role
export type RolePermissions = Record<PageKey, PagePermission>;

// Page metadata for UI display
export interface PageMeta {
  key: PageKey;
  label: string;
  path: string;
  group: string;
  description: string;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
}

// All pages with their metadata
export const PAGE_DEFINITIONS: PageMeta[] = [
  { key: 'dashboard', label: 'Ringkasan', path: '/admin', group: 'UMUM', description: 'Dashboard utama dan statistik', supportsCreate: false, supportsUpdate: false, supportsDelete: false },
  { key: 'portals', label: 'Kelola Portal', path: '/admin/portals', group: 'PORTAL & LAYANAN', description: 'Kelola daftar portal dan layanan', supportsCreate: true, supportsUpdate: true, supportsDelete: true },
  { key: 'categories', label: 'Kategori Layanan', path: '/admin/categories', group: 'PORTAL & LAYANAN', description: 'Kelola kategori portal', supportsCreate: true, supportsUpdate: true, supportsDelete: true },
  { key: 'appearance', label: 'Identitas Website', path: '/admin/appearance', group: 'PENGATURAN', description: 'Ubah logo, nama, dan tampilan website', supportsCreate: false, supportsUpdate: true, supportsDelete: false },
  { key: 'sliders', label: 'Slider Beranda', path: '/admin/sliders', group: 'PENGATURAN', description: 'Kelola slider di halaman utama', supportsCreate: true, supportsUpdate: true, supportsDelete: true },
  { key: 'users', label: 'Pengguna Admin', path: '/admin/users', group: 'PENGATURAN', description: 'Kelola pengguna dan hak akses', supportsCreate: true, supportsUpdate: true, supportsDelete: true },
  { key: 'permissions', label: 'Pengaturan Izin', path: '/admin/permissions', group: 'PENGATURAN', description: 'Atur hak akses halaman dan tindakan untuk setiap role', supportsCreate: false, supportsUpdate: true, supportsDelete: false },
  { key: 'activity', label: 'Aktivitas & Log', path: '/admin/activity', group: 'PENGATURAN', description: 'Lihat log aktivitas sistem', supportsCreate: false, supportsUpdate: false, supportsDelete: false },
  { key: 'profile', label: 'Profil', path: '/admin/profile', group: 'AKUN', description: 'Pengaturan profil pribadi', supportsCreate: false, supportsUpdate: true, supportsDelete: false },
];

// Default permissions - Super Admin always gets full access (hardcoded, not from DB)
export const ADMIN_FULL_ACCESS: RolePermissions = Object.fromEntries(
  PAGE_DEFINITIONS.map(p => [p.key, { can_view: true, can_create: true, can_update: true, can_delete: true }])
) as RolePermissions;

// Default editor permissions (used when seeding DB)
export const DEFAULT_EDITOR_PERMISSIONS: RolePermissions = {
  dashboard:  { can_view: true,  can_create: false, can_update: false, can_delete: false },
  portals:    { can_view: true,  can_create: true,  can_update: true,  can_delete: false },
  categories: { can_view: true,  can_create: false, can_update: false, can_delete: false },
  appearance: { can_view: false, can_create: false, can_update: false, can_delete: false },
  sliders:    { can_view: false, can_create: false, can_update: false, can_delete: false },
  users:      { can_view: false, can_create: false, can_update: false, can_delete: false },
  permissions:{ can_view: false, can_create: false, can_update: false, can_delete: false },
  activity:   { can_view: false, can_create: false, can_update: false, can_delete: false },
  profile:    { can_view: true,  can_create: false, can_update: true,  can_delete: false },
};

// Default regular user permissions
export const DEFAULT_USER_PERMISSIONS: RolePermissions = {
  dashboard:  { can_view: true,  can_create: false, can_update: false, can_delete: false },
  portals:    { can_view: true,  can_create: false, can_update: false, can_delete: false },
  categories: { can_view: false, can_create: false, can_update: false, can_delete: false },
  appearance: { can_view: false, can_create: false, can_update: false, can_delete: false },
  sliders:    { can_view: false, can_create: false, can_update: false, can_delete: false },
  users:      { can_view: false, can_create: false, can_update: false, can_delete: false },
  permissions:{ can_view: false, can_create: false, can_update: false, can_delete: false },
  activity:   { can_view: false, can_create: false, can_update: false, can_delete: false },
  profile:    { can_view: true,  can_create: false, can_update: true,  can_delete: false },
};

// Map route paths to page keys for route guarding
export const PATH_TO_PAGE: Record<string, PageKey> = Object.fromEntries(
  PAGE_DEFINITIONS.map(p => [p.path, p.key])
) as Record<string, PageKey>;

// Helper: check if a role+permissions allows a specific action on a page
export function checkPermission(
  permissions: RolePermissions | null,
  page: PageKey,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  const p = permissions[page];
  if (!p) return false;
  switch (action) {
    case 'view': return p.can_view;
    case 'create': return p.can_create;
    case 'update': return p.can_update;
    case 'delete': return p.can_delete;
    default: return false;
  }
}
