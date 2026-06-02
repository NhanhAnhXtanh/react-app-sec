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
import { metaSourceApi } from '@/api/metasource.api';
import {
  appendMetaSourceToList,
  getMetaSourceByIdKey,
  replaceMetaSourceInList,
} from './metasource.cache';
import {
  MetaSourceFormHost,
  type MetaSourceFormValues,
} from './MetaSourceFormHost';
import type { MetaSource } from '@/model/metasource.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function MetaSourceFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () => navigate(withSearch('/meta-sources', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/meta-sources/${id}/edit${suffix}`, location.search));
  };

  const goToConnect = () => {
    if (!id) return;
    navigate(withSearch(`/sources-control/${id}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id ? getMetaSourceByIdKey(id) : ['meta-sources', 'byId', '__none__'],
    queryFn: () => metaSourceApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: MetaSourceFormValues) => metaSourceApi.create(values),
    onSuccess: (created) => {
      appendMetaSourceToList(queryClient, searchParams, created);
      toast.success('Tạo MetaSource thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-sources/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo MetaSource');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: MetaSourceFormValues }) =>
      metaSourceApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceMetaSourceInList(queryClient, searchParams, updated);
      toast.success('Cập nhật MetaSource thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-sources/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật MetaSource');
    },
  });

  const handleSubmit = async (values: MetaSourceFormValues) => {
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
          title={mode === 'view' ? 'Chi tiết MetaSource' : 'Sửa MetaSource'}
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
            Không tải được MetaSource {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: MetaSource | null = mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<MetaSource> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <MetaSourceFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onConnect={mode === 'view' ? goToConnect : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
