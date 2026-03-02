/**
 * Utilities for handling Cyrillic / UTF-8 encoded DataMatrix codes.
 * ZXing natively decodes UTF-8, so most helpers here are for
 * normalisation and display purposes.
 */

/**
 * Normalise a scanned code string:
 * - Trim whitespace
 * - Normalise Unicode to NFC (canonical composition)
 * - Remove invisible control characters except GS (0x1D) used in GS1 DataMatrix
 */
export function normaliseCode(raw: string): string {
    return raw
        .trim()
        .normalize('NFC')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1C\x1E-\x1F\x7F]/g, '');
}

/**
 * Returns true if the string contains Cyrillic characters.
 */
export function hasCyrillic(str: string): boolean {
    return /[\u0400-\u04FF]/.test(str);
}

/**
 * Truncate a code for display purposes.
 * DataMatrix codes from Chestny ZNAK can be very long (100+ chars).
 */
export function displayCode(code: string, maxLen = 40): string {
    if (code.length <= maxLen) return code;
    return `${code.slice(0, maxLen / 2)}…${code.slice(-maxLen / 2)}`;
}

/**
 * Encode a string to Base64 URL-safe without padding.
 * Used for embedding codes in URLs.
 */
export function toBase64Url(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
