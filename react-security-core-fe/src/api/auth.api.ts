import type { AuthAccount } from '@/store/auth.store';

type LoginRequest = { username: string; password: string; rememberMe?: boolean };
type LoginResponse = { id_token: string };

export const authApi = {
  async login(req: LoginRequest): Promise<string> {
    const res = await fetch('/api/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json() as { detail?: string; message?: string };
        msg = b.detail ?? b.message ?? msg;
      } catch { /* empty */ }
      throw new Error(msg);
    }
    const data = (await res.json()) as LoginResponse;
    return data.id_token;
  },

  async fetchAccount(token: string): Promise<AuthAccount> {
    const res = await fetch('/api/account', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<AuthAccount>;
  },

  async register(body: {
    login: string;
    email: string;
    password: string;
    langKey?: string;
  }): Promise<void> {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, langKey: body.langKey ?? 'en' }),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json() as { detail?: string; title?: string };
        msg = b.detail ?? b.title ?? msg;
      } catch { /* empty */ }
      throw new Error(msg);
    }
  },

  async activate(key: string): Promise<void> {
    const res = await fetch(`/api/activate?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};
