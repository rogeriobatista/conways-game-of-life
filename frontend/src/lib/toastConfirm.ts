import { toast } from 'sonner'

export type ToastConfirmOptions = {
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  /** ms before auto-dismiss; default 28s */
  duration?: number
}

/** In-toast confirmation (replaces blocking `window.confirm`). */
export function toastConfirm({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  duration = 28_000,
}: ToastConfirmOptions): void {
  const id = toast(title, {
    description,
    duration,
    closeButton: true,
    action: {
      label: confirmLabel,
      onClick: () => {
        toast.dismiss(id)
        void Promise.resolve(onConfirm())
      },
    },
    cancel: {
      label: cancelLabel,
      onClick: () => {
        toast.dismiss(id)
      },
    },
  })
}
