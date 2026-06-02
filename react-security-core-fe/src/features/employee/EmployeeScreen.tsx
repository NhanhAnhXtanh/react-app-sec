import { Outlet } from 'react-router-dom';
import { EmployeeTable } from './list/EmployeeTable';

export function EmployeeScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Employee Management</h1>
        <p className="text-sm text-slate-500">
          Manage employees. Salary field is permission-gated and may not be visible to all users.
        </p>
      </header>
      <EmployeeTable />
      <Outlet />
    </section>
  );
}
