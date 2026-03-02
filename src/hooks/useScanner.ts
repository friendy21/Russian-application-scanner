import { useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat, type Result } from '@zxing/library';
import { normaliseCode } from '../utils/cyrillicUtils';

interface UseScannerOptions {
    onDecode: (code: string) => void;
    onError?: (err: Error) => void;
    debounceMs?: number;
}

export interface ScannerControls {
    startScanner: (videoEl: HTMLVideoElement, deviceId?: string) => Promise<void>;
    stopScanner: () => void;
    getDevices: () => Promise<MediaDeviceInfo[]>;
}

export function useScanner({
    onDecode,
    onError,
    debounceMs = 1000,
}: UseScannerOptions): ScannerControls {
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const lastCodeRef = useRef<Map<string, number>>(new Map());
    const activeControlsRef = useRef<{ stop: () => void } | null>(null);

    // Clean up on unmount
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
        async (videoEl: HTMLVideoElement, deviceId?: string) => {
            // Stop any existing session
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
            readerRef.current = reader;

            try {
                const controls = await reader.decodeFromVideoDevice(
                    deviceId ?? undefined,
                    videoEl,
                    (result, err) => {
                        if (result) handleResult(result);
                        if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
                            onError?.(err as Error);
                        }
                    },
                );
                activeControlsRef.current = controls;
            } catch (err) {
                onError?.(err as Error);
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
