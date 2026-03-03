import { useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat, type Result } from '@zxing/library';
import { normaliseCode } from '../utils/cyrillicUtils';

interface UseScannerOptions {
    onDecode: (code: string) => void;
    onError?: (err: string) => void;
    debounceMs?: number;
}

export interface ScannerControls {
    startScanner: (videoEl: HTMLVideoElement, facingMode?: 'environment' | 'user') => Promise<void>;
    stopScanner: () => void;
    getDevices: () => Promise<MediaDeviceInfo[]>;
}

/** ZXing throws its own exception types — not subclasses of Error.
 *  NotFoundException fires every frame when no code is in view — this is normal, never show it. */
function isNotFound(err: unknown): boolean {
    if (!err) return true;
    const msg = (err as { message?: string })?.message ?? String(err);
    return (
        msg.includes('MultiFormatReader') ||
        msg.includes('NotFoundException') ||
        msg.toLowerCase().includes('no code') ||
        (err as { name?: string })?.name === 'NotFoundException'
    );
}

export function useScanner({
    onDecode,
    onError,
    debounceMs = 1000,
}: UseScannerOptions): ScannerControls {
    const lastCodeRef = useRef<Map<string, number>>(new Map());
    const activeControlsRef = useRef<{ stop: () => void } | null>(null);

    useEffect(() => {
        return () => {
            activeControlsRef.current?.stop();
        };
    }, []);

    const handleResult = useCallback(
        (result: Result | null) => {
            if (!result) return;
            const raw = result.getText();
            const code = normaliseCode(raw);
            if (!code) return;

            const now = Date.now();
            const lastSeen = lastCodeRef.current.get(code) ?? 0;
            if (now - lastSeen < debounceMs) return;

            lastCodeRef.current.set(code, now);
            onDecode(code);
        },
        [onDecode, debounceMs],
    );

    const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        return devices;
    }, []);

    const startScanner = useCallback(
        async (videoEl: HTMLVideoElement, facingMode: 'environment' | 'user' = 'environment') => {
            activeControlsRef.current?.stop();

            const hints = new Map<DecodeHintType, unknown>();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                BarcodeFormat.DATA_MATRIX,
                BarcodeFormat.QR_CODE,
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
            ]);
            hints.set(DecodeHintType.TRY_HARDER, true);
            hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');

            const reader = new BrowserMultiFormatReader(hints);

            // High-resolution rear camera constraints — critical for small DataMatrix on bottle caps
            const videoConstraints: MediaTrackConstraints = {
                facingMode: { ideal: facingMode },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                // focusMode is a non-standard extension supported by Android Chrome
                ...(({ focusMode: { ideal: 'continuous' } }) as Record<string, unknown>),
            };
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false,
            }).catch(() =>
                navigator.mediaDevices.getUserMedia({ video: { facingMode } })
            );

            videoEl.srcObject = stream;
            await videoEl.play();

            try {
                const controls = await reader.decodeFromStream(
                    stream,
                    videoEl,
                    (result, err) => {
                        if (result) handleResult(result);
                        // Suppress NotFoundException — fires every frame with no code present
                        if (err && !isNotFound(err)) {
                            onError?.(String((err as { message?: string })?.message ?? err));
                        }
                    },
                );
                activeControlsRef.current = {
                    stop: () => {
                        controls.stop();
                        stream.getTracks().forEach((t) => t.stop());
                    },
                };
            } catch (err) {
                stream.getTracks().forEach((t) => t.stop());
                if (!isNotFound(err)) {
                    onError?.(String((err as { message?: string })?.message ?? err));
                }
            }
        },
        [handleResult, onError],
    );

    const stopScanner = useCallback(() => {
        activeControlsRef.current?.stop();
        activeControlsRef.current = null;
    }, []);

    return { startScanner, stopScanner, getDevices };
}
