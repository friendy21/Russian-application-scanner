import type { GS1DataMatrix } from './gs1Parser';

export interface ProductInfo {
    gtin: string;
    name: string;           // English name
    nameRu?: string;        // Original Russian name if found
    brand?: string;
    category?: string;
    imageUrl?: string;
    source: 'openfoodfacts' | 'gtin-only' | 'unknown';
    status: 'found' | 'not_found' | 'error';
    statusDetail?: string;
}

/** Open Food Facts — free, public, CORS enabled */
async function lookupOpenFoodFacts(gtin: string): Promise<ProductInfo | null> {
    // Try GTIN-14, then EAN-13 (drop leading zero)
    const codes = [gtin];
    if (gtin.startsWith('0')) codes.push(gtin.slice(1));

    for (const code of codes) {
        try {
            const res = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
                { signal: AbortSignal.timeout(6000) },
            );
            if (!res.ok) continue;
            const data = await res.json();
            if (data.status !== 1 || !data.product) continue;

            const p = data.product;
            const nameRu: string =
                p.product_name_ru || p.product_name || p.abbreviated_product_name || '';
            const nameEn: string =
                p.product_name_en || p.product_name || '';

            return {
                gtin,
                name: nameEn || (await translateToEnglish(nameRu)) || nameRu || `GTIN ${gtin}`,
                nameRu: nameRu || undefined,
                brand: p.brands || undefined,
                category: await translateToEnglish(p.categories || ''),
                imageUrl: p.image_front_small_url || p.image_url || undefined,
                source: 'openfoodfacts',
                status: 'found',
            };
        } catch {
            // Network error for this code — try next
        }
    }
    return null;
}

/** MyMemory — free translation API, no key, CORS-friendly (rate limited: 5000 words/day) */
export async function translateToEnglish(text: string): Promise<string> {
    if (!text || !text.trim()) return text;
    // Skip if already looks like English (no Cyrillic)
    if (!/[\u0400-\u04FF]/.test(text)) return text;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=ru|en`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return text;
        const data = await res.json();
        const translated: string = data?.responseData?.translatedText ?? text;
        // MyMemory sometimes echoes back if confidence is low — return original if unchanged
        return translated && translated !== text ? translated : text;
    } catch {
        return text;
    }
}

export async function lookupProduct(parsed: GS1DataMatrix): Promise<ProductInfo> {
    if (!parsed.gtin) {
        return {
            gtin: '',
            name: 'Not a GS1 DataMatrix code',
            source: 'unknown',
            status: 'error',
            statusDetail: 'No GTIN found in scanned code',
        };
    }

    const found = await lookupOpenFoodFacts(parsed.gtin);
    if (found) return found;

    // GTIN known but product not in Open Food Facts
    return {
        gtin: parsed.gtin,
        name: `GTIN ${parsed.gtin}`,
        source: 'gtin-only',
        status: 'not_found',
        statusDetail: 'GTIN parsed but product not found in Open Food Facts database',
    };
}
