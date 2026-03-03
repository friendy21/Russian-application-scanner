/**
 * GS1 DataMatrix parser for Chestny ZNAK (CRPT) product codes.
 *
 * Real product DataMatrix codes use GS1 Application Identifiers (AIs):
 *   01 = GTIN-14
 *   21 = Serial number
 *   91 = Verification key
 *   92 = Cryptographic signature
 *
 * Fields are separated by GS (ASCII 0x1D) when not fixed-length,
 * or by the next numeric AI prefix otherwise.
 */

export interface GS1DataMatrix {
    gtin?: string;         // 14-digit GTIN
    ean13?: string;        // GTIN-14 trimmed to EAN-13 (drop leading zero)
    serial?: string;       // AI 21
    verifyKey?: string;    // AI 91
    cryptoCode?: string;   // AI 92
    raw: string;
}

const GS = '\u001d'; // Group Separator

export function parseGS1DataMatrix(raw: string): GS1DataMatrix {
    const result: GS1DataMatrix = { raw };

    // Normalise — replace common GS encodings
    const normalised = raw
        .replace(/\x1d/g, GS)   // actual GS
        .replace(/<GS>/g, GS)    // some scanners encode as <GS>
        .replace(/\(([0-9]{2})\)/g, '$1'); // (01) → 01

    // Split by GS and parse each segment
    const segments = normalised.split(GS);

    for (const segment of segments) {
        if (segment.startsWith('01') && segment.length >= 16) {
            result.gtin = segment.slice(2, 16);
            result.ean13 = result.gtin.startsWith('0')
                ? result.gtin.slice(1)
                : result.gtin;
        } else if (segment.startsWith('21')) {
            result.serial = segment.slice(2);
        } else if (segment.startsWith('91')) {
            result.verifyKey = segment.slice(2);
        } else if (segment.startsWith('92')) {
            result.cryptoCode = segment.slice(2);
        }
    }

    // Try inline parsing if no GS separators found (compact format)
    if (!result.gtin && normalised.startsWith('01')) {
        result.gtin = normalised.slice(2, 16);
        result.ean13 = result.gtin.startsWith('0') ? result.gtin.slice(1) : result.gtin;
        const rest = normalised.slice(16);
        if (rest.startsWith('21')) {
            const serialEnd = rest.indexOf('91');
            result.serial = serialEnd !== -1 ? rest.slice(2, serialEnd) : rest.slice(2);
            if (serialEnd !== -1) {
                const remainder = rest.slice(serialEnd);
                const cryptoStart = remainder.indexOf('92');
                result.verifyKey = cryptoStart !== -1 ? remainder.slice(2, cryptoStart) : remainder.slice(2);
                if (cryptoStart !== -1) {
                    result.cryptoCode = remainder.slice(cryptoStart + 2);
                }
            }
        }
    }

    return result;
}

export function isValidGs1(parsed: GS1DataMatrix): boolean {
    return !!parsed.gtin && parsed.gtin.length === 14;
}
