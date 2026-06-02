type ToastMessage = string | number | boolean | null | undefined;

const logToast = (level: 'info' | 'warn' | 'error', message: ToastMessage) => {
  const text = message == null ? '' : String(message);
  console[level](text);
};

export const toast = {
  success: (message: ToastMessage) => logToast('info', message),
  error: (message: ToastMessage) => logToast('error', message),
  info: (message: ToastMessage) => logToast('info', message),
  warning: (message: ToastMessage) => logToast('warn', message),
  warn: (message: ToastMessage) => logToast('warn', message),
};

export function Toaster() {
  return null;
}
