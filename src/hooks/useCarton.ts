import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    createCarton,
    addScan,
    removeScan,
    sealCarton,
    getScansByCarton,
} from '../db/helpers';

export function useCarton() {
    const {
        operator,
        cartonSize,
        activeCartonId,
        scannedCodes,
        setActiveCarton,
        setScannedCodes,
        addScannedCode,
        removeScannedCode: removeFromStore,
        resetCartonSession,
        showToast,
    } = useAppStore();

    const startNewCarton = useCallback(async () => {
        const carton = await createCarton(operator, cartonSize);
        setActiveCarton(carton.carton_id);
        setScannedCodes([]);
        return carton.carton_id;
    }, [operator, cartonSize, setActiveCarton, setScannedCodes]);

    const handleScan = useCallback(
        async (code: string) => {
            if (!activeCartonId) return;

            const isDuplicate = scannedCodes.some((s) => s.code === code);
            if (isDuplicate) {
                showToast('error', 'Code already scanned!');
                return;
            }

            if (scannedCodes.length >= cartonSize) {
                showToast('warning', `Carton is full (${cartonSize} codes)`);
                return;
            }

            const scan = await addScan(activeCartonId, code, scannedCodes.length + 1);
            addScannedCode(scan);
        },
        [activeCartonId, scannedCodes, cartonSize, addScannedCode, showToast],
    );

    const handleRemove = useCallback(
        async (scanId: number) => {
            await removeScan(scanId);
            removeFromStore(scanId);
            // Re-index remaining scans in-memory (pouch_index stays in DB as-is;
            // the display re-derives index from array position)
        },
        [removeFromStore],
    );

    const handleSeal = useCallback(async (): Promise<string[]> => {
        if (!activeCartonId) throw new Error('No active carton');
        await sealCarton(activeCartonId);
        // Fetch fresh copies in DB order to return for QR gen
        const fresh = await getScansByCarton(activeCartonId);
        return fresh.map((s) => s.code);
    }, [activeCartonId]);

    const reset = useCallback(() => {
        resetCartonSession();
    }, [resetCartonSession]);

    return {
        activeCartonId,
        scannedCodes,
        cartonSize,
        startNewCarton,
        handleScan,
        handleRemove,
        handleSeal,
        reset,
    };
}
