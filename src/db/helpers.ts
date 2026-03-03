import { db, type Carton, type Scan, type VerificationEvent, type ProductLookup } from './dexie';

// ─── Carton ID Generator ─────────────────────────────────────────────────────

export async function generateCartonId(): Promise<string> {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayPrefix = `CARTON-${datePart}-`;

    const existing = await db.cartons
        .where('carton_id')
        .startsWith(todayPrefix)
        .count();

    const seq = String(existing + 1).padStart(4, '0');
    return `${todayPrefix}${seq}`;
}

// ─── Carton CRUD ─────────────────────────────────────────────────────────────

export async function createCarton(operator: string, cartonSize: number): Promise<Carton> {
    const carton_id = await generateCartonId();
    const carton: Carton = {
        carton_id,
        created_at: new Date().toISOString(),
        status: 'packing',
        operator,
        carton_size: cartonSize,
    };
    const id = await db.cartons.add(carton);
    return { ...carton, id: id as number };
}

export async function getCarton(carton_id: string): Promise<Carton | undefined> {
    return db.cartons.where('carton_id').equals(carton_id).first();
}

export async function getAllCartons(): Promise<Carton[]> {
    return db.cartons.orderBy('created_at').reverse().toArray();
}

export async function getCartonsInRange(from: Date, to: Date): Promise<Carton[]> {
    const fromStr = from.toISOString();
    const toStr = to.toISOString();
    return db.cartons
        .where('created_at')
        .between(fromStr, toStr, true, true)
        .reverse()
        .sortBy('created_at');
}

export async function sealCarton(carton_id: string): Promise<void> {
    await db.cartons.where('carton_id').equals(carton_id).modify({
        sealed_at: new Date().toISOString(),
        status: 'sealed',
    });
}

export async function markVerified(carton_id: string, passed: boolean): Promise<void> {
    await db.cartons.where('carton_id').equals(carton_id).modify({
        verified_at: new Date().toISOString(),
        status: passed ? 'verified' : 'failed',
    });
}

// ─── Scan CRUD ────────────────────────────────────────────────────────────────

export async function addScan(carton_id: string, code: string, pouch_index: number): Promise<Scan> {
    const scan: Scan = {
        carton_id,
        pouch_index,
        code,
        scanned_at: new Date().toISOString(),
        verified: false,
    };
    const id = await db.scans.add(scan);
    return { ...scan, id: id as number };
}

export async function getScansByCarton(carton_id: string): Promise<Scan[]> {
    return db.scans.where('carton_id').equals(carton_id).sortBy('pouch_index');
}

export async function removeScan(id: number): Promise<void> {
    await db.scans.delete(id);
}

export async function markScanVerified(scan_id: number): Promise<void> {
    await db.scans.update(scan_id, { verified: true });
}

// ─── Verification Events ─────────────────────────────────────────────────────

export async function logVerificationEvent(
    carton_id: string,
    event_type: VerificationEvent['event_type'],
    code?: string,
): Promise<void> {
    await db.verification_events.add({
        carton_id,
        event_type,
        code,
        ts: new Date().toISOString(),
    });
}

// ─── Product Lookups ─────────────────────────────────────────────────────────

export async function saveProductLookup(lookup: Omit<ProductLookup, 'id'>): Promise<ProductLookup> {
    const id = await db.product_lookups.add(lookup);
    return { ...lookup, id: id as number };
}

export async function getProductLookups(): Promise<ProductLookup[]> {
    return db.product_lookups.orderBy('scanned_at').reverse().toArray();
}

export async function getProductLookupsInRange(from: Date, to: Date): Promise<ProductLookup[]> {
    const fromStr = from.toISOString();
    const toStr = to.toISOString();
    return db.product_lookups
        .where('scanned_at')
        .between(fromStr, toStr, true, true)
        .reverse()
        .sortBy('scanned_at');
}

// ─── JSON Backup / Restore ───────────────────────────────────────────────────

export async function exportAllJson(): Promise<string> {
    const [cartons, scans, verification_events, product_lookups] = await Promise.all([
        db.cartons.toArray(),
        db.scans.toArray(),
        db.verification_events.toArray(),
        db.product_lookups.toArray(),
    ]);
    return JSON.stringify({ cartons, scans, verification_events, product_lookups, exported_at: new Date().toISOString() }, null, 2);
}

export async function importFromJson(jsonStr: string): Promise<void> {
    const data = JSON.parse(jsonStr);
    await db.transaction('rw', db.cartons, db.scans, db.verification_events, db.product_lookups, async () => {
        if (data.cartons?.length) await db.cartons.bulkPut(data.cartons);
        if (data.scans?.length) await db.scans.bulkPut(data.scans);
        if (data.verification_events?.length) await db.verification_events.bulkPut(data.verification_events);
        if (data.product_lookups?.length) await db.product_lookups.bulkPut(data.product_lookups);
    });
}
