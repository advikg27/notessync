import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAllUserData } from '../utils/clearUserData';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        console.log('🚪 Logging out - clearing all user data...');
        
        // Clear the auth state first
        set({ user: null, token: null });
        
        // Use the comprehensive clearing utility
        clearAllUserData();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

