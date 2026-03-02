import { useState, useCallback } from 'react';
import { CameraScanner } from '../components/Scanner/CameraScanner';
import { VerifyPanel } from '../components/VerifyPanel/VerifyPanel';
import { useAppStore } from '../store/useAppStore';
import { parsePayload } from '../utils/qrCodeGen';
import { markVerified, logVerificationEvent } from '../db/helpers';
import { normaliseCode } from '../utils/cyrillicUtils';

type Phase = 'scan-master' | 'verify-codes' | 'done';

// Audio feedback
function playBeep(type: 'success' | 'error') {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = type === 'success' ? 880 : 220;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (_) { }
}

export function VerifyPage() {
    const showToast = useAppStore((s) => s.showToast);
    const {
        startVerifySession,
        addVerifyCode,
        resetVerifySession,
        verifyCartonId,
        verifyExpectedCodes,
        verifyScannedCodes,
    } = useAppStore();

    const [phase, setPhase] = useState<Phase>('scan-master');
    const [manualJson, setManualJson] = useState('');

    const handleMasterQRDecode = useCallback(
        (raw: string) => {
            try {
                const payload = parsePayload(raw);
                startVerifySession(payload.cid, payload.codes);
                logVerificationEvent(payload.cid, 'start');
                setPhase('verify-codes');
            } catch {
                showToast('error', 'Invalid Master QR — cannot parse payload');
            }
        },
        [startVerifySession, showToast],
    );

    const handleManualJson = () => {
        handleMasterQRDecode(manualJson.trim());
    };

    const handlePouchScan = useCallback(
        (code: string) => {
            const normalised = normaliseCode(code);
            const alreadyScanned = verifyScannedCodes.some((r) => r.code === normalised);
            if (alreadyScanned) {
                showToast('warning', 'Code already scanned in this session');
                return;
            }
            const matched = verifyExpectedCodes.includes(normalised);
            addVerifyCode(normalised);
            playBeep(matched ? 'success' : 'error');
            if (!matched) {
                showToast('error', 'MISMATCH: unknown code detected');
            }
            if (verifyCartonId) {
                logVerificationEvent(verifyCartonId, matched ? 'match' : 'mismatch', normalised);
            }
        },
        [verifyExpectedCodes, verifyScannedCodes, verifyCartonId, addVerifyCode, showToast],
    );

    const handleDone = async (passed: boolean) => {
        if (verifyCartonId) {
            await markVerified(verifyCartonId, passed);
            await logVerificationEvent(verifyCartonId, 'complete');
        }
        showToast(passed ? 'success' : 'error', passed ? 'Carton verified successfully' : 'Carton FAILED verification');
        setPhase('done');
    };

    const handleReset = () => {
        resetVerifySession();
        setPhase('scan-master');
        setManualJson('');
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            {phase === 'scan-master' && (
                <>
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Step 1 — Scan the Master QR Code on the carton lid
                        </h2>
                    </div>
                    <CameraScanner onDecode={handleMasterQRDecode} />
                    <div className="card flex flex-col gap-2">
                        <p className="text-xs text-slate-500">Or paste the QR JSON payload directly:</p>
                        <textarea
                            className="input font-mono text-xs"
                            rows={4}
                            placeholder='{"v":1,"cid":"CARTON-...","ts":"...","codes":[...]}'
                            value={manualJson}
                            onChange={(e) => setManualJson(e.target.value)}
                        />
                        <button className="btn-secondary" onClick={handleManualJson} disabled={!manualJson.trim()}>
                            Parse JSON
                        </button>
                    </div>
                </>
            )}

            {phase === 'verify-codes' && verifyCartonId && (
                <>
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Step 2 — Scan each pouch as it is removed from the carton
                        </h2>
                    </div>
                    <CameraScanner onDecode={handlePouchScan} />
                    <VerifyPanel
                        cartonId={verifyCartonId}
                        expectedCodes={verifyExpectedCodes}
                        scannedResults={verifyScannedCodes}
                        onDone={handleDone}
                    />
                </>
            )}

            {phase === 'done' && (
                <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-slate-600 dark:text-slate-400">Verification complete and logged.</p>
                    <button className="btn-primary" onClick={handleReset}>
                        Start Another Verification
                    </button>
                </div>
            )}
        </div>
    );
}
