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
import { domainApi } from '@/api/catalog.api';
import {
  appendDomainToList,
  getDomainByIdKey,
  replaceDomainInList,
} from './domain.cache';
import {
  DomainFormHost,
  type DomainFormValues,
} from './DomainFormHost';
import type { Domain } from '@/model/catalog.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function DomainFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () =>
    navigate(withSearch('/domains', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/domains/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id
      ? getDomainByIdKey(id)
      : ['domains', 'byId', '__none__'],
    queryFn: () => domainApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: DomainFormValues) =>
      domainApi.create(values),
    onSuccess: (created) => {
      appendDomainToList(queryClient, searchParams, created);
      toast.success('Tạo Domain thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/domains/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo Domain');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: DomainFormValues }) =>
      domainApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceDomainInList(queryClient, searchParams, updated);
      toast.success('Cập nhật Domain thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/domains/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật Domain');
    },
  });

  const handleSubmit = async (values: DomainFormValues) => {
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
          title={mode === 'view' ? 'Chi tiết Domain' : 'Sửa Domain'}
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
            Không tải được Domain {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: Domain | null =
    mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<Domain> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <DomainFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
