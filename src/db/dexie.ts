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

class CartonDatabase extends Dexie {
    cartons!: Table<Carton, number>;
    scans!: Table<Scan, number>;
    verification_events!: Table<VerificationEvent, number>;

    constructor() {
        super('ChestnyZnakDB');
        this.version(1).stores({
            cartons: '++id, carton_id, status, created_at, operator',
            scans: '++id, carton_id, pouch_index, code, verified',
            verification_events: '++id, carton_id, event_type, ts',
        });
    }
}

export const db = new CartonDatabase();
