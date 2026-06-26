export type ToastVariant = "default" | "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

export type ToastOptions = {
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};
