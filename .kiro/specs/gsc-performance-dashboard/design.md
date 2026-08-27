# Design Document — GSC Performance Dashboard

## Overview

Fitur ini mengintegrasikan Google Search Console (GSC) ke dalam Marketing ERP yang sudah ada dengan menambahkan tiga bagian baru yang saling terhubung:

1. **Backend router** (`routes/gsc.js`) — endpoint aman yang mengautentikasi ke Google Cloud via Service Account dan meneruskan data GSC ke frontend.
2. **Frontend API methods** (`services/api.js`) — `getGscSites()` dan `getGscAnalytics()` yang mengabstraksi pemanggilan HTTP.
3. **Frontend component** (`components/GscDashboardPanel.jsx`) — panel visualisasi lengkap dengan dropdown site, filter range/searchType, dan LineChart recharts.

Tidak ada perubahan pada file yang sudah ada (seo.js, SeoInteractiveForm.jsx, method SEO di api.js) kecuali penambahan minimal di `server.js` (satu baris `app.use`) dan `App.jsx` (import, menu item, tab button, render block).

---

## Architecture

### Alur Data (Happy Path)

```
Operator (Browser)
  │
  ▼
App.jsx — klik "GSC Dashboard" → setCurrentView('digital-marketing'), setDigitalTab('gsc')
  │
  ▼
GscDashboardPanel (mount)
  │── useEffect → api.getGscSites()
  │     │
  │     ▼
  │   GET /api/gsc/sites   [Authorization: Bearer <JWT>]
  │     │
  │     ▼
  │   routes/gsc.js — verifyToken → searchconsole.sites.list()
  │     │
  │     ▼
  │   Google Search Console API (Service Account)
  │     │
  │     ▼
  │   { siteEntry: [ { siteUrl, permissionLevel } ] }
  │
  ├── set sites state → auto-select sites[0]
  │
  ▼
useEffect (siteUrl, range, searchType) → api.getGscAnalytics(siteUrl, range, searchType)
  │
  ▼
GET /api/gsc/analytics?siteUrl=...&range=...&searchType=...
  │
  ▼
routes/gsc.js — hitung startDate/endDate → searchconsole.searchanalytics.query()
  │
  ▼
{ rows: [ { keys: ['2024-01-01'], clicks, impressions, ctr, position } ] }
  │
  ▼
GscDashboardPanel — transform rows → recharts LineChart
```

### Komponen Baru

| Komponen | Path | Fungsi |
|---|---|---|
| `GSC_Router` | `backend/routes/gsc.js` | Express router, 2 endpoint, auth via verifyToken |
| `GSC_Client` | (diinisialisasi di dalam gsc.js) | googleapis SearchConsole v1 + GoogleAuth Service Account |
| `getGscSites` | `frontend/src/services/api.js` | Method baru di objek `api` |
| `getGscAnalytics` | `frontend/src/services/api.js` | Method baru di objek `api` |
| `GscDashboardPanel` | `frontend/src/components/GscDashboardPanel.jsx` | Komponen React visualisasi GSC |

### Komponen yang Dimodifikasi (Minimal)

| File | Perubahan |
|---|---|
| `backend/server.js` | +1 baris: `app.use('/api/gsc', require('./routes/gsc'))` |
| `frontend/src/App.jsx` | +import, +1 menu item, +1 tab button, +1 render block |
| `frontend/src/services/api.js` | +2 method sebelum `};` penutup |
| `backend/package.json` | +`"googleapis": "<pinned>"` di dependencies |
| `frontend/package.json` | +`"recharts": "<pinned>"` di dependencies |

---

## Components and Interfaces

### Backend: `routes/gsc.js`

```javascript
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

// --- GSC Client Initialization ---
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '..', 'gsc-service-account-key.json'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

// Helper: hitung tanggal berdasarkan range
// range: '7d' | '28d' | '3m'
// returns: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
function calculateDateRange(range) {
  const RANGE_MAP = { '7d': 7, '28d': 28, '3m': 90 };
  const days = RANGE_MAP[range] || 28; // default 28d

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3);           // endDate = today - 3 hari

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);     // startDate = endDate - N hari

  const fmt = (d) => d.toISOString().split('T')[0];
  return { startDate: fmt(startDate), endDate: fmt(endDate) };
}

// GET /api/gsc/sites
// Headers: Authorization: Bearer <JWT>
// Response: Google API siteEntry list JSON
router.get('/sites', verifyToken, async (req, res) => {
  try {
    const response = await searchconsole.sites.list();
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil daftar site GSC.', error: err.message });
  }
});

// GET /api/gsc/analytics
// Query params:
//   siteUrl    (required) — e.g. 'https://infimech.co.id/'
//   range      (optional, default '28d') — '7d' | '28d' | '3m'
//   searchType (optional, default 'web') — 'web' | 'image' | 'video' | 'news'
// Response: Google API searchanalytics.query JSON
router.get('/analytics', verifyToken, async (req, res) => {
  const { siteUrl, range = '28d', searchType = 'web' } = req.query;

  if (!siteUrl) {
    return res.status(400).json({
      message: 'Parameter siteUrl wajib disertakan.',
      error: 'MISSING_SITE_URL',
    });
  }

  const { startDate, endDate } = calculateDateRange(range);

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        type: searchType,
        rowLimit: 100,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data analytics GSC.', error: err.message });
  }
});

module.exports = router;
```

### Backend: Tambahan di `server.js`

```javascript
// Tepat setelah baris:
app.use('/api/seo', require('./routes/seo'));
// Tambahkan:
app.use('/api/gsc', require('./routes/gsc'));
```

### Frontend: Tambahan di `services/api.js`

```javascript
// Ditambahkan tepat sebelum baris };  penutup objek api

  // GSC Performance Dashboard
  getGscSites: async () => {
    const res = await fetch(`${API_BASE_URL}/gsc/sites`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getGscAnalytics: async (siteUrl, range = '28d', searchType = 'web') => {
    const params = new URLSearchParams({ siteUrl, range, searchType });
    const res = await fetch(`${API_BASE_URL}/gsc/analytics?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
```

### Frontend: `GscDashboardPanel.jsx` — State & Hooks

```javascript
// State
const [sites, setSites] = useState([]);             // array siteEntry dari /gsc/sites
const [selectedSite, setSelectedSite] = useState(''); // siteUrl yang sedang aktif
const [range, setRange] = useState('28d');           // '7d' | '28d' | '3m'
const [searchType, setSearchType] = useState('web'); // 'web' | 'image' | 'video' | 'news'
const [analyticsData, setAnalyticsData] = useState([]); // rows dari /gsc/analytics, sudah di-transform
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// Hooks
// 1. Mount — ambil daftar site
useEffect(() => {
  (async () => {
    try {
      const data = await api.getGscSites();
      const list = data.siteEntry || [];
      setSites(list);
      if (list.length > 0) setSelectedSite(list[0].siteUrl);
    } catch (err) {
      setError(err.message);
    }
  })();
}, []); // hanya saat mount

// 2. Fetch analytics setiap kali selectedSite / range / searchType berubah
useEffect(() => {
  if (!selectedSite) return;
  (async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGscAnalytics(selectedSite, range, searchType);
      const rows = data.rows || [];
      // Transform ke format recharts
      const transformed = rows.map((row) => ({
        date: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        position: parseFloat(row.position.toFixed(1)),
      }));
      setAnalyticsData(transformed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  })();
}, [selectedSite, range, searchType]);
```

### Frontend: `GscDashboardPanel.jsx` — Struktur UI

```
GscDashboardPanel
├── Header row
│   ├── Judul "GSC Performance Dashboard"
│   └── Dropdown site (selectedSite, setSite)
│
├── Filter row
│   ├── Pill buttons range: "7 Hari" (7d), "28 Hari" (28d), "3 Bulan" (3m)
│   └── Dropdown searchType: Web, Gambar, Video, Berita
│
├── KPI summary row (4 kartu)
│   ├── Total Clicks (sum dari analyticsData)
│   ├── Total Impressions
│   ├── Avg CTR
│   └── Avg Position
│
├── [if loading] Loading indicator
├── [if error] Error message box
└── [if data] LineChart (recharts)
    ├── ResponsiveContainer width="100%" height={300}
    ├── CartesianGrid, XAxis (date), YAxis
    ├── Line: clicks (--accent-cyan)
    ├── Line: impressions (--primary-glow)
    ├── Tooltip, Legend
    └── (opsional) Line kedua: ctr (--accent-green) pada YAxis kanan
```

### Frontend: Integrasi `App.jsx`

**Import (dekat baris import SeoInteractiveForm):**
```javascript
import SeoInteractiveForm from './components/SeoInteractiveForm';
import GscDashboardPanel from './components/GscDashboardPanel';  // tambahkan baris ini
```

**Sidebar menu item (dalam blok `marketingDropdownOpen`, setelah item SEO Marketing):**
```jsx
{/* TAMBAHKAN SETELAH item SEO Marketing yang sudah ada */}
<li>
  <a
    className={`sidebar-item ${currentView === 'digital-marketing' && digitalTab === 'gsc' ? 'active' : ''}`}
    style={{ fontSize: '13px', padding: '8px 12px' }}
    onClick={() => { setCurrentView('digital-marketing'); setDigitalTab('gsc'); setSidebarOpen(false); }}
  >
    <Search size={16} />
    <span>GSC Dashboard</span>
  </a>
</li>
```

**Tab button (dalam tab bar digital-marketing, setelah tombol SEO):**
```jsx
{/* TAMBAHKAN SETELAH tombol "Form Options SEO Interaktif" yang sudah ada */}
<button
  className={`btn ${digitalTab === 'gsc' ? 'btn-primary' : 'btn-secondary'}`}
  onClick={() => setDigitalTab('gsc')}
>
  <Search size={16} />
  <span>GSC Performance</span>
</button>
```

**Render block (sejajar dengan block SeoInteractiveForm):**
```jsx
{/* TAMBAHKAN SETELAH block SeoInteractiveForm yang sudah ada */}
{digitalTab === 'gsc' && (
  <GscDashboardPanel />
)}
```

---

## Data Models

### `GET /api/gsc/sites` — Response (pass-through dari Google API)

```typescript
interface SitesResponse {
  siteEntry?: Array<{
    siteUrl: string;          // e.g. "https://infimech.co.id/"
    permissionLevel: string;  // e.g. "siteOwner" | "siteRestrictedUser"
  }>;
}
```

### `GET /api/gsc/analytics` — Request

```typescript
// Query Parameters
interface AnalyticsRequest {
  siteUrl: string;                              // required
  range?: '7d' | '28d' | '3m';                 // default '28d'
  searchType?: 'web' | 'image' | 'video' | 'news';  // default 'web'
}
```

### `GET /api/gsc/analytics` — Response (pass-through dari Google API)

```typescript
interface AnalyticsResponse {
  rows?: Array<{
    keys: string[];          // ['YYYY-MM-DD'] (dimensi date)
    clicks: number;
    impressions: number;
    ctr: number;             // decimal, e.g. 0.045 = 4.5%
    position: number;        // rata-rata posisi (float)
  }>;
}
```

### `calculateDateRange(range)` — Internal Helper

```typescript
type Range = '7d' | '28d' | '3m';

interface DateRange {
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;     // 'YYYY-MM-DD' = today - 3 hari
}

// Mapping
const RANGE_MAP = { '7d': 7, '28d': 28, '3m': 90 };
// endDate   = today - 3 hari
// startDate = endDate - RANGE_MAP[range] hari
```

### Transformed recharts Data (Frontend)

```typescript
interface ChartDataPoint {
  date: string;         // 'YYYY-MM-DD' — diambil dari row.keys[0]
  clicks: number;
  impressions: number;
  ctr: number;          // sudah dikonversi ke persen: parseFloat((row.ctr * 100).toFixed(2))
  position: number;     // parseFloat(row.position.toFixed(1))
}

type ChartData = ChartDataPoint[];
```

### Error Response (Backend)

```typescript
interface ErrorResponse {
  message: string;   // pesan human-readable dalam Bahasa Indonesia
  error: string;     // error.message dari exception, atau kode error singkat
}
// HTTP 400 — missing siteUrl
// HTTP 500 — Google API error / network failure
```

---

## Error Handling

### Backend Error Hierarchy

```
Request masuk
  │
  ├─ [Missing siteUrl]
  │     → HTTP 400 { message: 'Parameter siteUrl wajib disertakan.', error: 'MISSING_SITE_URL' }
  │
  ├─ [JWT tidak ada / tidak valid]
  │     → HTTP 401 / 403 (ditangani oleh verifyToken middleware — tidak ada perubahan)
  │
  ├─ [Google API error — auth/permission]
  │     → HTTP 500 { message: 'Gagal mengambil ...', error: err.message }
  │
  └─ [Google API error — network/timeout]
        → HTTP 500 { message: 'Gagal mengambil ...', error: err.message }
```

### Frontend Error Handling

```
api.getGscSites() / api.getGscAnalytics()
  │
  ├─ [HTTP 4xx/5xx dari backend]
  │     → handleResponse melempar Error dengan message dari response body
  │     → catch block di GscDashboardPanel: setError(err.message)
  │     → Render: <div style={{ color: 'var(--accent-red)' }}>{error}</div>
  │
  └─ [Network error / fetch gagal]
        → catch block: setError(err.message)
        → Render: pesan error deskriptif
```

### Kondisi Loading

- `loading = true` → set sebelum `getGscAnalytics` dipanggil
- `loading = false` → set di blok `finally`, selalu dieksekusi
- Selama `loading`, render indikator (spinner atau teks "Memuat data...")
- Data chart tidak di-render selama loading untuk menghindari flash konten lama

---

## Testing Strategy

### Manual Verification Checklist

Jalankan backend dan frontend, lalu lakukan verifikasi berikut satu per satu melalui browser dan DevTools Network tab:

**Backend Endpoints**

- [ ] Buka Network tab di DevTools. Navigasi ke menu "GSC Dashboard". Pastikan request `GET /api/gsc/sites` muncul dengan status **200** dan response body berisi array `siteEntry`.
- [ ] Pastikan request `GET /api/gsc/analytics` muncul dengan status **200** dan response body berisi array `rows` (atau objek kosong jika belum ada data di GSC untuk rentang tersebut).
- [ ] Logout dari aplikasi, lalu coba akses `GET /api/gsc/sites` langsung via browser address bar atau curl tanpa token. Pastikan response status **401** atau **403**.
- [ ] Kirim request ke `GET /api/gsc/analytics` tanpa query param `siteUrl` (bisa via curl atau edit URL manual). Pastikan response status **400** dengan body `{ message: '...siteUrl wajib...', error: 'MISSING_SITE_URL' }`.

**Frontend — Tampilan & Interaksi**

- [ ] Setelah login, buka sidebar. Pastikan item menu **"GSC Dashboard"** muncul di bawah "SEO Marketing" dalam grup Marketing, menggunakan icon Search.
- [ ] Klik menu "GSC Dashboard". Pastikan view beralih ke tab GSC dan komponen `GscDashboardPanel` dirender (tidak blank, tidak error).
- [ ] Pastikan **dropdown site** muncul dan terisi dengan daftar site dari GSC (minimal satu site terpilih otomatis).
- [ ] Pastikan **tiga tombol pill range** tersedia: "7 Hari", "28 Hari", "3 Bulan". Klik masing-masing dan pastikan request `GET /api/gsc/analytics` baru dikirim dengan parameter `range` yang sesuai (`7d`, `28d`, `3m`).
- [ ] Pastikan **dropdown searchType** tersedia dengan empat pilihan: Web, Gambar, Video, Berita. Pilih masing-masing dan pastikan request analytics baru dikirim dengan `searchType` yang sesuai.
- [ ] Pastikan **LineChart** muncul setelah data kembali dari API, dengan dua garis (clicks dan impressions) dan sumbu-X menampilkan tanggal.
- [ ] Saat data sedang dimuat (loading), pastikan **indikator loading** (teks atau spinner) ditampilkan di area chart.
- [ ] Jika API gagal (misal: matikan backend sementara), pastikan **pesan error** muncul di panel tanpa menyebabkan crash halaman.

**Non-Regression — Fitur SEO yang Ada**

- [ ] Klik menu **"SEO Marketing"** di sidebar. Pastikan `SeoInteractiveForm` masih muncul normal persis seperti sebelum fitur GSC ditambahkan.
- [ ] Klik tab **"Form Options SEO Interaktif"** di area tab digital-marketing. Pastikan tab berfungsi dan konten SEO tampil.
- [ ] Pastikan menu "Marketing Assets", "Real-Time Analytics", dan "Follow Up" di sidebar masih berfungsi normal.
