import type { GS1DataMatrix } from './gs1Parser';

export interface ProductInfo {
    gtin: string;
    name: string;           // English name (translated if needed)
    nameRu?: string;        // Original Russian name in Cyrillic — ALWAYS populate if available
    brand?: string;
    brandRu?: string;
    category?: string;
    categoryRu?: string;
    imageUrl?: string;
    source: 'crpt' | 'openfoodfacts' | 'gtin-only' | 'unknown';
    status: 'found' | 'not_found' | 'error';
    statusDetail?: string;
}

/**
 * MyMemory — free translation API, no key, CORS-friendly (rate limited: 5000 words/day)
 * Only translates if Cyrillic characters are present.
 */
export async function translateToEnglish(text: string): Promise<string> {
    if (!text?.trim()) return text;
    if (!/[\u0400-\u04FF]/.test(text)) return text; // Already English

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=ru|en`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return text;
        const data = await res.json();
        const translated: string = data?.responseData?.translatedText ?? text;
        return translated && translated !== text ? translated : text;
    } catch {
        return text;
    }
}

/**
 * CRPT / Chestny ZNAK public product lookup.
 * Uses the public barcode info endpoint — no API key required.
 * Best coverage for Russian GTINs (460xxxxx, 469xxxxx prefixes).
 *
 * NOTE: The CRPT API may block CORS from browser origins.
 * If blocked, add a comment and the result will be null — Open Food Facts
 * will serve as fallback. A backend proxy can be added later to guarantee access.
 * If the response schema differs from expected, check console.log(data) below.
 */
async function lookupCRPT(gtin: string): Promise<ProductInfo | null> {
    const endpoints = [
        `https://честныйзнак.рф/api/v3/facade/product/info?gtin=${gtin}`,
        `https://xn--e1agkfkfn4b.xn--p1ai/api/v3/facade/product/info?gtin=${gtin}`,
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(7000),
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) continue;
            const data = await res.json();

            // NOTE: Log actual response to diagnose schema on first run
            console.log('[CRPT] response for GTIN', gtin, data);

            // CRPT response shape: { productName, brandName, inn, ... }
            // Schema may vary — adjust field names based on console output above
            const nameRu: string = data?.productName || data?.name || '';
            const brandRu: string = data?.brandName || data?.brand || '';

            if (!nameRu) continue;

            const [nameEn, brandEn, categoryEn] = await Promise.all([
                translateToEnglish(nameRu),
                translateToEnglish(brandRu),
                translateToEnglish(data?.category || ''),
            ]);

            return {
                gtin,
                name: nameEn || nameRu,        // English first, Russian fallback
                nameRu: nameRu,                // Always preserve original Cyrillic
                brand: brandEn || brandRu || undefined,
                brandRu: brandRu || undefined,
                category: categoryEn || undefined,
                imageUrl: data?.imageUrl || data?.image || undefined,
                source: 'crpt',
                status: 'found',
            };
        } catch {
            // Try next endpoint (CORS block or network error)
        }
    }
    return null;
}

/**
 * Open Food Facts — free, public, CORS enabled.
 * Secondary lookup — good for international products, limited Russian coverage.
 */
async function lookupOpenFoodFacts(gtin: string): Promise<ProductInfo | null> {
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
            // Prefer Russian name, fall back to any available name
            const nameRu: string = p.product_name_ru || '';
            const nameAny: string = p.product_name_en || p.product_name || p.abbreviated_product_name || '';

            if (!nameRu && !nameAny) continue;

            const [nameEn, categoryEn] = await Promise.all([
                nameRu ? translateToEnglish(nameRu) : Promise.resolve(nameAny),
                translateToEnglish(p.categories || ''),
            ]);

            return {
                gtin,
                name: nameEn || nameAny,       // English display name
                nameRu: nameRu || undefined,   // Cyrillic original (if available)
                brand: p.brands || undefined,
                category: categoryEn || undefined,
                imageUrl: p.image_front_small_url || p.image_url || undefined,
                source: 'openfoodfacts',
                status: 'found',
            };
        } catch {
            // Network error — try next code variant
        }
    }
    return null;
}

/**
 * Master product lookup — tries CRPT first (best for Russian items),
 * then Open Food Facts, then returns GTIN-only fallback.
 */
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

    // 1. Try CRPT (best Russian coverage)
    const crptResult = await lookupCRPT(parsed.gtin);
    if (crptResult) return crptResult;

    // 2. Try Open Food Facts (international fallback)
    const offResult = await lookupOpenFoodFacts(parsed.gtin);
    if (offResult) return offResult;

    // 3. GTIN known but product not in any database
    return {
        gtin: parsed.gtin,
        name: `GTIN ${parsed.gtin}`,
        source: 'gtin-only',
        status: 'not_found',
        statusDetail: 'GTIN parsed but product not found in CRPT or Open Food Facts',
    };
}
