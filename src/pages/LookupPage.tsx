import { useState, useCallback } from 'react';
import { CameraScanner } from '../components/Scanner/CameraScanner';
import { useAppStore } from '../store/useAppStore';
import { parseGS1DataMatrix, isValidGs1 } from '../utils/gs1Parser';
import { lookupProduct, type ProductInfo } from '../utils/productLookup';
import { saveProductLookup, getProductLookups } from '../db/helpers';
import type { ProductLookup } from '../db/dexie';
import { useEffect } from 'react';

interface LookupResult {
    parsed: ReturnType<typeof parseGS1DataMatrix>;
    product: ProductInfo;
    savedAt: string;
}

export function LookupPage() {
    const { operator, showToast } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [current, setCurrent] = useState<LookupResult | null>(null);
    const [history, setHistory] = useState<ProductLookup[]>([]);
    const [scanActive, setScanActive] = useState(true);

    const loadHistory = async () => {
        const records = await getProductLookups();
        setHistory(records.slice(0, 50));
    };

    useEffect(() => { loadHistory(); }, []);

    const handleScan = useCallback(async (raw: string) => {
        if (loading) return;
        setScanActive(false);
        setLoading(true);

        try {
            const parsed = parseGS1DataMatrix(raw);

            if (!isValidGs1(parsed)) {
                showToast('warning', `Not a GS1 DataMatrix. Decoded: "${raw.slice(0, 50)}"`);
                setLoading(false);
                setScanActive(true);
                return;
            }

            const product = await lookupProduct(parsed);

            const record = await saveProductLookup({
                raw_code: raw,
                gtin: parsed.gtin,
                serial: parsed.serial,
                product_name_en: product.name,
                product_name_ru: product.nameRu,
                brand: product.brand,
                category: product.category,
                image_url: product.imageUrl,
                source: product.source,
                status: product.status,
                status_detail: product.statusDetail,
                operator: operator || undefined,
                scanned_at: new Date().toISOString(),
            });

            setCurrent({ parsed, product, savedAt: record.scanned_at });
            await loadHistory();
            showToast('success', product.status === 'found' ? `Found: ${product.name}` : 'GTIN parsed — product not in database');
        } catch (err) {
            showToast('error', `Lookup failed: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, [loading, operator, showToast]);

    const handleReset = () => {
        setCurrent(null);
        setScanActive(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            {/* Scanner */}
            {scanActive && !loading && (
                <CameraScanner onDecode={handleScan} active={scanActive && !loading} />
            )}

            {loading && (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Looking up product information…</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>Querying Open Food Facts + translating</p>
                </div>
            )}

            {/* Result card */}
            {current && !loading && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Product image */}
                    {current.product.imageUrl && (
                        <img
                            src={current.product.imageUrl}
                            alt={current.product.name}
                            style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '0.5rem', background: '#f8fafc' }}
                        />
                    )}

                    {/* Status badge */}
                    <span className={current.product.status === 'found' ? 'badge-success' : current.product.status === 'not_found' ? 'badge-warn' : 'badge-error'}>
                        {current.product.status === 'found' ? 'Product Found' : current.product.status === 'not_found' ? 'GTIN Known — Product Not in DB' : 'Error'}
                    </span>

                    {/* Product name */}
                    <div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Product Name (English)</p>
                        <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>{current.product.name}</p>
                        {current.product.nameRu && (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{current.product.nameRu}</p>
                        )}
                    </div>

                    {/* Details grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[
                            { label: 'GTIN-14', value: current.parsed.gtin },
                            { label: 'EAN-13', value: current.parsed.ean13 },
                            { label: 'Brand', value: current.product.brand },
                            { label: 'Category', value: current.product.category },
                            { label: 'Serial', value: current.parsed.serial?.slice(0, 16) },
                            { label: 'Source', value: current.product.source },
                        ].filter(f => f.value).map(f => (
                            <div key={f.label} style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.5rem' }}>
                                <p style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</p>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', fontFamily: 'monospace', wordBreak: 'break-all' }}>{f.value}</p>
                            </div>
                        ))}
                    </div>

                    {current.product.statusDetail && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{current.product.statusDetail}</p>
                    )}

                    <button className="btn-primary" onClick={handleReset}>
                        Scan Next Code
                    </button>
                </div>
            )}

            {/* Scan history */}
            {history.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: 600 }}>
                        Recent Lookups
                    </p>
                    {history.map((h) => (
                        <div key={h.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {h.product_name_en}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                    {h.gtin} &bull; {new Date(h.scanned_at).toLocaleString()}
                                </p>
                            </div>
                            <span className={h.status === 'found' ? 'badge-success' : 'badge-warn'} style={{ flexShrink: 0 }}>
                                {h.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
