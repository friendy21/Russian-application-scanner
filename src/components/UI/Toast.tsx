import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { ToastItem } from '../../store/useAppStore';

const toastColors: Record<ToastItem['type'], string> = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300',
    warning: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    info: 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function ToastContainer() {
    const toasts = useAppStore((s) => s.toasts);
    const dismiss = useAppStore((s) => s.dismissToast);

    return (
        <div
            className="fixed bottom-20 right-4 z-50 flex flex-col gap-2"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`toast flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${toastColors[t.type]}`}
                >
                    <span>{t.message}</span>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-60 hover:opacity-100"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
