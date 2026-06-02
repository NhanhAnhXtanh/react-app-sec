import { Outlet } from 'react-router-dom';
import { OrganizationTable } from './list/OrganizationTable';

export function OrganizationScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-slate-500">
          Tổ chức sở hữu / quản lý metadata.
        </p>
      </header>

      <OrganizationTable />

      <Outlet />
    </section>
  );
}
