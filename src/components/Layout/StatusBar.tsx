import { useAppStore } from '../../store/useAppStore';

export function StatusBar() {
    const { activeCartonId, scannedCodes, cartonSize, operator } = useAppStore();

    return (
        <div className="status-bar">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <span className="shrink-0 text-slate-400">Carton</span>
                <span className="truncate font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {activeCartonId ?? '—'}
                </span>
            </div>
            <div className="shrink-0">
                <span className="font-semibold text-brand-700 dark:text-brand-400">
                    {scannedCodes.length}
                </span>
                <span className="text-slate-400"> / {cartonSize}</span>
            </div>
            {operator && (
                <div className="shrink-0 text-slate-500">
                    {operator}
                </div>
            )}
        </div>
    );
}
