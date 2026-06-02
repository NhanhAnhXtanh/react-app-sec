import { toast } from 'sonner';
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
import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import { withSearch } from '@/shared/router/withSearch';
import { organizationApi } from '@/api/catalog.api';
import {
  appendOrganizationToList,
  getOrganizationByIdKey,
  replaceOrganizationInList,
} from './organization.cache';
import {
  OrganizationFormHost,
  type OrganizationFormValues,
} from './OrganizationFormHost';
import type { Organization } from '@/model/catalog.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function OrganizationFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () =>
    navigate(withSearch('/organizations', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/organizations/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id
      ? getOrganizationByIdKey(id)
      : ['organizations', 'byId', '__none__'],
    queryFn: () => organizationApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: OrganizationFormValues) =>
      organizationApi.create(values),
    onSuccess: (created) => {
      appendOrganizationToList(queryClient, searchParams, created);
      toast.success('Tạo Tổ chức thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/organizations/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo Tổ chức');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: OrganizationFormValues }) =>
      organizationApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceOrganizationInList(queryClient, searchParams, updated);
      toast.success('Cập nhật Tổ chức thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/organizations/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật Tổ chức');
    },
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(values);
    } else if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id, values });
    }
  };

  if (mode !== 'create' && id) {
    if (itemQuery.isLoading) {
      return (
        <FormShell
          open
          presentation={presentation}
          title={mode === 'view' ? 'Chi tiết Organization' : 'Sửa Organization'}
          onClose={closeForm}
          dialogClassName={mode === 'view' ? VIEW_DIALOG_CLASS_NAME : undefined}
        >
          <div className="py-6 text-center text-sm text-slate-500">
            Đang tải…
          </div>
        </FormShell>
      );
    }

    if (itemQuery.isError || !itemQuery.data) {
      return (
        <FormShell
          open
          presentation={presentation}
          title="Không tìm thấy"
          onClose={closeForm}
          dialogClassName={mode === 'view' ? VIEW_DIALOG_CLASS_NAME : undefined}
        >
          <div className="py-6 text-center text-sm text-red-600">
            Không tải được Organization {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: Organization | null =
    mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<Organization> = {
    open: true,
    mode,
    presentation,
    item,
  };

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
