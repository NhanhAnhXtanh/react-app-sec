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
import { metaSetApi } from '@/api/metaset.api';
import {
  appendMetaSetToList,
  getMetaSetByIdKey,
  replaceMetaSetInList,
} from './metaset.cache';
import {
  MetaSetFormHost,
  type MetaSetFormValues,
} from './MetaSetFormHost';
import type { MetaSet } from '@/model/metaset.types';
import type { MetaSetActionKind } from './detail/MetaSetActionDialog';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function MetaSetFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () => navigate(withSearch('/meta-sets', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/meta-sets/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id ? getMetaSetByIdKey(id) : ['meta-sets', 'byId', '__none__'],
    queryFn: () => metaSetApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: MetaSetFormValues) => metaSetApi.create(values),
    onSuccess: (created) => {
      appendMetaSetToList(queryClient, searchParams, created);
      queryClient.invalidateQueries({ queryKey: ['meta-set-versions'] });
      toast.success('Tạo MetaSet thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-sets/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo MetaSet');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: MetaSetFormValues }) =>
      metaSetApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceMetaSetInList(queryClient, searchParams, updated);
      queryClient.invalidateQueries({ queryKey: ['meta-set-versions'] });
      toast.success('Cập nhật MetaSet thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/meta-sets/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật MetaSet');
    },
  });

  const actionMutation = useMutation({
    mutationFn: (args: {
      kind: MetaSetActionKind;
      id: string;
      payload: { actor?: string; comment?: string };
    }) =>
      args.kind === 'publish'
        ? metaSetApi.publish(args.id, args.payload)
        : metaSetApi.discontinue(args.id, args.payload),
    onSuccess: (updated) => {
      replaceMetaSetInList(queryClient, searchParams, updated);
      queryClient.invalidateQueries({ queryKey: ['meta-set-versions'] });
      toast.success('Thực hiện thao tác thành công');
    },
    onError: () => {
      toast.error('Lỗi khi thực hiện thao tác');
    },
  });

  const handleSubmit = async (values: MetaSetFormValues) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(values);
    } else if (mode === 'edit' && id) {
      await updateMutation.mutateAsync({ id, values });
    }
  };

  const handleAction = async (
    kind: MetaSetActionKind,
    payload: { actor?: string; comment?: string },
  ) => {
    if (!id) return;
    await actionMutation.mutateAsync({ kind, id, payload });
  };

  if (mode !== 'create' && id) {
    if (itemQuery.isLoading) {
      return (
        <FormShell
          open
          presentation={presentation}
          title={mode === 'view' ? 'Chi tiết MetaSet' : 'Sửa MetaSet'}
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
            Không tải được MetaSet {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: MetaSet | null = mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<MetaSet> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <MetaSetFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      onAction={mode === 'view' ? handleAction : undefined}
      actionPending={actionMutation.isPending}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
