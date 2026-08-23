import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  organizationId: string;
}

interface AuthState {
  token: string | null;
  tokenExpiresAt: number | null; // Unix ms timestamp
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      tokenExpiresAt: null,
      user: null,
      setAuth: (token, user) => {
        // Access tokens expire in 15m — store expiry 30s early to refresh proactively
        const expiresAt = Date.now() + 14.5 * 60 * 1000;
        set({ token, user, tokenExpiresAt: expiresAt });
      },
      clearAuth: () => set({ token: null, user: null, tokenExpiresAt: null }),
      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        return Date.now() >= tokenExpiresAt;
      },
    }),
    {
      name: "straxon-auth",
    }
  )
);
