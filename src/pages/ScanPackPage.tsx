import { useState, useCallback } from 'react';
import { CameraScanner } from '../components/Scanner/CameraScanner';
import { AggregationPanel } from '../components/AggregationPanel/AggregationPanel';
import { MasterQRModal } from '../components/MasterQR/MasterQRModal';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useCarton } from '../hooks/useCarton';
import { useAppStore } from '../store/useAppStore';
import { buildPayload, serializePayload } from '../utils/qrCodeGen';

export function ScanPackPage() {
    const { operator } = useAppStore();
    const showToast = useAppStore((s) => s.showToast);
    const {
        activeCartonId,
        scannedCodes,
        cartonSize,
        startNewCarton,
        handleScan,
        handleRemove,
        handleSeal,
        reset,
    } = useCarton();

    const [showConfirm, setShowConfirm] = useState(false);
    const [sealedPayload, setSealedPayload] = useState<string | null>(null);

    const onScanDecode = useCallback(
        async (code: string) => {
            if (!activeCartonId) {
                showToast('warning', 'Start a new carton session first');
                return;
            }
            await handleScan(code);
        },
        [activeCartonId, handleScan, showToast],
    );

    const handleStartNew = async () => {
        await startNewCarton();
    };

    const onSealClick = () => setShowConfirm(true);

    const onSealConfirm = async () => {
        setShowConfirm(false);
        try {
            const codes = await handleSeal();
            const payload = serializePayload(buildPayload(activeCartonId!, codes));
            setSealedPayload(payload);
        } catch (err) {
            showToast('error', 'Failed to seal carton');
        }
    };

    const onCloseQR = () => {
        setSealedPayload(null);
    };

    const onNewCarton = () => {
        setSealedPayload(null);
        reset();
        startNewCarton();
    };

    if (!operator) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-slate-500">Set your operator name in Settings before scanning.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Start session */}
            {!activeCartonId ? (
                <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-slate-500">No active carton session.</p>
                    <button className="btn-primary" onClick={handleStartNew}>
                        Start New Carton Session
                    </button>
                </div>
            ) : (
                <>
                    <CameraScanner onDecode={onScanDecode} active={!sealedPayload} />
                    <AggregationPanel
                        codes={scannedCodes}
                        cartonSize={cartonSize}
                        cartonId={activeCartonId}
                        onRemove={handleRemove}
                        onSeal={onSealClick}
                    />
                </>
            )}

            {/* Seal confirmation */}
            {showConfirm && (
                <ConfirmModal
                    title="Seal Carton?"
                    message={`This will seal carton ${activeCartonId} with ${scannedCodes.length} codes. This action cannot be undone.`}
                    confirmLabel="Seal Carton"
                    danger
                    onConfirm={onSealConfirm}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            {/* Master QR overlay */}
            {sealedPayload && activeCartonId && (
                <MasterQRModal
                    payload={sealedPayload}
                    cartonId={activeCartonId}
                    totalCodes={scannedCodes.length}
                    onClose={onCloseQR}
                    onNewCarton={onNewCarton}
                />
            )}
        </div>
    );
}
