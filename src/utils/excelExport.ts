import * as XLSX from 'xlsx';
import type { Carton, Scan, ProductLookup } from '../db/dexie';

function applyHeaderStyle() {
    return {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center' },
    };
}

function dateLabel(): string {
    return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
}

function styledSheet(headers: string[], rows: (string | number)[][], colWidths: number[]) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    headers.forEach((_, idx) => {
        const ref = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!ws[ref]) ws[ref] = {};
        ws[ref].s = applyHeaderStyle();
    });
    ws['!cols'] = colWidths.map((w) => ({ wch: w }));
    ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1` };
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    return ws;
}

export function exportToExcel(cartons: Carton[], scans: Scan[], productLookups: ProductLookup[] = []): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Carton Summary
    const summaryRows: (string | number)[][] = cartons.map((c) => {
        const count = scans.filter((s) => s.carton_id === c.carton_id).length;
        return [c.carton_id, count, c.created_at, c.sealed_at ?? '', c.verified_at ?? '', c.status, c.operator ?? ''];
    });
    XLSX.utils.book_append_sheet(wb,
        styledSheet(['Carton ID', 'Total Codes', 'Created Date', 'Sealed Date', 'Verified Date', 'Status', 'Operator'], summaryRows, [24, 12, 22, 22, 22, 12, 18]),
        'Carton Summary',
    );

    // Sheet 2: Pouch Detail
    const detailRows: (string | number)[][] = scans.map((s) => {
        const carton = cartons.find((c) => c.carton_id === s.carton_id);
        return [s.carton_id, s.pouch_index, s.code, s.scanned_at, s.verified ? 'YES' : 'NO', carton?.operator ?? ''];
    });
    XLSX.utils.book_append_sheet(wb,
        styledSheet(['Carton ID', 'Pouch #', 'DataMatrix Code', 'Scan Time (UTC)', 'Verified', 'Operator'], detailRows, [24, 8, 60, 22, 10, 18]),
        'Pouch Detail',
    );

    // Sheet 3: Product Lookups (from Chestny ZNAK / Open Food Facts)
    if (productLookups.length > 0) {
        const lookupRows: (string | number)[][] = productLookups.map((p) => [
            p.scanned_at,
            p.gtin ?? '',
            p.serial ?? '',
            p.product_name_en,
            p.product_name_ru ?? '',
            p.brand ?? '',
            p.category ?? '',
            p.status,
            p.source,
            p.operator ?? '',
        ]);
        XLSX.utils.book_append_sheet(wb,
            styledSheet(
                ['Scan Time (UTC)', 'GTIN-14', 'Serial', 'Product Name (EN)', 'Product Name (RU)', 'Brand', 'Category', 'Status', 'Source', 'Operator'],
                lookupRows,
                [22, 16, 20, 40, 40, 20, 30, 12, 16, 18],
            ),
            'Product Lookups',
        );
    }

    XLSX.writeFile(wb, `CartonManifest_${dateLabel()}.xlsx`, { bookSST: false });
}
