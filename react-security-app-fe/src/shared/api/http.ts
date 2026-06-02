import type { PageRequest } from '@/shared/table/table.types';

export function buildSearchParams(params: PageRequest): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('pageIndex', String(params.pageIndex));
  sp.set('pageSize', String(params.pageSize));

  if (params.keyword) sp.set('keyword', params.keyword);

  for (const s of params.sorting ?? []) {
    sp.append('sort', `${s.id}:${s.desc ? 'desc' : 'asc'}`);
  }

  for (const f of params.filters ?? []) {
    if (f.value === undefined || f.value === null || f.value === '') continue;
    sp.append('filter', `${f.id}:${String(f.value)}`);
  }

  return sp;
}

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

async function readError(res: Response): Promise<HttpError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  const message = (b?.message ?? b?.error)
    ? String(b?.message ?? b?.error)
    : `HTTP ${res.status}`;
  return new HttpError(res.status, body, message);
}

export async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export async function httpJson<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export async function httpDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw await readError(res);
}
