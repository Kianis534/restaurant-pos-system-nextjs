'use client';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/*
 * App-wide feedback: toast notifications and a styled confirm dialog, replacing the
 * browser's alert() and confirm(), which block the page and can't be styled.
 *
 *   const { toast, confirm } = useFeedback();
 *   if (await confirm({ title: 'Delete item?', destructive: true })) { ...; toast('Item deleted'); }
 */

type Tone = 'success' | 'error' | 'info';

export interface ToastOptions {
  tone?: Tone;
  /** Milliseconds before it disappears. Default 4 s (6 s with an action). */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for actions that delete or discard something. */
  destructive?: boolean;
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

interface FeedbackContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const TONE = {
  success: { icon: CheckCircle2, className: 'text-green-600' },
  error: { icon: AlertCircle, className: 'text-red-600' },
  info: { icon: Info, className: 'text-blue-600' },
} as const;

const MAX_TOASTS = 3;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, message, tone: 'success', ...options }]);
      setTimeout(() => dismiss(id), options.duration ?? (options.action ? 6000 : 4000));
    },
    [dismiss],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    resolver.current?.(false); // a new question cancels any unanswered one
    setDialog(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setDialog(null);
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Dialog.Root open={!!dialog} onOpenChange={(open) => !open && answer(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="no-print fixed inset-0 z-[60] bg-black/50" />
          <Dialog.Content
            role="alertdialog"
            className="no-print fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none"
            {...(dialog?.description ? {} : { 'aria-describedby': undefined })}
          >
            <Dialog.Title className="text-lg font-semibold text-gray-900">{dialog?.title}</Dialog.Title>
            {dialog?.description && (
              <Dialog.Description className="mt-2 whitespace-pre-line text-sm text-gray-600">{dialog.description}</Dialog.Description>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => answer(false)}>
                {dialog?.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={dialog?.destructive ? 'destructive' : 'default'} onClick={() => answer(true)}>
                {dialog?.confirmLabel ?? 'OK'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div
        className="no-print pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = TONE[t.tone ?? 'success'];
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 pr-2 text-sm text-gray-900 shadow-lg"
              data-testid="toast"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tone.className)} aria-hidden="true" />
              <p className="flex-1 pt-0.5">{t.message}</p>
              {t.action && (
                <button
                  type="button"
                  className="rounded px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" onClick={() => dismiss(t.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within a FeedbackProvider');
  return context;
}
