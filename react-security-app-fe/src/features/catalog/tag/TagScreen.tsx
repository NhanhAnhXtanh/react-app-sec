import { Outlet } from 'react-router-dom';
import { TagTable } from './list/TagTable';

export function TagScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-slate-500">
          Nhãn để gắn vào MetaSet.
        </p>
      </header>

      <TagTable />

      <Outlet />
    </section>
  );
}
