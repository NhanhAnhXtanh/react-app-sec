import { Outlet } from 'react-router-dom';
import { MetaSetVersionTable } from './list/MetaSetVersionTable';

export function MetaSetVersionScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Meta Set Versions
        </h1>
        <p className="text-sm text-slate-500">
          Lịch sử version cho mỗi MetaSet. VersionNo tự tăng theo MetaSet.
        </p>
      </header>

      <MetaSetVersionTable />

      <Outlet />
    </section>
  );
}
