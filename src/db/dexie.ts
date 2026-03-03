import Dexie, { type Table } from 'dexie';

export interface Carton {
    id?: number;
    carton_id: string;
    created_at: string;
    sealed_at?: string;
    verified_at?: string;
    status: 'packing' | 'sealed' | 'verified' | 'failed';
    operator?: string;
    carton_size: number;
}

export interface Scan {
    id?: number;
    carton_id: string;
    pouch_index: number;
    code: string;
    scanned_at: string;
    verified: boolean;
}

export interface VerificationEvent {
    id?: number;
    carton_id: string;
    event_type: 'match' | 'mismatch' | 'start' | 'complete';
    code?: string;
    ts: string;
}

export interface ProductLookup {
    id?: number;
    raw_code: string;
    gtin?: string;
    serial?: string;
    product_name_en: string;
    product_name_ru?: string;
    brand?: string;
    category?: string;
    image_url?: string;
    source: string;
    status: string;
    status_detail?: string;
    operator?: string;
    scanned_at: string;
}

class CartonDatabase extends Dexie {
    cartons!: Table<Carton, number>;
    scans!: Table<Scan, number>;
    verification_events!: Table<VerificationEvent, number>;
    product_lookups!: Table<ProductLookup, number>;

    constructor() {
        super('ChestnyZnakDB');
        this.version(1).stores({
            cartons: '++id, carton_id, status, created_at, operator',
            scans: '++id, carton_id, pouch_index, code, verified',
            verification_events: '++id, carton_id, event_type, ts',
        });
        // Version 2 adds product_lookups table
        this.version(2).stores({
            cartons: '++id, carton_id, status, created_at, operator',
            scans: '++id, carton_id, pouch_index, code, verified',
            verification_events: '++id, carton_id, event_type, ts',
            product_lookups: '++id, gtin, raw_code, scanned_at, operator',
        });
    }
}

export const db = new CartonDatabase();
