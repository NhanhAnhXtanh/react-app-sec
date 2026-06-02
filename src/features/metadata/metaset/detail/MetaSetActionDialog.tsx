import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type MetaSetActionKind = 'publish' | 'discontinue';

type Props = {
  open: boolean;
  kind: MetaSetActionKind;
  busy?: boolean;
  onConfirm: (payload: { actor?: string; comment?: string }) => void;
  onCancel: () => void;
};

const COPY: Record<
  MetaSetActionKind,
  { title: string; description: string; confirmLabel: string }
> = {
  publish: {
    title: 'Phát hành MetaSet',
    description:
      'Sau khi phát hành, MetaSet sẽ chuyển sang trạng thái PUBLISHED.',
    confirmLabel: 'Phát hành',
  },
  discontinue: {
    title: 'Ngừng dùng MetaSet',
    description:
      'MetaSet sẽ chuyển sang trạng thái DISCONTINUED và không dùng cho sync nữa.',
    confirmLabel: 'Ngừng dùng',
  },
};

export function MetaSetActionDialog({
  open,
  kind,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const [actor, setActor] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setActor('');
      setComment('');
    }
  }, [open, kind]);

  const copy = COPY[kind];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="action-actor">Người thực hiện</FieldLabel>
            <FieldContent>
              <Input
                id="action-actor"
                value={actor}
                placeholder="vd: admin"
                onChange={(e) => setActor(e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="action-comment">Ghi chú</FieldLabel>
            <FieldContent>
              <Textarea
                id="action-comment"
                rows={3}
                value={comment}
                placeholder="Lý do / chú thích…"
                onChange={(e) => setComment(e.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onConfirm({
                actor: actor.trim() || undefined,
                comment: comment.trim() || undefined,
              })
            }
          >
            {busy ? 'Đang xử lý…' : copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
