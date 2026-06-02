import { Outlet } from 'react-router-dom';
import { OrganizationTable } from './list/OrganizationTable';

export function OrganizationScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Management</h1>
        <p className="text-sm text-slate-500">
          Manage organizations. Budget field is permission-gated and may not be visible to all users.
        </p>
      </header>
      <OrganizationTable />
      <Outlet />
    </section>
  );
}
