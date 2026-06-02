import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EntityFormState, FormMode, FormPresentation } from '@/shared/types/form.types';
import { FormShell } from '@/shared/form/FormShell';
import { withSearch } from '@/shared/router/withSearch';
import { organizationApi } from '@/api/organization.api';
import {
  appendOrganizationToList,
  getOrganizationByIdKey,
  replaceOrganizationInList,
} from './organization.cache';
import { OrganizationFormHost, type OrganizationFormValues } from './OrganizationFormHost';
import type { Organization } from '@/model/organization.types';

type Props = { mode: FormMode; presentation: FormPresentation };

export function OrganizationFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () => navigate(withSearch('/organizations', location.search));
  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/organizations/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id ? getOrganizationByIdKey(id) : ['organizations', 'byId', '__none__'],
    queryFn: () => organizationApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: OrganizationFormValues) =>
      organizationApi.create({
        code: values.code,
        name: values.name,
        ownerLogin: values.ownerLogin || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
      }),
    onSuccess: (created) => {
      appendOrganizationToList(queryClient, searchParams, created);
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; values: OrganizationFormValues }) =>
      organizationApi.update(args.id, {
        code: args.values.code,
        name: args.values.name,
        ownerLogin: args.values.ownerLogin || undefined,
        budget: args.values.budget ? Number(args.values.budget) : undefined,
      }),
    onSuccess: (updated) => {
      replaceOrganizationInList(queryClient, searchParams, updated);
      closeForm();
    },
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(values);
    } else if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id: Number(id), values });
    }
  };

  if (mode !== 'create' && id) {
    if (itemQuery.isLoading) {
      return (
        <FormShell open presentation={presentation} title="Organization details" onClose={closeForm}>
          <div className="py-6 text-center text-sm text-slate-500">Loading…</div>
        </FormShell>
      );
    }
    if (itemQuery.isError || !itemQuery.data) {
      return (
        <FormShell open presentation={presentation} title="Not found" onClose={closeForm}>
          <div className="py-6 text-center text-sm text-red-600">Organization {id} could not be loaded.</div>
        </FormShell>
      );
    }
  }

  const item: Organization | null = mode === 'create' ? null : itemQuery.data ?? null;
  const state: EntityFormState<Organization> = { open: true, mode, presentation, item };

  return (
    <OrganizationFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
