import type { Scan } from '../../db/dexie';
import { displayCode } from '../../utils/cyrillicUtils';

interface AggregationPanelProps {
    codes: Scan[];
    cartonSize: number;
    cartonId: string | null;
    onRemove: (id: number) => void;
    onSeal: () => void;
}

export function AggregationPanel({
    codes,
    cartonSize,
    cartonId,
    onRemove,
    onSeal,
}: AggregationPanelProps) {
    const count = codes.length;
    const isComplete = count >= cartonSize;
    const fillPct = Math.min((count / cartonSize) * 100, 100);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="card flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Active Carton</p>
                    <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cartonId ?? '—'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">
                        {count}
                        <span className="text-base font-normal text-slate-400"> / {cartonSize}</span>
                    </p>
                    <p className="text-xs text-slate-500">scanned</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar">
                <div
                    className={`progress-fill ${isComplete ? 'complete' : ''}`}
                    style={{ width: `${fillPct}%` }}
                />
            </div>

            {/* Scanned code list */}
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '40vh' }}>
                {codes.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">
                        No codes scanned yet. Point camera at a pouch cap.
                    </p>
                )}
                {codes.map((scan, idx) => (
                    <div key={scan.id} className="code-item group">
                        <span className="w-7 shrink-0 text-right text-xs text-slate-400">{idx + 1}</span>
                        <span className="flex-1 truncate">{displayCode(scan.code, 50)}</span>
                        <button
                            onClick={() => scan.id != null && onRemove(scan.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400
                         opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600
                         group-hover:opacity-100 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            aria-label="Remove this code"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* Seal button */}
            <button
                className="btn-primary w-full"
                disabled={!isComplete}
                onClick={onSeal}
            >
                {isComplete ? 'Seal Carton & Generate Master QR' : `Waiting for ${cartonSize - count} more codes…`}
            </button>
        </div>
    );
}
