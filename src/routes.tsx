import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { OrganizationScreen } from '@/features/catalog/organization/OrganizationScreen';
import { OrganizationFormRoute } from '@/features/catalog/organization/OrganizationFormRoute';
import { DomainScreen } from '@/features/catalog/domain/DomainScreen';
import { DomainFormRoute } from '@/features/catalog/domain/DomainFormRoute';
import { TagScreen } from '@/features/catalog/tag/TagScreen';
import { TagFormRoute } from '@/features/catalog/tag/TagFormRoute';
import { MetaSourceScreen } from '@/features/metadata/metasource/MetaSourceScreen';
import { MetaSourceFormRoute } from '@/features/metadata/metasource/MetaSourceFormRoute';
import { MetaSourceConnect } from '@/features/metadata/metasource/connect/MetaSourceConnect';
import { MetaSetScreen } from '@/features/metadata/metaset/MetaSetScreen';
import { MetaSetFormRoute } from '@/features/metadata/metaset/MetaSetFormRoute';
import { MetaSetVersionScreen } from '@/features/metadata/metasetversion/MetaSetVersionScreen';
import { MetaSetVersionFormRoute } from '@/features/metadata/metasetversion/MetaSetVersionFormRoute';
import { MetaSyncScreen } from '@/features/metadata/metasync/MetaSyncScreen';
import { MetaSyncFormRoute } from '@/features/metadata/metasync/MetaSyncFormRoute';
import { NotFound } from '@/router/NotFound';
import { MetaPackListPage } from '@/features/metapack/pages/MetaPackListPage';
import { MetaPackFormPage } from '@/features/metapack/pages/MetaPackFormPage';

const organizationDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <OrganizationFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <OrganizationFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <OrganizationFormRoute mode="edit" presentation="dialog" />,
  },
];

const domainDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <DomainFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <DomainFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <DomainFormRoute mode="edit" presentation="dialog" />,
  },
];

const tagDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <TagFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <TagFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <TagFormRoute mode="edit" presentation="dialog" />,
  },
];

const metaSourceDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <MetaSourceFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <MetaSourceFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <MetaSourceFormRoute mode="edit" presentation="dialog" />,
  },

];

const metaSetDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <MetaSetFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <MetaSetFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <MetaSetFormRoute mode="edit" presentation="dialog" />,
  },
];

const metaSetVersionDialogChildren: RouteObject[] = [
  {
    path: 'new/dialog',
    element: <MetaSetVersionFormRoute mode="create" presentation="dialog" />,
  },
  {
    path: ':id/dialog',
    element: <MetaSetVersionFormRoute mode="view" presentation="dialog" />,
  },
];


const metaSyncDialogChildren: RouteObject[] = [
  {
    path: ':id/dialog',
    element: <MetaSyncFormRoute mode="view" presentation="dialog" />,
  },
  {
    path: ':id/edit/dialog',
    element: <MetaSyncFormRoute mode="edit" presentation="dialog" />,
  },
];

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/meta-sources" replace /> },
      {
        path: 'organizations',
        element: <OrganizationScreen />,
        children: organizationDialogChildren,
      },
      {
        path: 'organizations/new',
        element: <OrganizationFormRoute mode="create" presentation="fullscreen" />,
      },
      {
        path: 'organizations/:id',
        element: <OrganizationFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'organizations/:id/edit',
        element: <OrganizationFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'domains',
        element: <DomainScreen />,
        children: domainDialogChildren,
      },
      {
        path: 'domains/new',
        element: <DomainFormRoute mode="create" presentation="fullscreen" />,
      },
      {
        path: 'domains/:id',
        element: <DomainFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'domains/:id/edit',
        element: <DomainFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'tags',
        element: <TagScreen />,
        children: tagDialogChildren,
      },
      {
        path: 'tags/new',
        element: <TagFormRoute mode="create" presentation="fullscreen" />,
      },
      {
        path: 'tags/:id',
        element: <TagFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'tags/:id/edit',
        element: <TagFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'meta-sources',
        element: <MetaSourceScreen />,
        children: metaSourceDialogChildren,
      },
      {
        path: 'meta-sources/new',
        element: <MetaSourceFormRoute mode="create" presentation="fullscreen" />,
      },
      {
        path: 'meta-sources/:id',
        element: <MetaSourceFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'meta-sources/:id/edit',
        element: <MetaSourceFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'sources-control/:id',
        element: <MetaSourceConnect />,
      },
      {
        path: 'meta-sets',
        element: <MetaSetScreen />,
        children: metaSetDialogChildren,
      },
      {
        path: 'meta-sets/new',
        element: <MetaSetFormRoute mode="create" presentation="fullscreen" />,
      },
      {
        path: 'meta-sets/:id',
        element: <MetaSetFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'meta-sets/:id/edit',
        element: <MetaSetFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'meta-set-versions',
        element: <MetaSetVersionScreen />,
        children: metaSetVersionDialogChildren,
      },
      {
        path: 'meta-set-versions/new',
        element: (
          <MetaSetVersionFormRoute mode="create" presentation="fullscreen" />
        ),
      },
      {
        path: 'meta-set-versions/:id',
        element: (
          <MetaSetVersionFormRoute mode="view" presentation="fullscreen" />
        ),
      },

      {
        path: 'meta-syncs',
        element: <MetaSyncScreen />,
        children: metaSyncDialogChildren,
      },
      {
        path: 'meta-syncs/:id',
        element: <MetaSyncFormRoute mode="view" presentation="fullscreen" />,
      },
      {
        path: 'meta-syncs/:id/edit',
        element: <MetaSyncFormRoute mode="edit" presentation="fullscreen" />,
      },
      {
        path: 'metapacks',
        element: <MetaPackListPage />,
      },
      {
        path: 'metapacks/new',
        element: <MetaPackFormPage mode="create" />,
      },
      {
        path: 'metapacks/:id',
        element: <MetaPackFormPage mode="view" />,
      },
      {
        path: 'metapacks/:id/edit',
        element: <MetaPackFormPage mode="edit" />,
      },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
