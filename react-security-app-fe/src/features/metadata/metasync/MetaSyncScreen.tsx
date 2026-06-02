import { Outlet } from 'react-router-dom';
import { MetaSyncTable } from './list/MetaSyncTable';

export function MetaSyncScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meta Syncs</h1>
        <p className="text-sm text-slate-500">
          Danh sách toàn bộ metadata đã đồng bộ từ các nguồn dữ liệu.
        </p>
      </header>

      <MetaSyncTable />

      <Outlet />
    </section>
  );
}
