import { create } from 'zustand';

export type AuthAccount = {
  login: string;
  email: string;
  firstName?: string;
  lastName?: string;
  authorities: string[];
  activated: boolean;
};

type AuthState = {
  token: string | null;
  account: AuthAccount | null;
  isAuthenticated: boolean;
  setToken: (token: string, remember?: boolean) => void;
  setAccount: (account: AuthAccount) => void;
  logout: () => void;
};

const TOKEN_KEY = 'security-core-authentication-token';

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: loadToken(),
  account: null,
  isAuthenticated: false,

  setToken: (token, remember = true) => {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ token, isAuthenticated: true });
  },

  setAccount: (account) => {
    set({ account, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    set({ token: null, account: null, isAuthenticated: false });
  },
}));

export function getAuthToken(): string | null {
  return loadToken();
}

export function hasAuthority(account: AuthAccount | null, authority: string): boolean {
  return account?.authorities?.includes(authority) ?? false;
}
