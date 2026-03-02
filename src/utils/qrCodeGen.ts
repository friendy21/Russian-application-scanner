import QRCodeStyling from 'qr-code-styling';

export interface CartonPayload {
    v: number;
    cid: string;
    ts: string;
    codes: string[];
}

export function buildPayload(carton_id: string, codes: string[]): CartonPayload {
    return {
        v: 1,
        cid: carton_id,
        ts: new Date().toISOString(),
        codes,
    };
}

export function serializePayload(payload: CartonPayload): string {
    return JSON.stringify(payload);
}

export function parsePayload(raw: string): CartonPayload {
    const data = JSON.parse(raw);
    if (data.v !== 1 || !data.cid || !Array.isArray(data.codes)) {
        throw new Error('Invalid carton QR payload');
    }
    return data as CartonPayload;
}

export function createQRInstance(data: string): QRCodeStyling {
    return new QRCodeStyling({
        width: 400,
        height: 400,
        type: 'svg',
        data,
        image: undefined,
        dotsOptions: {
            color: '#0f172a',
            type: 'rounded',
        },
        backgroundOptions: {
            color: '#ffffff',
        },
        cornersSquareOptions: {
            color: '#1e3a8a',
            type: 'extra-rounded',
        },
        cornersDotOptions: {
            color: '#2563eb',
        },
        qrOptions: {
            errorCorrectionLevel: 'M',
        },
    });
}

/** Download QR as PNG at ~300 dpi (1200×1200px at 96dpi base) */
export async function downloadQRAsPng(payload: string, filename: string): Promise<void> {
    const qr = new QRCodeStyling({
        width: 1200,
        height: 1200,
        type: 'canvas',
        data: payload,
        dotsOptions: { color: '#0f172a', type: 'rounded' },
        backgroundOptions: { color: '#ffffff' },
        cornersSquareOptions: { color: '#1e3a8a', type: 'extra-rounded' },
        cornersDotOptions: { color: '#2563eb' },
        qrOptions: { errorCorrectionLevel: 'M' },
    });
    await qr.download({ name: filename, extension: 'png' });
}
