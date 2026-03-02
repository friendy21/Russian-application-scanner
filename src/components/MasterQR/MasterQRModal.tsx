import { useEffect, useRef, useState } from 'react';
import { createQRInstance, downloadQRAsPng } from '../../utils/qrCodeGen';

interface MasterQRModalProps {
    payload: string;
    cartonId: string;
    totalCodes: number;
    onClose: () => void;
    onNewCarton: () => void;
}

export function MasterQRModal({
    payload,
    cartonId,
    totalCodes,
    onClose,
    onNewCarton,
}: MasterQRModalProps) {
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!qrContainerRef.current) return;
        qrContainerRef.current.innerHTML = '';
        const qr = createQRInstance(payload);
        qr.append(qrContainerRef.current);
    }, [payload]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadQRAsPng(payload, `MasterQR_${cartonId}`);
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                    <p className="text-xs text-slate-500">Carton Sealed</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{cartonId}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            {/* QR code */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6">
                <div ref={qrContainerRef} className="rounded-2xl shadow-2xl" />

                {/* Label */}
                <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-mono text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        Carton Label
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                        {cartonId}
                    </p>
                    <p className="text-sm text-slate-500">
                        {totalCodes} pouches &bull; {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex w-full max-w-sm flex-col gap-3">
                    <button
                        className="btn-primary w-full"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? 'Generating PNG…' : 'Download PNG (300 dpi)'}
                    </button>
                    <button className="btn-secondary w-full" onClick={handlePrint}>
                        Print Label
                    </button>
                    <button
                        className="btn-secondary w-full"
                        onClick={onNewCarton}
                    >
                        Start New Carton
                    </button>
                </div>
            </div>
        </div>
    );
}
