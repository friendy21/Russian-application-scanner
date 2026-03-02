import { displayCode } from '../../utils/cyrillicUtils';

interface VerifyPanelProps {
    cartonId: string;
    expectedCodes: string[];
    scannedResults: { code: string; matched: boolean }[];
    onDone: (passed: boolean) => void;
}

export function VerifyPanel({
    cartonId,
    expectedCodes,
    scannedResults,
    onDone,
}: VerifyPanelProps) {
    const total = expectedCodes.length;
    const matchCount = scannedResults.filter((r) => r.matched).length;
    const mismatchCount = scannedResults.filter((r) => !r.matched).length;
    const verified = scannedResults.length;
    const isFinished = scannedResults.length >= total;

    const passed = isFinished && mismatchCount === 0;

    return (
        <div className="flex flex-col gap-4">
            {/* Summary card */}
            <div className="card">
                <p className="text-xs text-slate-500">Verifying</p>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{cartonId}</p>
                <div className="mt-3 flex gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{verified}<span className="text-base font-normal text-slate-400"> / {total}</span></p>
                        <p className="text-xs text-slate-500">scanned</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{matchCount}</p>
                        <p className="text-xs text-slate-500">matched</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{mismatchCount}</p>
                        <p className="text-xs text-slate-500">mismatch</p>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar">
                <div
                    className={`progress-fill ${passed ? 'complete' : ''}`}
                    style={{ width: `${Math.min((verified / total) * 100, 100)}%` }}
                />
            </div>

            {/* Result banner */}
            {isFinished && (
                <div
                    className={`rounded-xl p-4 text-center font-bold ${passed
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'border border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}
                >
                    {passed
                        ? `VERIFIED — ${total}/${total} PASS — ${cartonId}`
                        : `MISMATCH — ${mismatchCount} unknown code${mismatchCount > 1 ? 's' : ''} — DO NOT SHIP`}
                </div>
            )}

            {/* Code list */}
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '38vh' }}>
                {/* Show expected codes not yet scanned */}
                {expectedCodes.map((expected, idx) => {
                    const result = scannedResults.find((r) => r.code === expected);
                    return (
                        <div
                            key={idx}
                            className={`code-item ${result ? (result.matched ? 'verified' : 'mismatch') : ''}`}
                        >
                            <span className="w-7 shrink-0 text-right text-xs text-slate-400">{idx + 1}</span>
                            <span className="flex-1 truncate">{displayCode(expected, 50)}</span>
                            {result && (
                                <span className={result.matched ? 'text-emerald-600' : 'text-red-600'}>
                                    {result.matched ? '✓' : '✗'}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Unexpected codes scanned */}
                {scannedResults
                    .filter((r) => !r.matched)
                    .map((r, idx) => (
                        <div key={`mis-${idx}`} className="code-item mismatch">
                            <span className="w-7 shrink-0 text-right text-xs text-slate-400">?</span>
                            <span className="flex-1 truncate text-red-700 dark:text-red-400">
                                {displayCode(r.code, 50)}
                            </span>
                            <span className="text-red-600">✗</span>
                        </div>
                    ))}
            </div>

            {/* Commit result */}
            {isFinished && (
                <button
                    className={passed ? 'btn-primary w-full' : 'btn-danger w-full'}
                    onClick={() => onDone(passed)}
                >
                    {passed ? 'Mark Verified & Close' : 'Mark Failed & Quarantine'}
                </button>
            )}
        </div>
    );
}
