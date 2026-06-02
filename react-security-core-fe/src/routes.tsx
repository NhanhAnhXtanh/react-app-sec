import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { DepartmentScreen } from '@/features/department/DepartmentScreen';
import { DepartmentFormRoute } from '@/features/department/DepartmentFormRoute';
import { OrganizationScreen } from '@/features/organization/OrganizationScreen';
import { OrganizationFormRoute } from '@/features/organization/OrganizationFormRoute';
import { EmployeeScreen } from '@/features/employee/EmployeeScreen';
import { EmployeeFormRoute } from '@/features/employee/EmployeeFormRoute';
import { UserManagementScreen, UserFormRoute } from '@/features/admin/users/UserManagementScreen';
import { RolesScreen } from '@/features/admin/security/roles/RolesScreen';
import { MenuDefinitionsScreen } from '@/features/admin/security/menu-definitions/MenuDefinitionsScreen';
import { PermissionMatrixScreen } from '@/features/admin/security/permission-matrix/PermissionMatrixScreen';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ActivatePage } from '@/features/auth/ActivatePage';
import { AccessDeniedPage } from '@/features/auth/AccessDeniedPage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { NotFound } from '@/router/NotFound';
import Report02 from './features/report/report02/Report02';
import Report02Detail from './features/report/report02/Report02Detail';
import Report01 from './features/report/report01/Report01';
import Report01Detail from './features/report/report01/Report01Detail';

const departmentDialogChildren: RouteObject[] = [
  { path: 'new/dialog', element: <DepartmentFormRoute mode="create" presentation="dialog" /> },
  { path: ':id/dialog', element: <DepartmentFormRoute mode="view" presentation="dialog" /> },
  { path: ':id/edit/dialog', element: <DepartmentFormRoute mode="edit" presentation="dialog" /> },
];

const organizationDialogChildren: RouteObject[] = [
  { path: 'new/dialog', element: <OrganizationFormRoute mode="create" presentation="dialog" /> },
  { path: ':id/dialog', element: <OrganizationFormRoute mode="view" presentation="dialog" /> },
  { path: ':id/edit/dialog', element: <OrganizationFormRoute mode="edit" presentation="dialog" /> },
];

const employeeDialogChildren: RouteObject[] = [
  { path: 'new/dialog', element: <EmployeeFormRoute mode="create" presentation="dialog" /> },
  { path: ':id/dialog', element: <EmployeeFormRoute mode="view" presentation="dialog" /> },
  { path: ':id/edit/dialog', element: <EmployeeFormRoute mode="edit" presentation="dialog" /> },
];

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/activate', element: <ActivatePage /> },
  { path: '/access-denied', element: <AccessDeniedPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/organizations" replace /> },

      // --- Core entities ---
      {
        path: 'organizations',
        element: <OrganizationScreen />,
        children: organizationDialogChildren,
      },
      { path: 'organizations/new', element: <OrganizationFormRoute mode="create" presentation="fullscreen" /> },
      { path: 'organizations/:id', element: <OrganizationFormRoute mode="view" presentation="fullscreen" /> },
      { path: 'organizations/:id/edit', element: <OrganizationFormRoute mode="edit" presentation="fullscreen" /> },

      {
        path: 'employees',
        element: <EmployeeScreen />,
        children: employeeDialogChildren,
      },
      { path: 'employees/new', element: <EmployeeFormRoute mode="create" presentation="fullscreen" /> },
      { path: 'employees/:id', element: <EmployeeFormRoute mode="view" presentation="fullscreen" /> },
      { path: 'employees/:id/edit', element: <EmployeeFormRoute mode="edit" presentation="fullscreen" /> },

      // --- Admin ---
      {
        path: 'admin/users',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><UserManagementScreen /></ProtectedRoute>,
      },
      {
        path: 'admin/users/new',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><UserFormRoute mode="create" /></ProtectedRoute>,
      },
      {
        path: 'admin/users/:login/edit',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><UserFormRoute mode="edit" /></ProtectedRoute>,
      },
      {
        path: 'admin/security/roles',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><RolesScreen /></ProtectedRoute>,
      },
      {
        path: 'admin/security/menu-definitions',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><MenuDefinitionsScreen /></ProtectedRoute>,
      },
      {
        path: 'admin/security/roles/:name/permissions',
        element: <ProtectedRoute requiredAuthority="ROLE_ADMIN"><PermissionMatrixScreen /></ProtectedRoute>,
      },

      {
        path: 'departments',
        element: <DepartmentScreen />,
        children: departmentDialogChildren,
      },
      { path: 'departments/new', element: <DepartmentFormRoute mode="create" presentation="fullscreen" /> },
      { path: 'departments/:id', element: <DepartmentFormRoute mode="view" presentation="fullscreen" /> },
      { path: 'departments/:id/edit', element: <DepartmentFormRoute mode="edit" presentation="fullscreen" /> },

      // --- Reports ---
      { path: 'reports/report01', element: <Report01 /> },
      { path: 'reports/report01/detail', element: <Report01Detail /> },
      { path: 'reports/report02', element: <Report02 /> },
      { path: 'reports/report02/detail', element: <Report02Detail /> },

      { path: '*', element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
