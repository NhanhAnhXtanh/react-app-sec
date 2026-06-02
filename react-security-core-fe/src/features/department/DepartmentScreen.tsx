import { Outlet } from 'react-router-dom';
import { DepartmentTable } from './list/DepartmentTable';

export function DepartmentScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Department Management
        </h1>
        <p className="text-sm text-slate-500">
          Same DataCollection pattern as companies. The list never unmounts
          while a form is open.
        </p>
      </header>

      <DepartmentTable />

      {/* Form overlays render here from nested routes. */}
      <Outlet />
    </section>
  );
}
