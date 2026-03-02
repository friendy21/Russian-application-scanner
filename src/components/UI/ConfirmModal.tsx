interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
                <div className="mt-5 flex gap-3">
                    <button className="btn-secondary flex-1" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
