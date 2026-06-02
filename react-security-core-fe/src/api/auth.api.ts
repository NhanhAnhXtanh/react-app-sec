import type { AuthAccount } from '@/store/auth.store';

type LoginRequest = { username: string; password: string; rememberMe?: boolean };
type LoginResponse = { accessToken: string; refreshToken: string; expiresInSeconds: number };

/**
 * Auth client for the consumer BE (security-core username-only model, starter v0.1.x).
 *  - POST /api/auth/login    -> { accessToken, refreshToken, ... }
 *  - GET  /api/auth/me        -> identity + authorities (gates admin UI)
 *  - POST /api/auth/register  -> self-service account (defaults to ROLE_USER)
 * The starter dropped JHipster's /api/authenticate + /api/account + /api/register in v0.1.0.
 */
export const authApi = {
  async login(req: LoginRequest): Promise<string> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: req.username, password: req.password }),
    });
    if (!res.ok) {
      let msg = res.status === 401 ? 'Sai tài khoản hoặc mật khẩu' : `HTTP ${res.status}`;
      try {
        const b = (await res.json()) as { detail?: string; message?: string };
        msg = b.detail ?? b.message ?? msg;
      } catch {
        /* empty */
      }
      throw new Error(msg);
    }
    const data = (await res.json()) as LoginResponse;
    return data.accessToken;
  },

  async fetchAccount(token: string): Promise<AuthAccount> {
    const res = await fetch('/api/auth/me', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<AuthAccount>;
  },

  async register(body: {
    login: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    langKey?: string;
  }): Promise<void> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        username: body.login,
        password: body.password,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
      }),
    });
    if (!res.ok) {
      let msg = res.status === 409 ? 'Tài khoản hoặc email đã tồn tại' : `HTTP ${res.status}`;
      try {
        const b = (await res.json()) as { detail?: string; message?: string };
        msg = b.detail ?? b.message ?? msg;
      } catch {
        /* empty */
      }
      throw new Error(msg);
    }
  },

  /**
   * Email activation is not part of the current BE (register activates immediately).
   * Kept so the legacy ActivatePage route still type-checks; it reports unavailability.
   */
  async activate(_key: string): Promise<void> {
    throw new Error('Kích hoạt qua email không áp dụng cho hệ thống này.');
  },
};
