import { create } from "zustand";

export interface UserRole {
  id: number | string;
  role_code: string;
  role_name: string;
}

export interface User {
  id: number | string;
  username: string;
  full_name: string;
  email?: string;
  roles: UserRole[];
}

export interface MenuItem {
  id: number | string;
  parent_id?: number | string;
  menu_code: string;
  menu_name: string;
  route?: string;
  icon?: string;
  children?: MenuItem[];
}

interface AuthState {
  user: User | null;
  permissions: string[];
  menus: MenuItem[];
  isAuthenticated: boolean;
  setAuth: (user: User, permissions: string[], menus: MenuItem[]) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  menus: [],
  isAuthenticated: false,
  setAuth: (user, permissions, menus) => {
    set({ 
      user: user || null, 
      permissions: Array.isArray(permissions) ? permissions : [], 
      menus: Array.isArray(menus) ? menus : [], 
      isAuthenticated: true 
    });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    set({ user: null, permissions: [], menus: [], isAuthenticated: false });
  },
  hasPermission: (permissionCode: string) => {
    const { permissions, user } = get();
    if (user?.roles?.some((r) => r.role_code === "SUPER_ADMIN")) {
      return true;
    }
    return Array.isArray(permissions) && permissions.includes(permissionCode);
  },
}));
