import { Outlet } from 'react-router-dom';
import { MetaSetTable } from './list/MetaSetTable';

export function MetaSetScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meta Sets</h1>
        <p className="text-sm text-slate-500">
          Bộ metadata thuộc một MetaSource. Hỗ trợ publish / discontinue và
          quản lý version.
        </p>
      </header>

      <MetaSetTable />

      <Outlet />
    </section>
  );
}
