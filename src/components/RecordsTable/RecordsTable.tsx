import type { Carton } from '../../db/dexie';

const STATUS_COLORS: Record<Carton['status'], string> = {
    packing: 'badge-info',
    sealed: 'badge-warn',
    verified: 'badge-success',
    failed: 'badge-error',
};

interface RecordsTableProps {
    cartons: Carton[];
    fromDate: string;
    toDate: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
    onExport: () => void;
    exporting: boolean;
}

export function RecordsTable({
    cartons,
    fromDate,
    toDate,
    onFromChange,
    onToChange,
    onExport,
    exporting,
}: RecordsTableProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Date range filter */}
            <div className="card flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Range Filter</p>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">From</label>
                        <input type="date" className="input" value={fromDate} onChange={(e) => onFromChange(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">To</label>
                        <input type="date" className="input" value={toDate} onChange={(e) => onToChange(e.target.value)} />
                    </div>
                </div>
                <button
                    className="btn-primary w-full"
                    onClick={onExport}
                    disabled={exporting || cartons.length === 0}
                >
                    {exporting ? 'Building Excel…' : `Export Excel (${cartons.length} carton${cartons.length !== 1 ? 's' : ''})`}
                </button>
            </div>

            {/* Records list */}
            {cartons.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">No cartons found in selected range.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {cartons.map((c) => (
                        <div key={c.id} className="card flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {c.carton_id}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Created: {new Date(c.created_at).toLocaleString()}
                                </p>
                                {c.sealed_at && (
                                    <p className="text-xs text-slate-500">
                                        Sealed: {new Date(c.sealed_at).toLocaleString()}
                                    </p>
                                )}
                                {c.verified_at && (
                                    <p className="text-xs text-slate-500">
                                        Verified: {new Date(c.verified_at).toLocaleString()}
                                    </p>
                                )}
                                {c.operator && (
                                    <p className="text-xs text-slate-500">Operator: {c.operator}</p>
                                )}
                            </div>
                            <span className={`shrink-0 ${STATUS_COLORS[c.status]}`}>
                                {c.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
