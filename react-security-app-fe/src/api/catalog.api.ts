import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { httpDelete, httpGet, httpJson } from '@/shared/api/http';
import { springSearch } from '@/shared/api/spring';
import type { Domain, Organization, Tag } from '@/model/catalog.types';

const ORG = '/api/organizations';
const DOM = '/api/domains';
const TAG = '/api/tags';

export const organizationApi = {
  search: (p: PageRequest): Promise<PageResponse<Organization>> =>
    springSearch<Organization>(ORG, p),
  listAll: (): Promise<Organization[]> =>
    springSearch<Organization>(ORG, { pageIndex: 0, pageSize: 1000 }).then(
      (r) => r.items,
    ),
  getById: (id: string): Promise<Organization> =>
    httpGet<Organization>(`${ORG}/${encodeURIComponent(id)}`),
  create: (body: Partial<Organization>): Promise<Organization> =>
    httpJson<Organization>(ORG, 'POST', body),
  update: (id: string, body: Partial<Organization>): Promise<Organization> =>
    httpJson<Organization>(`${ORG}/${encodeURIComponent(id)}`, 'PUT', body),
  delete: (id: string): Promise<void> =>
    httpDelete(`${ORG}/${encodeURIComponent(id)}`),
};

export const domainApi = {
  search: (p: PageRequest): Promise<PageResponse<Domain>> =>
    springSearch<Domain>(DOM, p),
  listAll: (): Promise<Domain[]> =>
    springSearch<Domain>(DOM, { pageIndex: 0, pageSize: 1000 }).then(
      (r) => r.items,
    ),
  getById: (id: string): Promise<Domain> =>
    httpGet<Domain>(`${DOM}/${encodeURIComponent(id)}`),
  create: (body: Partial<Domain>): Promise<Domain> =>
    httpJson<Domain>(DOM, 'POST', body),
  update: (id: string, body: Partial<Domain>): Promise<Domain> =>
    httpJson<Domain>(`${DOM}/${encodeURIComponent(id)}`, 'PUT', body),
  delete: (id: string): Promise<void> =>
    httpDelete(`${DOM}/${encodeURIComponent(id)}`),
};

export const tagApi = {
  search: (p: PageRequest): Promise<PageResponse<Tag>> =>
    springSearch<Tag>(TAG, p),
  listAll: (): Promise<Tag[]> =>
    springSearch<Tag>(TAG, { pageIndex: 0, pageSize: 1000 }).then(
      (r) => r.items,
    ),
  getById: (id: string): Promise<Tag> =>
    httpGet<Tag>(`${TAG}/${encodeURIComponent(id)}`),
  create: (body: Partial<Tag>): Promise<Tag> =>
    httpJson<Tag>(TAG, 'POST', body),
  update: (id: string, body: Partial<Tag>): Promise<Tag> =>
    httpJson<Tag>(`${TAG}/${encodeURIComponent(id)}`, 'PUT', body),
  delete: (id: string): Promise<void> =>
    httpDelete(`${TAG}/${encodeURIComponent(id)}`),
};
