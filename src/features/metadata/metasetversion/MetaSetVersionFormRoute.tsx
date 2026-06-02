import { toast } from 'sonner';
import {
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormPresentation } from '@/shared/types/form.types';
import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import { withSearch } from '@/shared/router/withSearch';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import {
  appendMetaSetVersionToList,
  getMetaSetVersionByIdKey,
} from './metasetversion.cache';
import { MetaSetVersionDetailView } from './detail/MetaSetVersionDetailView';
import {
  MetaSetVersionCreateForm,
  type MetaSetVersionFormValues,
} from './edit/MetaSetVersionCreateForm';

type Props = Readonly<{
  mode: 'create' | 'view';
  presentation: FormPresentation;
}>;

export function MetaSetVersionFormRoute(props: Readonly<Props>) {
  const { mode, presentation } = props;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const search = new URLSearchParams(location.search);
  const defaultMetaCode = search.get('metaCode');

  const closeForm = () =>
    navigate(withSearch('/meta-set-versions', location.search));

  const itemQuery = useQuery({
    queryKey: id
      ? getMetaSetVersionByIdKey(id)
      : ['meta-set-versions', 'byId', '__none__'],
    queryFn: () => metaSetVersionApi.getById(id as string),
    enabled: mode === 'view' && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (values: MetaSetVersionFormValues) =>
      metaSetVersionApi.create(values),
    onSuccess: (created) => {
      if (created.metaCode) {
        appendMetaSetVersionToList(queryClient, created.metaCode, created);
      }
      toast.success('Tạo Phiên bản mới thành công');
      navigate(withSearch(`/meta-set-versions/${created.id}`, location.search));
    },
    onError: () => {
      toast.error('Lỗi khi tạo Phiên bản');
    },
  });

  if (mode === 'view' && id) {
    if (itemQuery.isLoading) {
      return (
        <FormShell
          open
          presentation={presentation}
          title="Chi tiết Version"
          onClose={closeForm}
          dialogClassName={VIEW_DIALOG_CLASS_NAME}
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
          dialogClassName={VIEW_DIALOG_CLASS_NAME}
        >
          <div className="py-6 text-center text-sm text-red-600">
            Không tải được version {id}.
          </div>
        </FormShell>
      );
    }
    const item = itemQuery.data;
    return (
      <FormShell
        open
        presentation={presentation}
        title="Chi tiết Version"
        subtitle={`${item.metaCode} · v${item.versionNo}`}
        onClose={closeForm}
        dialogClassName={VIEW_DIALOG_CLASS_NAME}
      >
        <MetaSetVersionDetailView item={item} onClose={closeForm} />
      </FormShell>
    );
  }

  return (
    <FormShell
      open
      presentation={presentation}
      title="Tạo Version mới"
      onClose={closeForm}
    >
        <MetaSetVersionCreateForm
          defaultMetaCode={defaultMetaCode}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        onCancel={closeForm}
        submitting={createMutation.isPending}
      />
    </FormShell>
  );
}
