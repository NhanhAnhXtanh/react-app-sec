import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EntityFormState, FormMode, FormPresentation } from '@/shared/types/form.types';
import { FormShell } from '@/shared/form/FormShell';
import { withSearch } from '@/shared/router/withSearch';
import { employeeApi } from '@/api/employee.api';
import { appendEmployeeToList, getEmployeeByIdKey, replaceEmployeeInList } from './employee.cache';
import { EmployeeFormHost, type EmployeeFormValues } from './EmployeeFormHost';
import type { Employee } from '@/model/employee.types';

type Props = { mode: FormMode; presentation: FormPresentation };

export function EmployeeFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () => navigate(withSearch('/employees', location.search));
  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/employees/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id ? getEmployeeByIdKey(id) : ['employees', 'byId', '__none__'],
    queryFn: () => employeeApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      employeeApi.create({
        employeeNumber: values.employeeNumber,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        email: values.email || undefined,
        salary: values.salary ? Number(values.salary) : undefined,
        department: values.departmentId ? { id: Number(values.departmentId) } : undefined,
      }),
    onSuccess: (created) => { appendEmployeeToList(queryClient, searchParams, created); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; values: EmployeeFormValues }) =>
      employeeApi.update(args.id, {
        employeeNumber: args.values.employeeNumber,
        firstName: args.values.firstName || undefined,
        lastName: args.values.lastName || undefined,
        email: args.values.email || undefined,
        salary: args.values.salary ? Number(args.values.salary) : undefined,
        department: args.values.departmentId ? { id: Number(args.values.departmentId) } : undefined,
      }),
    onSuccess: (updated) => { replaceEmployeeInList(queryClient, searchParams, updated); closeForm(); },
  });

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (mode === 'create') await createMutation.mutateAsync(values);
    else if (mode === 'edit' && id) await updateMutation.mutateAsync({ id: Number(id), values });
  };

  if (mode !== 'create' && id) {
    if (itemQuery.isLoading) return (
      <FormShell open presentation={presentation} title="Employee details" onClose={closeForm}>
        <div className="py-6 text-center text-sm text-slate-500">Loading…</div>
      </FormShell>
    );
    if (itemQuery.isError || !itemQuery.data) return (
      <FormShell open presentation={presentation} title="Not found" onClose={closeForm}>
        <div className="py-6 text-center text-sm text-red-600">Employee {id} could not be loaded.</div>
      </FormShell>
    );
  }

  const item: Employee | null = mode === 'create' ? null : itemQuery.data ?? null;
  const state: EntityFormState<Employee> = { open: true, mode, presentation, item };

  return (
    <EmployeeFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
