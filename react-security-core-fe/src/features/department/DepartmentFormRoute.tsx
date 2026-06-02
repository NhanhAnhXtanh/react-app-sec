import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EntityFormState,
  FormMode,
  FormPresentation,
} from '@/shared/types/form.types';
import { FormShell } from '@/shared/form/FormShell';
import { withSearch } from '@/shared/router/withSearch';
import { departmentApi } from '@/api/department.api';
import {
  appendDepartmentToList,
  getDepartmentByIdKey,
  readOrganizationIdFilter,
  removeDepartmentFromList,
  replaceDepartmentInList,
} from './department.cache';
import {
  DepartmentFormHost,
  type DepartmentFormValues,
} from './DepartmentFormHost';
import type { Department } from '@/model/department.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function DepartmentFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () =>
    navigate(withSearch('/departments', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/departments/${id}/edit${suffix}`, location.search));
  };

  const filterOrganizationId = readOrganizationIdFilter(searchParams);

  const itemQuery = useQuery({
    queryKey: id ? getDepartmentByIdKey(id) : ['departments', 'byId', '__none__'],
    queryFn: () => departmentApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const buildPayload = (values: DepartmentFormValues): Partial<Department> => ({
    code: values.code,
    name: values.name,
    costCenter: values.costCenter || undefined,
    organization: values.organizationId
      ? { id: Number(values.organizationId), name: '' }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Department>) => departmentApi.create(payload),
    onSuccess: (created) => {
      if (!filterOrganizationId || String(created.organization?.id) === filterOrganizationId) {
        appendDepartmentToList(queryClient, searchParams, created);
      }
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: Partial<Department> }) =>
      departmentApi.update(args.id, args.payload),
    onSuccess: (updated) => {
      if (filterOrganizationId && String(updated.organization?.id) !== filterOrganizationId) {
        removeDepartmentFromList(queryClient, searchParams, updated.id);
        queryClient.setQueryData(getDepartmentByIdKey(updated.id), updated);
      } else {
        replaceDepartmentInList(queryClient, searchParams, updated);
      }
      closeForm();
    },
  });

  const handleSubmit = async (values: DepartmentFormValues) => {
    const payload = buildPayload(values);
    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
    } else if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id, payload });
    }
  };

  if (mode !== 'create' && id) {
    if (itemQuery.isLoading) {
      return (
        <FormShell
          open
          presentation={presentation}
          title={mode === 'view' ? 'Department details' : 'Edit department'}
          onClose={closeForm}
        >
          <div className="py-6 text-center text-sm text-slate-500">
            Loading…
          </div>
        </FormShell>
      );
    }

    if (itemQuery.isError || !itemQuery.data) {
      return (
        <FormShell
          open
          presentation={presentation}
          title="Not found"
          onClose={closeForm}
        >
          <div className="py-6 text-center text-sm text-red-600">
            Department {id} could not be loaded.
          </div>
        </FormShell>
      );
    }
  }

  const item: Department | null =
    mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<Department> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <DepartmentFormHost
      state={state}
      defaultOrganizationId={filterOrganizationId}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
