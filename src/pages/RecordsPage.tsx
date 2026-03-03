import { useState, useEffect, useCallback } from 'react';
import { RecordsTable } from '../components/RecordsTable/RecordsTable';
import { useAppStore } from '../store/useAppStore';
import { getCartonsInRange, getScansByCarton, getProductLookupsInRange } from '../db/helpers';
import { exportToExcel } from '../utils/excelExport';
import type { Carton, Scan } from '../db/dexie';

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function monthAgoStr() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
}

export function RecordsPage() {
    const showToast = useAppStore((s) => s.showToast);
    const [fromDate, setFromDate] = useState(monthAgoStr());
    const [toDate, setToDate] = useState(todayStr());
    const [cartons, setCartons] = useState<Carton[]>([]);
    const [exporting, setExporting] = useState(false);

    const loadCartons = useCallback(async () => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        const results = await getCartonsInRange(from, to);
        setCartons(results);
    }, [fromDate, toDate]);

    useEffect(() => {
        loadCartons();
    }, [loadCartons]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);

            const allScans: Scan[] = [];
            for (const c of cartons) {
                const scans = await getScansByCarton(c.carton_id);
                allScans.push(...scans);
            }
            const lookups = await getProductLookupsInRange(from, to);
            exportToExcel(cartons, allScans, lookups);
            showToast('success', `Excel exported — ${cartons.length} carton(s), ${lookups.length} lookup(s)`);
        } catch {
            showToast('error', 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <RecordsTable
                cartons={cartons}
                fromDate={fromDate}
                toDate={toDate}
                onFromChange={(v) => setFromDate(v)}
                onToChange={(v) => setToDate(v)}
                onExport={handleExport}
                exporting={exporting}
            />
        </div>
    );
}
