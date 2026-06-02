import { Outlet } from 'react-router-dom';
import { MetaSourceTable } from './list/MetaSourceTable';

export function MetaSourceScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meta Sources</h1>
        <p className="text-sm text-slate-500">
          Quản lý nguồn dữ liệu metadata.
        </p>
      </header>

      <MetaSourceTable />

      <Outlet />
    </section>
  );
}
