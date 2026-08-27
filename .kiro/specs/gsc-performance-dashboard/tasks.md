# Implementation Plan: GSC Performance Dashboard

## Overview

Implementasi fitur ini menambahkan integrasi Google Search Console ke dalam Marketing ERP melalui tiga bagian utama: backend Express router (`routes/gsc.js`) yang mengautentikasi ke Google via Service Account, dua method baru di `services/api.js`, dan komponen React `GscDashboardPanel.jsx` yang divisualisasikan dengan recharts. Perubahan pada file yang sudah ada (`server.js`, `App.jsx`, `package.json` backend & frontend, `services/api.js`) bersifat minimal dan aditif — tidak ada kode yang sudah ada yang diubah atau dihapus.

## Tasks

- [x] 1. Tambahkan dependency googleapis ke backend dan recharts ke frontend
  - [x] 1.1 Tambahkan `"googleapis": "^144.0.0"` ke bagian `dependencies` di `backend/package.json`
    - Gunakan versi pinned (major version lock), bukan open range `*`
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 Tambahkan `"recharts": "^2.12.7"` ke bagian `dependencies` di `frontend/package.json`
    - Gunakan versi pinned, bukan open range `*`
    - _Requirements: 5.1, 5.3_

- [x] 2. Amankan Service Account Key di .gitignore
  - [x] 2.1 Periksa file `backend/.gitignore` dan tambahkan baris `gsc-service-account-key.json` jika belum ada
    - Jangan membuat, mengubah, atau menghapus file `backend/gsc-service-account-key.json` itu sendiri
    - Pastikan hanya menambahkan entri ke `.gitignore`, tidak memodifikasi konten file key
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Buat backend router `routes/gsc.js`
  - [x] 3.1 Buat file `backend/routes/gsc.js` dengan CommonJS pattern (`require`/`module.exports`)
    - Import: `express`, `googleapis`, `path`, `verifyToken` dari `../middleware/auth`
    - Inisialisasi `GSC_Client`: `google.auth.GoogleAuth` dengan `keyFile: path.join(__dirname, '..', 'gsc-service-account-key.json')` dan `scopes: ['https://www.googleapis.com/auth/webmasters.readonly']`
    - Implementasi helper `calculateDateRange(range)`: hitung `endDate = today - 3 hari`, `startDate = endDate - N hari` (7d→7, 28d→28, 3m→90), return `{ startDate, endDate }` format `YYYY-MM-DD`
    - _Requirements: 3.1, 3.2, 3.3, 3.8_
  - [x] 3.2 Implementasi endpoint `GET /sites` di `routes/gsc.js`
    - Lindungi dengan `verifyToken` middleware
    - Panggil `searchconsole.sites.list()` dan kembalikan `response.data`
    - Tangani error dengan HTTP 500 `{ message: string, error: string }`
    - _Requirements: 3.2, 3.4, 3.10_
  - [x] 3.3 Implementasi endpoint `GET /analytics` di `routes/gsc.js`
    - Lindungi dengan `verifyToken` middleware
    - Destructure query params: `{ siteUrl, range = '28d', searchType = 'web' }`
    - Validasi `siteUrl`: jika tidak ada, return HTTP 400 `{ message: 'Parameter siteUrl wajib disertakan.', error: 'MISSING_SITE_URL' }`
    - Panggil `searchconsole.searchanalytics.query()` dengan `requestBody: { startDate, endDate, dimensions: ['date'], type: searchType, rowLimit: 100 }`
    - Tangani error dengan HTTP 500 `{ message: string, error: string }`
    - _Requirements: 3.2, 3.5, 3.6, 3.7, 3.9, 3.10_

- [x] 4. Daftarkan GSC router di `server.js`
  - [x] 4.1 Tambahkan satu baris `app.use('/api/gsc', require('./routes/gsc'))` di `backend/server.js`
    - Letakkan tepat **setelah** baris `app.use('/api/seo', require('./routes/seo'))` yang sudah ada
    - Jangan mengubah atau menghapus baris route SEO maupun route lainnya
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Checkpoint — Verifikasi backend sebelum lanjut ke frontend
  - Pastikan `npm install` di direktori `backend` tidak ada error
  - Pastikan server backend dapat dijalankan tanpa crash
  - Lakukan spot check: akses `GET /api/gsc/analytics` tanpa `siteUrl` harus return 400; akses tanpa token harus return 401/403

- [x] 6. Tambahkan method API di `frontend/src/services/api.js`
  - [x] 6.1 Tambahkan method `getGscSites()` dan `getGscAnalytics(siteUrl, range, searchType)` ke objek `api` di `frontend/src/services/api.js`
    - Tambahkan **sebelum** baris penutup `};` objek `api`
    - `getGscSites`: `GET ${API_BASE_URL}/gsc/sites` dengan `getHeaders()`
    - `getGscAnalytics`: `GET ${API_BASE_URL}/gsc/analytics?siteUrl=...&range=...&searchType=...` dengan `getHeaders()`, gunakan `URLSearchParams`
    - Kedua method memanggil `handleResponse(res)` untuk error handling
    - Jangan mengubah atau menghapus method yang sudah ada (termasuk semua method SEO)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Buat komponen `GscDashboardPanel.jsx`
  - [x] 7.1 Buat file `frontend/src/components/GscDashboardPanel.jsx` sebagai React functional component
    - Deklarasikan state: `sites`, `selectedSite`, `range` (default `'28d'`), `searchType` (default `'web'`), `analyticsData`, `loading`, `error`
    - `useEffect` pertama (deps `[]`): panggil `api.getGscSites()`, set `sites`, auto-select `sites[0].siteUrl` sebagai `selectedSite`; tangani error dengan `setError`
    - `useEffect` kedua (deps `[selectedSite, range, searchType]`): jika `selectedSite` ada, set `loading = true`, panggil `api.getGscAnalytics()`, transform rows ke format recharts (`date`, `clicks`, `impressions`, `ctr` × 100, `position`), set `analyticsData`; set `loading = false` di blok `finally`
    - _Requirements: 7.1, 7.2, 7.3, 7.10_
  - [x] 7.2 Implementasi UI controls di `GscDashboardPanel.jsx`
    - Header row: judul "GSC Performance Dashboard" + dropdown site (`selectedSite`, `setSite`)
    - Filter row: 3 tombol pill range ("7 Hari"→`7d`, "28 Hari"→`28d`, "3 Bulan"→`3m`) + dropdown `searchType` (Web/Gambar/Video/Berita)
    - Row 4 KPI cards: Total Clicks, Total Impressions, Avg CTR, Avg Position dihitung dari `analyticsData`
    - Loading state: tampilkan indikator "Memuat data..." saat `loading === true`
    - Error state: tampilkan pesan error dengan warna `var(--accent-red)` saat `error` tidak kosong
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 7.8, 7.10, 7.11_
  - [x] 7.3 Implementasi LineChart recharts di `GscDashboardPanel.jsx`
    - Import: `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend` dari `recharts`
    - Render `<ResponsiveContainer width="100%" height={300}>` hanya jika `!loading && !error && analyticsData.length > 0`
    - Line `clicks` gunakan `stroke="var(--accent-cyan)"`, line `impressions` gunakan `stroke="var(--primary-glow)"`
    - `XAxis` menggunakan `dataKey="date"`, `YAxis` kiri untuk clicks/impressions
    - Semua styling menggunakan CSS variables: `--text-primary`, `--text-secondary`, `--border-color`, `--accent-cyan`
    - _Requirements: 7.9, 7.12_

- [x] 8. Integrasikan GscDashboardPanel ke `App.jsx`
  - [x] 8.1 Tambahkan import `GscDashboardPanel` di `frontend/src/App.jsx`
    - Tambahkan baris `import GscDashboardPanel from './components/GscDashboardPanel';` tepat **setelah** baris `import SeoInteractiveForm from './components/SeoInteractiveForm';`
    - Jangan mengubah import lain yang sudah ada
    - _Requirements: 8.1_
  - [x] 8.2 Tambahkan menu item "GSC Dashboard" di sidebar `App.jsx`
    - Tambahkan `<li>` baru di dalam blok `marketingDropdownOpen`, tepat **setelah** item menu "SEO Marketing" yang sudah ada
    - `onClick`: `setCurrentView('digital-marketing'); setDigitalTab('gsc'); setSidebarOpen(false)`
    - Gunakan `<Search size={16} />` sebagai icon (sudah ter-import)
    - `className` active condition: `currentView === 'digital-marketing' && digitalTab === 'gsc'`
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 8.3 Tambahkan tab button "GSC Performance" di tab bar `digital-marketing` di `App.jsx`
    - Tambahkan `<button>` baru tepat **setelah** tombol "Form Options SEO Interaktif" yang sudah ada
    - `onClick`: `setDigitalTab('gsc')`
    - Active class: `digitalTab === 'gsc' ? 'btn-primary' : 'btn-secondary'`
    - Label: `<Search size={16} />` + `<span>GSC Performance</span>`
    - _Requirements: 8.5, 8.6_
  - [x] 8.4 Tambahkan render block `GscDashboardPanel` di view `digital-marketing` di `App.jsx`
    - Tambahkan `{digitalTab === 'gsc' && (<GscDashboardPanel />)}` tepat **setelah** blok render `SeoInteractiveForm` yang sudah ada
    - Pastikan blok render SEO, Campaigns, Assets, dan Analytics tidak diubah
    - _Requirements: 8.7, 8.8, 8.9_

- [x] 9. Checkpoint Akhir — Verifikasi integrasi end-to-end
  - Jalankan `npm install` di direktori `frontend` dan pastikan tidak ada error
  - Jalankan backend dan frontend, login ke aplikasi
  - Verifikasi semua item di **Manual Verification Checklist** pada `design.md`:
    - `GET /api/gsc/sites` → 200 dengan array `siteEntry`
    - `GET /api/gsc/analytics` → 200 dengan array `rows`
    - Akses tanpa token → 401/403
    - Akses tanpa `siteUrl` → 400
    - Menu "GSC Dashboard" muncul di sidebar di bawah "SEO Marketing"
    - Dropdown site, pill range, dropdown searchType berfungsi
    - LineChart muncul, loading state dan error state berjalan
    - Menu "SEO Marketing" dan tab "Form Options SEO Interaktif" masih berfungsi normal

## Notes

- Tidak ada test framework yang perlu di-setup; verifikasi dilakukan secara manual via browser dan DevTools Network tab sesuai checklist di `design.md`
- File `backend/gsc-service-account-key.json` sudah ada di filesystem — **jangan dibuat ulang, diubah, atau dihapus**
- Semua perubahan pada file yang sudah ada bersifat aditif: tambah baris/blok baru, tidak ada yang dihapus
- Ikuti pola CommonJS (`require`/`module.exports`) di backend, sesuai dengan `routes/seo.js`
- Ikuti pola React functional component dengan hooks di frontend, sesuai dengan komponen yang sudah ada

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "8.4"] }
  ]
}
```
