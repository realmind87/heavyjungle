import type { Toast, ToastOptions, ToastVariant } from "@/components/ui/toast/types";

const DEFAULT_DURATION = 4000;

let memoryState: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const listener of listeners) {
    listener(memoryState);
  }
}

function genId() {
  return crypto.randomUUID();
}

function clearDismissTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
}

function scheduleDismiss(id: string, duration: number) {
  clearDismissTimer(id);

  if (duration <= 0) return;

  const timer = setTimeout(() => {
    dismiss(id);
  }, duration);

  dismissTimers.set(id, timer);
}

function addToast(title: string, variant: ToastVariant, options: ToastOptions = {}) {
  const id = genId();
  const duration = options.duration ?? DEFAULT_DURATION;
  const toast: Toast = {
    id,
    title,
    description: options.description,
    variant: options.variant ?? variant,
    duration,
  };

  memoryState = [toast, ...memoryState].slice(0, 5);
  emit();
  scheduleDismiss(id, duration);

  return id;
}

export function subscribe(listener: (toasts: Toast[]) => void) {
  listeners.add(listener);
  listener(memoryState);

  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return memoryState;
}

export function dismiss(id?: string) {
  if (id) {
    clearDismissTimer(id);
    memoryState = memoryState.filter((toast) => toast.id !== id);
  } else {
    for (const toast of memoryState) {
      clearDismissTimer(toast.id);
    }
    memoryState = [];
  }

  emit();
}

function createToastFn(variant: ToastVariant) {
  return (title: string, options?: ToastOptions) => addToast(title, variant, options);
}

export const toast = Object.assign(createToastFn("default"), {
  success: createToastFn("success"),
  error: createToastFn("error"),
  info: createToastFn("info"),
  dismiss,
});
