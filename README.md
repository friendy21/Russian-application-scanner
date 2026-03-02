# Chestny ZNAK — Carton Compliance System

DataMatrix carton aggregation and verification PWA built for Russian export compliance (Честный ЗНАК / CRPT track-and-trace mandate).

## Features

- Camera-based DataMatrix / QR / Code128 scanning with full UTF-8 / Cyrillic support
- 30-pouch aggregation per carton (configurable 5–100) with duplicate prevention
- Master QR Code generation with JSON payload — download 300 dpi PNG
- Dispatch verification — scan Master QR, verify each pouch, PASS / FAIL result
- Offline-first — all data in IndexedDB via Dexie.js, no backend required
- Excel export — two-sheet .xlsx (Carton Summary + Pouch Detail) with styled headers
- Installable PWA (Android Chrome 110+, iOS Safari 16.4+)
- Dark mode, mobile-first layout, 48px touch targets for glove use

---

## Tech Stack

| Layer | Package |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 |
| Scanning | @zxing/browser |
| Database | dexie (IndexedDB) |
| Excel | xlsx (SheetJS) |
| QR Generation | qr-code-styling |
| State | zustand |
| PWA | vite-plugin-pwa + Workbox |
| Container | Docker + Nginx |

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

> **Camera access requires HTTPS** in production. For local testing, Chrome allows `localhost` over HTTP.

---

## Production Build

```bash
npm run build
```

---

## Docker Deploy

```bash
docker compose up --build -d
```

Serves on port 80. Nginx includes COOP/COEP headers required for ZXing WASM.

---

## Environment Variables

No environment variables are required for Phase 1. All data is stored client-side in IndexedDB.

Phase 2 will add `VITE_CRPT_CLIENT_ID` and `VITE_CRPT_CLIENT_SECRET` for Chestny ZNAK API.

---

## Operational Guide

### 1. Set Operator
Open Settings → enter your name → Save.

### 2. Scan & Pack
1. Scan & Pack tab → Start New Carton Session
2. Point camera at each pouch cap DataMatrix code
3. Manual fallback: type/paste in the input box and tap Add
4. To remove a mis-scan: tap the X next to the code
5. At target count: Seal Carton & Generate Master QR → confirm → print/download QR

### 3. Dispatch Verification
1. Verify tab → scan the Master QR on the carton lid
2. Scan each pouch — green tick = match, red X = mismatch
3. View PASS / FAIL result → commit to database

### 4. Records & Export
Records tab → set date range → Export Excel

---

## Database Backup

Settings → Export Full Database (JSON) / Import / Restore from JSON

---

## QR Payload Format

```json
{
  "v": 1,
  "cid": "CARTON-20250303-0001",
  "ts": "2025-03-03T05:00:00.000Z",
  "codes": ["<code1>", "...", "<code30>"]
}
```

Max payload ~4,296 bytes (QR Version 40, ECL M). 30 codes × 80 chars = ~2,600 bytes.

---

## Cyrillic / DataMatrix Notes

Standard hardware scanners output raw bytes in CP1251/CP866, garbling Cyrillic UTF-8 DataMatrix data.  
`@zxing/browser` decodes DataMatrix in-browser via WASM with explicit UTF-8 charset — no hardware reconfiguration needed.
