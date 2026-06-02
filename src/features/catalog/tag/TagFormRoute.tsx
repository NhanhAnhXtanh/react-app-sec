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
import { tagApi } from '@/api/catalog.api';
import {
  appendTagToList,
  getTagByIdKey,
  replaceTagInList,
} from './tag.cache';
import {
  TagFormHost,
  type TagFormValues,
} from './TagFormHost';
import type { Tag } from '@/model/catalog.types';

type Props = {
  mode: FormMode;
  presentation: FormPresentation;
};

export function TagFormRoute({ mode, presentation }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const closeForm = () =>
    navigate(withSearch('/tags', location.search));

  const goToEdit = () => {
    if (!id) return;
    const suffix = presentation === 'dialog' ? '/dialog' : '';
    navigate(withSearch(`/tags/${id}/edit${suffix}`, location.search));
  };

  const itemQuery = useQuery({
    queryKey: id
      ? getTagByIdKey(id)
      : ['tags', 'byId', '__none__'],
    queryFn: () => tagApi.getById(id!),
    enabled: mode !== 'create' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: TagFormValues) =>
      tagApi.create(values),
    onSuccess: (created) => {
      appendTagToList(queryClient, searchParams, created);
      toast.success('Tạo Tag thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/tags/${created.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo Tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; values: TagFormValues }) =>
      tagApi.update(args.id, args.values),
    onSuccess: (updated) => {
      replaceTagInList(queryClient, searchParams, updated);
      toast.success('Cập nhật Tag thành công');
      const suffix = presentation === 'dialog' ? '/dialog' : '';
      navigate(withSearch(`/tags/${updated.id}${suffix}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật Tag');
    },
  });

  const handleSubmit = async (values: TagFormValues) => {
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
          title={mode === 'view' ? 'Chi tiết Tag' : 'Sửa Tag'}
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
            Không tải được Tag {id}.
          </div>
        </FormShell>
      );
    }
  }

  const item: Tag | null =
    mode === 'create' ? null : itemQuery.data ?? null;

  const state: EntityFormState<Tag> = {
    open: true,
    mode,
    presentation,
    item,
  };

  return (
    <TagFormHost
      state={state}
      onClose={closeForm}
      onEdit={mode === 'view' ? goToEdit : undefined}
      onSubmit={handleSubmit}
      submitting={createMutation.isPending || updateMutation.isPending}
    />
  );
}
