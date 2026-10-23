import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessToastEvent {
  message: string;
}

interface ToastItem extends SuccessToastEvent {
  id: number;
}

const SUCCESS_EVENT = 'st-silas:success';

export function notifySuccess(message: string) {
  window.dispatchEvent(new CustomEvent<SuccessToastEvent>(SUCCESS_EVENT, {
    detail: { message },
  }));
}

export const AppSuccessToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onSuccess = (event: Event) => {
      const message = (event as CustomEvent<SuccessToastEvent>).detail?.message;
      if (!message) return;

      const id = Date.now() + Math.random();
      setToasts(current => [...current, { id, message }]);
      window.setTimeout(() => {
        setToasts(current => current.filter(toast => toast.id !== id));
      }, 4500);
    };

    window.addEventListener(SUCCESS_EVENT, onSuccess);
    return () => window.removeEventListener(SUCCESS_EVENT, onSuccess);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6 sm:top-6" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-emerald-950 shadow-xl shadow-emerald-950/10 animate-in fade-in slide-in-from-top-4 duration-300 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span className="flex-1 pt-1 text-sm font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}
            aria-label="Dismiss success message"
            className="rounded-lg p-1 text-emerald-700/70 transition hover:bg-emerald-50 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
