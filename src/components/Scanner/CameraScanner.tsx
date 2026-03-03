import { useRef, useState, useEffect, useCallback } from 'react';
import { useScanner } from '../../hooks/useScanner';

interface CameraScannerProps {
    onDecode: (code: string) => void;
    active?: boolean;
}

export function CameraScanner({ onDecode, active = true }: CameraScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [manualInput, setManualInput] = useState('');
    const [lastDecoded, setLastDecoded] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanFlash, setScanFlash] = useState(false);
    const manualRef = useRef<HTMLInputElement>(null);

    const handleDecode = useCallback(
        (code: string) => {
            setLastDecoded(code);
            setScanFlash(true);
            setCameraError(null);
            setTimeout(() => setScanFlash(false), 500);
            onDecode(code);
        },
        [onDecode],
    );

    const { startScanner, stopScanner } = useScanner({
        onDecode: handleDecode,
        onError: (msg) => {
            // Only show genuine camera errors (permission denied, device not found)
            // — NotFoundException is already filtered in the hook
            if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('device')) {
                setCameraError(msg);
            }
        },
    });

    useEffect(() => {
        if (!active || !videoRef.current) return;
        setCameraError(null);
        startScanner(videoRef.current, facingMode).catch((err: Error) => {
            setCameraError(err.message);
        });
        return () => stopScanner();
    }, [active, facingMode, startScanner, stopScanner]);

    const handleManualSubmit = () => {
        const val = manualInput.trim();
        if (!val) return;
        handleDecode(val);
        setManualInput('');
        manualRef.current?.focus();
    };

    const switchFacing = () =>
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));

    return (
        <div className="flex flex-col gap-3">
            {/* Camera preview */}
            <div className={`scanner-container transition-all ${scanFlash ? 'ring-4 ring-green-400' : ''}`}>
                <video ref={videoRef} muted playsInline autoPlay />

                <div className="scanner-overlay">
                    <div className="viewfinder"><span /></div>
                    <div className="scan-line" />
                </div>

                {/* Camera switch */}
                <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem' }}>
                    <button
                        onClick={switchFacing}
                        style={{
                            borderRadius: '0.5rem',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            color: '#fff',
                            backdropFilter: 'blur(4px)',
                            border: 'none',
                            cursor: 'pointer',
                            minHeight: '36px',
                        }}
                        aria-label="Switch camera"
                    >
                        {facingMode === 'environment' ? 'Front' : 'Rear'}
                    </button>
                </div>

                {/* Permission / device error only */}
                {cameraError && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                    }}>
                        <p style={{
                            maxWidth: '80%', borderRadius: '0.5rem',
                            background: '#b91c1c', padding: '0.75rem 1rem',
                            textAlign: 'center', fontSize: '0.875rem', color: '#fff',
                        }}>
                            {cameraError.includes('Permission')
                                ? 'Camera permission denied. Please allow camera access in your browser settings.'
                                : `Camera unavailable: ${cameraError}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Last decoded */}
            {lastDecoded && (
                <p style={{
                    borderRadius: '0.5rem', border: '1px solid #6ee7b7',
                    background: '#ecfdf5', padding: '0.5rem 0.75rem',
                    fontFamily: 'monospace', fontSize: '0.75rem', color: '#065f46',
                }}>
                    Decoded: {lastDecoded.length > 60 ? `${lastDecoded.slice(0, 60)}…` : lastDecoded}
                </p>
            )}

            {/* Manual entry fallback */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    ref={manualRef}
                    className="input"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}
                    placeholder="Manual code entry (paste or type)…"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button className="btn-secondary" onClick={handleManualSubmit}>
                    Add
                </button>
            </div>
        </div>
    );
}
