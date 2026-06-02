import { Outlet } from 'react-router-dom';
import { DomainTable } from './list/DomainTable';

export function DomainScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
        <p className="text-sm text-slate-500">
          Lĩnh vực/ngành áp dụng cho metadata.
        </p>
      </header>

      <DomainTable />

      <Outlet />
    </section>
  );
}
