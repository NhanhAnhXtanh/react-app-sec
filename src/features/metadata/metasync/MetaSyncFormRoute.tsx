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
import { metaSyncApi } from '@/api/metasync.api';
import {
  appendMetaSyncToList,
  getMetaSyncByIdKey,
  replaceMetaSyncInList,
} from './metasync.cache';
import {
  MetaSyncFormHost,
  type MetaSyncFormValues,
} from './MetaSyncFormHost';
import type { MetaSync } from '@/model/metasync.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function MetaSyncFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () => navigate(withSearch('/meta-syncs', location.search));

  const goToMetaSet = (metaSetId: string) =>
    navigate(withSearch(`/meta-sets/${metaSetId}`, location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/meta-syncs/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id ? getMetaSyncByIdKey(id) : ['meta-syncs', 'byId', '__none__'],
    queryFn: () => metaSyncApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: MetaSyncFormValues) => metaSyncApi.create(values),
    onSuccess: (created) => {
      appendMetaSyncToList(queryClient, searchParams, created);
      toast.success('Tạo MetaSync thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-syncs/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo MetaSync');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: MetaSyncFormValues }) =>
      metaSyncApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceMetaSyncInList(queryClient, searchParams, updated);
      toast.success('Cập nhật MetaSync thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-syncs/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật MetaSync');
    },
  });

  const handleSubmit = async (values: MetaSyncFormValues) => {
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
          title={mode === 'view' ? 'Chi tiết MetaSync' : 'Sửa MetaSync'}
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
            Không tải được MetaSync {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: MetaSync | null = mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<MetaSync> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <MetaSyncFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
      onExtracted={goToMetaSet}
    />
  );
}
