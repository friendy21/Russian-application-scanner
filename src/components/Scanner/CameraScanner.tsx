import { useRef, useState, useEffect, useCallback } from 'react';
import { useScanner } from '../../hooks/useScanner';

interface CameraScannerProps {
    onDecode: (code: string) => void;
    active?: boolean;
}

export function CameraScanner({ onDecode, active = true }: CameraScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);
    const [manualInput, setManualInput] = useState('');
    const [lastDecoded, setLastDecoded] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanFlash, setScanFlash] = useState(false);
    const manualRef = useRef<HTMLInputElement>(null);

    const handleDecode = useCallback(
        (code: string) => {
            setLastDecoded(code);
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 500);
            onDecode(code);
        },
        [onDecode],
    );

    const { startScanner, stopScanner, getDevices } = useScanner({
        onDecode: handleDecode,
        onError: (err) => {
            if (!err.message.includes('NotFoundException')) {
                setCameraError(err.message);
            }
        },
    });

    useEffect(() => {
        getDevices().then((devs) => {
            setDevices(devs);
            // Prefer rear camera by default
            const rear = devs.find((d) => /back|rear|environment/i.test(d.label));
            setSelectedDevice(rear?.deviceId ?? devs[0]?.deviceId);
        });
    }, [getDevices]);

    useEffect(() => {
        if (!active || !videoRef.current) return;
        if (selectedDevice !== undefined || devices.length > 0) {
            startScanner(videoRef.current, selectedDevice).catch((err) =>
                setCameraError(err.message),
            );
        }
        return () => stopScanner();
    }, [active, selectedDevice, devices, startScanner, stopScanner]);

    const handleManualSubmit = () => {
        const val = manualInput.trim();
        if (!val) return;
        handleDecode(val);
        setManualInput('');
        manualRef.current?.focus();
    };

    const switchCamera = () => {
        const idx = devices.findIndex((d) => d.deviceId === selectedDevice);
        const next = devices[(idx + 1) % devices.length];
        if (next) setSelectedDevice(next.deviceId);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Camera preview */}
            <div className={`scanner-container ${scanFlash ? 'ring-4 ring-green-400' : ''} transition-all`}>
                <video ref={videoRef} muted playsInline autoPlay />

                <div className="scanner-overlay">
                    {/* Viewfinder corners */}
                    <div className="viewfinder">
                        <span />
                    </div>
                    {/* Animated scan line */}
                    <div className="scan-line" />
                </div>

                {/* Camera controls overlay */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                    {devices.length > 1 && (
                        <button
                            onClick={switchCamera}
                            className="rounded-lg bg-black/60 px-3 py-2 text-xs text-white backdrop-blur-sm"
                            aria-label="Switch camera"
                        >
                            Flip
                        </button>
                    )}
                </div>

                {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <p className="max-w-[80%] rounded bg-red-700 px-4 py-3 text-center text-sm text-white">
                            Camera error: {cameraError}
                        </p>
                    </div>
                )}
            </div>

            {/* Camera selector */}
            {devices.length > 1 && (
                <select
                    className="input text-xs"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                >
                    {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                        </option>
                    ))}
                </select>
            )}

            {/* Last decoded */}
            {lastDecoded && (
                <p className="rounded border border-green-300 bg-green-50 px-3 py-2 font-mono text-xs text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                    Decoded: {lastDecoded.slice(0, 60)}{lastDecoded.length > 60 ? '…' : ''}
                </p>
            )}

            {/* Manual entry fallback */}
            <div className="flex gap-2">
                <input
                    ref={manualRef}
                    className="input flex-1 font-mono text-sm"
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
