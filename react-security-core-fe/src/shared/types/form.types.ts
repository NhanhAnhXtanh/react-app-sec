export type FormMode = 'create' | 'edit' | 'view';

export type FormPresentation = 'dialog' | 'fullscreen';

export type EntityFormState<T> = {
  open: boolean;
  mode: FormMode;
  presentation: FormPresentation;
  item: T | null;
};

export const closedFormState = <T,>(): EntityFormState<T> => ({
  open: false,
  mode: 'create',
  presentation: 'dialog',
  item: null,
});
