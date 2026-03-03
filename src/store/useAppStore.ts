import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scan } from '../db/dexie';

export type AppTab = 'pack' | 'verify' | 'lookup' | 'records' | 'settings';


export interface ToastItem {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

interface AppState {
    // Persistent settings
    operator: string;
    cartonSize: number;
    darkMode: boolean;

    // Session state
    activeCartonId: string | null;
    scannedCodes: Scan[];
    currentTab: AppTab;
    toasts: ToastItem[];

    // Verify session
    verifyCartonId: string | null;
    verifyExpectedCodes: string[];
    verifyScannedCodes: { code: string; matched: boolean }[];

    // Actions — Settings
    setOperator: (name: string) => void;
    setCartonSize: (size: number) => void;
    toggleDarkMode: () => void;

    // Actions — Session
    setActiveCarton: (carton_id: string) => void;
    setScannedCodes: (codes: Scan[]) => void;
    addScannedCode: (scan: Scan) => void;
    removeScannedCode: (id: number) => void;
    resetCartonSession: () => void;
    setCurrentTab: (tab: AppTab) => void;

    // Actions — Verify
    startVerifySession: (carton_id: string, expectedCodes: string[]) => void;
    addVerifyCode: (code: string) => void;
    resetVerifySession: () => void;

    // Actions — Toasts
    showToast: (type: ToastItem['type'], message: string) => void;
    dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Defaults
            operator: '',
            cartonSize: 30,
            darkMode: false,
            activeCartonId: null,
            scannedCodes: [],
            currentTab: 'pack',
            toasts: [],
            verifyCartonId: null,
            verifyExpectedCodes: [],
            verifyScannedCodes: [],

            setOperator: (name) => set({ operator: name }),
            setCartonSize: (size) => set({ cartonSize: size }),
            toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

            setActiveCarton: (carton_id) => set({ activeCartonId: carton_id }),
            setScannedCodes: (codes) => set({ scannedCodes: codes }),
            addScannedCode: (scan) => set((s) => ({ scannedCodes: [...s.scannedCodes, scan] })),
            removeScannedCode: (id) =>
                set((s) => ({ scannedCodes: s.scannedCodes.filter((c) => c.id !== id) })),
            resetCartonSession: () => set({ activeCartonId: null, scannedCodes: [] }),
            setCurrentTab: (tab) => set({ currentTab: tab }),

            startVerifySession: (carton_id, expectedCodes) =>
                set({ verifyCartonId: carton_id, verifyExpectedCodes: expectedCodes, verifyScannedCodes: [] }),
            addVerifyCode: (code) => {
                const expected = get().verifyExpectedCodes;
                const matched = expected.includes(code);
                set((s) => ({
                    verifyScannedCodes: [...s.verifyScannedCodes, { code, matched }],
                }));
            },
            resetVerifySession: () =>
                set({ verifyCartonId: null, verifyExpectedCodes: [], verifyScannedCodes: [] }),

            showToast: (type, message) => {
                const id = `${Date.now()}-${Math.random()}`;
                set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
                setTimeout(() => get().dismissToast(id), 4000);
            },
            dismissToast: (id) =>
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        }),
        {
            name: 'carton-app-settings',
            partialize: (state) => ({
                operator: state.operator,
                cartonSize: state.cartonSize,
                darkMode: state.darkMode,
            }),
        },
    ),
);
