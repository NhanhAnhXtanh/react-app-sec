import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { apiSearch, apiGet, apiPost, apiPut, apiDelete } from '@/shared/api/rest';
import type { Employee } from '@/model/employee.types';

const BASE = '/api/employees';

export const employeeApi = {
  search(params: PageRequest): Promise<PageResponse<Employee>> {
    return apiSearch<Employee>(BASE, params);
  },

  getById(id: string | number): Promise<Employee> {
    return apiGet<Employee>(`${BASE}/${id}`);
  },

  create(body: Partial<Employee>): Promise<Employee> {
    return apiPost<Employee>(BASE, body);
  },

  update(id: string | number, body: Partial<Employee>): Promise<Employee> {
    return apiPut<Employee>(`${BASE}/${id}`, { ...body, id });
  },

  delete(id: string | number): Promise<void> {
    return apiDelete(`${BASE}/${id}`);
  },
};
