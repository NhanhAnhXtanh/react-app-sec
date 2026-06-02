import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { getAuthToken } from '@/store/auth.store';
import { HttpError } from './http';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readError(res: Response): Promise<HttpError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    try { body = await res.text(); } catch { body = null; }
  }
  const message =
    (body && typeof body === 'object' && 'detail' in body
      ? String((body as { detail: unknown }).detail)
      : body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? `HTTP ${res.status}`;
  return new HttpError(res.status, body, message);
}

export function buildPageParams(params: PageRequest): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('page', String(params.pageIndex));
  sp.set('size', String(params.pageSize));

  for (const s of params.sorting ?? []) {
    sp.append('sort', `${s.id},${s.desc ? 'desc' : 'asc'}`);
  }

  if (params.keyword) {
    sp.set('query', params.keyword);
  }

  for (const f of params.filters ?? []) {
    if (f.value === undefined || f.value === null || f.value === '') continue;
    sp.set(f.id + '.equals', String(f.value));
  }

  return sp;
}

export async function apiSearch<T>(
  url: string,
  params: PageRequest,
): Promise<PageResponse<T>> {
  const res = await fetch(`${url}?${buildPageParams(params)}`, {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw await readError(res);
  const total = parseInt(res.headers.get('X-Total-Count') ?? '0', 10);
  const items = (await res.json()) as T[];
  return { items, total };
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await readError(res);
  return res.json() as Promise<T>;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) throw await readError(res);
}
