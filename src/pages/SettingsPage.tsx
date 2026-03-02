import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { exportAllJson, importFromJson } from '../db/helpers';

export function SettingsPage() {
    const {
        operator,
        cartonSize,
        darkMode,
        setOperator,
        setCartonSize,
        toggleDarkMode,
        showToast,
    } = useAppStore();

    const [operatorInput, setOperatorInput] = useState(operator);
    const [sizeInput, setSizeInput] = useState(cartonSize);

    const handleSave = () => {
        setOperator(operatorInput.trim());
        setCartonSize(sizeInput);
        showToast('success', 'Settings saved');
    };

    const handleExportDb = async () => {
        try {
            const json = await exportAllJson();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CartonDB_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('success', 'Database exported');
        } catch {
            showToast('error', 'Export failed');
        }
    };

    const handleImportDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            await importFromJson(text);
            showToast('success', 'Database restored successfully');
        } catch {
            showToast('error', 'Import failed — invalid JSON backup');
        }
        e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Operator */}
            <div className="card flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Operator</h2>
                <input
                    className="input"
                    placeholder="Operator name"
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                />
            </div>

            {/* Carton size */}
            <div className="card flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Carton Size — <span className="text-brand-700 dark:text-brand-400">{sizeInput} pouches</span>
                </h2>
                <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={sizeInput}
                    onChange={(e) => setSizeInput(Number(e.target.value))}
                    className="w-full accent-brand-700"
                />
                <div className="flex justify-between text-xs text-slate-400">
                    <span>5</span>
                    <span>100</span>
                </div>
            </div>

            {/* Dark mode */}
            <div className="card flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dark Mode</span>
                <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-brand-700' : 'bg-slate-300'
                        }`}
                    role="switch"
                    aria-checked={darkMode}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            <button className="btn-primary w-full" onClick={handleSave}>
                Save Settings
            </button>

            {/* Database backup */}
            <div className="card flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Database Backup</h2>
                <button className="btn-secondary w-full" onClick={handleExportDb}>
                    Export Full Database (JSON)
                </button>
                <label className="btn-secondary flex w-full cursor-pointer items-center justify-center">
                    Import / Restore from JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleImportDb} />
                </label>
            </div>

            {/* Phase 2 — API stub */}
            <div className="card flex flex-col gap-3 opacity-60">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chestny ZNAK API <span className="ml-2 badge-info">Phase 2</span>
                </h2>
                <input className="input" placeholder="Client ID" disabled />
                <input className="input" placeholder="Client Secret" type="password" disabled />
                <p className="text-xs text-slate-400">API verification integration is planned for Phase 2.</p>
            </div>
        </div>
    );
}
