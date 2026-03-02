import * as XLSX from 'xlsx';
import type { Carton, Scan } from '../db/dexie';

type HeaderStyle = {
    font: { bold: boolean; color: { rgb: string } };
    fill: { fgColor: { rgb: string } };
    alignment: { horizontal: string };
};

function applyHeaderStyle(): HeaderStyle {
    return {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center' },
    };
}

function dateLabel(): string {
    const now = new Date();
    return now
        .toISOString()
        .replace(/[-:T]/g, '')
        .slice(0, 15);
}

export function exportToExcel(cartons: Carton[], scans: Scan[]): void {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Carton Summary ──────────────────────────────────────────────
    const summaryHeaders = ['Carton ID', 'Total Codes', 'Created Date', 'Sealed Date', 'Verified Date', 'Status', 'Operator'];
    const summaryRows: (string | number)[][] = cartons.map((c) => {
        const cartonScans = scans.filter((s) => s.carton_id === c.carton_id);
        return [
            c.carton_id,
            cartonScans.length,
            c.created_at,
            c.sealed_at ?? '',
            c.verified_at ?? '',
            c.status,
            c.operator ?? '',
        ];
    });

    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);

    // Style header row
    summaryHeaders.forEach((_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!wsSummary[cellRef]) wsSummary[cellRef] = {};
        wsSummary[cellRef].s = applyHeaderStyle();
    });

    const summaryColWidths = [24, 12, 22, 22, 22, 12, 18];
    wsSummary['!cols'] = summaryColWidths.map((w) => ({ wch: w }));
    wsSummary['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(summaryHeaders.length - 1)}1` };
    wsSummary['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Carton Summary');

    // ── Sheet 2: Pouch Detail ─────────────────────────────────────────────────
    const detailHeaders = ['Carton ID', 'Pouch #', 'DataMatrix Code', 'Scan Time (UTC)', 'Verified', 'Operator'];
    const detailRows: (string | number | boolean)[][] = scans.map((s) => {
        const carton = cartons.find((c) => c.carton_id === s.carton_id);
        return [
            s.carton_id,
            s.pouch_index,
            s.code,
            s.scanned_at,
            s.verified ? 'YES' : 'NO',
            carton?.operator ?? '',
        ];
    });

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);

    detailHeaders.forEach((_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!wsDetail[cellRef]) wsDetail[cellRef] = {};
        wsDetail[cellRef].s = applyHeaderStyle();
    });

    const detailColWidths = [24, 8, 60, 22, 10, 18];
    wsDetail['!cols'] = detailColWidths.map((w) => ({ wch: w }));
    wsDetail['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(detailHeaders.length - 1)}1` };
    wsDetail['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, wsDetail, 'Pouch Detail');

    // ── Write File ────────────────────────────────────────────────────────────
    XLSX.writeFile(wb, `CartonManifest_${dateLabel()}.xlsx`, { bookSST: false });
}
