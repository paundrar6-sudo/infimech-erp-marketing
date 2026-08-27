# Requirements Document

## Introduction

Fitur GSC Performance Dashboard menambahkan integrasi Google Search Console (GSC) ke dalam Marketing ERP yang sudah ada. Fitur ini menyediakan tampilan performa pencarian organik secara visual — meliputi klik, impresi, CTR, dan posisi rata-rata — langsung di dalam dashboard, tanpa perlu membuka Google Search Console secara terpisah.

Dashboard ini ditempatkan sebagai sub-menu baru di dalam kategori "Marketing" pada sidebar, sejajar dengan menu "SEO Marketing" yang sudah ada. Autentikasi ke GSC dilakukan melalui Google Cloud Service Account yang sudah dikonfigurasi sebelumnya, sehingga operator tidak perlu login manual ke Google.

Fitur baru ini hidup berdampingan dengan fitur SEO yang sudah ada (routes/seo.js, SeoInteractiveForm, method SEO di api.js) dan tidak mengubah atau menghapus fungsionalitas tersebut.

---

## Glossary

- **GSC_Router**: Modul Express router (routes/gsc.js) yang menangani endpoint /api/gsc/* dengan autentikasi verifyToken.
- **GSC_Client**: Instance googleapis (Google Search Console API v1) yang diinisialisasi menggunakan Service Account Key file backend/gsc-service-account-key.json.
- **GscDashboardPanel**: Komponen React frontend (components/GscDashboardPanel.jsx) yang merender seluruh UI GSC Dashboard.
- **API_Service**: Objek api yang diekspor dari frontend/src/services/api.js, berisi semua method pemanggilan HTTP ke backend.
- **Server**: Instance Express yang dikonfigurasi di backend/server.js, mendaftarkan semua route melalui app.use().
- **App**: Komponen utama React (frontend/src/App.jsx) yang mengelola state navigasi currentView dan digitalTab.
- **Sidebar**: Panel navigasi kiri di dalam App yang menampilkan menu-menu berdasarkan modul.
- **Service_Account_Key**: File JSON backend/gsc-service-account-key.json berisi kredensial Google Cloud Service Account.
- **verifyToken**: Middleware Express yang memvalidasi JWT Bearer token dari header Authorization.
- **digitalTab**: State string di App yang menentukan sub-panel mana yang ditampilkan di dalam view digital-marketing.
- **LineChart**: Komponen chart garis dari library recharts yang merender data time-series klik dan impresi.
- **Range**: Parameter filter rentang waktu data GSC, berupa string '7d', '28d', atau '3m'.
- **endDate**: Tanggal akhir query GSC = hari ini dikurangi 3 hari (untuk memperhitungkan delay data GSC).
- **startDate**: Tanggal awal query GSC = endDate dikurangi N hari sesuai nilai Range.
- **searchType**: Parameter filter tipe pencarian GSC, berupa string 'web' (Web), 'image' (Gambar), 'video' (Video), atau 'news' (Berita).

---

## Requirements

### Requirement 1: Instalasi Dependency Backend — googleapis

**User Story:** Sebagai developer, saya ingin package googleapis tersedia di backend, sehingga GSC_Router dapat memanggil Search Console API.

#### Acceptance Criteria

1. THE backend/package.json SHALL mendaftarkan googleapis sebagai dependency (bukan devDependency).
2. WHEN npm install dijalankan di direktori backend, THE package manager SHALL menginstal googleapis tanpa error.
3. THE googleapis dependency SHALL menggunakan versi yang di-pin secara eksplisit (bukan open range *).

---

### Requirement 2: Keamanan — Service Account Key di .gitignore

**User Story:** Sebagai developer, saya ingin file gsc-service-account-key.json tidak pernah masuk ke version control, sehingga kredensial Google tidak bocor ke repository.

#### Acceptance Criteria

1. THE backend/.gitignore SHALL memuat baris gsc-service-account-key.json.
2. IF backend/.gitignore belum memuat entri tersebut, THEN THE Developer SHALL menambahkan baris gsc-service-account-key.json ke file tersebut.
3. THE file backend/gsc-service-account-key.json SHALL tetap ada di filesystem lokal dan tidak dihapus atau dimodifikasi isinya.

---

### Requirement 3: Backend — GSC Router (routes/gsc.js)

**User Story:** Sebagai operator yang sudah login, saya ingin backend menyediakan endpoint GSC yang aman, sehingga frontend dapat mengambil data Search Console tanpa menyimpan kredensial di sisi klien.

#### Acceptance Criteria

1. THE GSC_Router SHALL dibuat sebagai file baru backend/routes/gsc.js menggunakan pola CommonJS (require/module.exports).
2. THE GSC_Router SHALL melindungi semua endpoint dengan middleware verifyToken yang di-import dari ../middleware/auth.
3. THE GSC_Client SHALL diinisialisasi menggunakan google.auth.GoogleAuth dengan keyFile mengarah ke gsc-service-account-key.json (path relatif dari routes/gsc.js) dan scopes: ['https://www.googleapis.com/auth/webmasters.readonly'].
4. WHEN endpoint GET /sites dipanggil dengan token valid, THE GSC_Router SHALL memanggil searchconsole.sites.list() dan mengembalikan response JSON dari Google API tersebut.
5. WHEN endpoint GET /analytics dipanggil dengan query parameter siteUrl yang valid, THE GSC_Router SHALL mengirim query ke Search Console API dengan requestBody: { dimensions: ['date'], type: searchType, rowLimit: 100 }, menggunakan nilai searchType yang diterima dari query parameter request.
6. WHEN parameter range tidak disertakan pada GET /analytics, THE GSC_Router SHALL menggunakan nilai default '28d'.
7. WHEN parameter searchType tidak disertakan pada GET /analytics, THE GSC_Router SHALL menggunakan nilai default 'web'.
8. THE GSC_Router SHALL menghitung endDate sebagai tanggal hari ini dikurangi 3 hari dan startDate sebagai endDate dikurangi N hari sesuai nilai range (7d→7, 28d→28, 3m→90).
9. IF siteUrl tidak disertakan pada GET /analytics, THEN THE GSC_Router SHALL mengembalikan HTTP 400 dengan body { message: string, error: string }.
10. IF terjadi error saat memanggil Google API, THEN THE GSC_Router SHALL mengembalikan HTTP 500 dengan body { message: string, error: string }.

---

### Requirement 4: Backend — Registrasi Route di server.js

**User Story:** Sebagai developer, saya ingin GSC_Router didaftarkan ke Server tepat setelah route SEO, sehingga konvensi urutan pendaftaran route yang sudah ada tetap terjaga.

#### Acceptance Criteria

1. THE Server SHALL mendaftarkan GSC_Router dengan memanggil app.use('/api/gsc', require('./routes/gsc')) di backend/server.js.
2. THE baris pendaftaran GSC_Router SHALL ditempatkan tepat setelah baris app.use('/api/seo', require('./routes/seo')) yang sudah ada.
3. THE route SEO yang sudah ada (app.use('/api/seo', ...)) SHALL tidak diubah atau dihapus.

---

### Requirement 5: Instalasi Dependency Frontend — recharts

**User Story:** Sebagai developer, saya ingin package recharts tersedia di frontend, sehingga GscDashboardPanel dapat merender LineChart untuk visualisasi data GSC.

#### Acceptance Criteria

1. THE frontend/package.json SHALL mendaftarkan recharts sebagai dependency (bukan devDependency).
2. WHEN npm install dijalankan di direktori frontend, THE package manager SHALL menginstal recharts tanpa error.
3. THE recharts dependency SHALL menggunakan versi yang di-pin secara eksplisit (bukan open range *).

---

### Requirement 6: Frontend — Method API di services/api.js

**User Story:** Sebagai developer, saya ingin API_Service menyediakan method getGscSites dan getGscAnalytics, sehingga GscDashboardPanel dapat mengambil data tanpa menulis logika fetch secara langsung.

#### Acceptance Criteria

1. THE API_Service SHALL memuat method getGscSites() yang mengirim GET request ke ${API_BASE_URL}/gsc/sites dengan header autentikasi dari getHeaders().
2. THE API_Service SHALL memuat method getGscAnalytics(siteUrl, range, searchType) yang mengirim GET request ke ${API_BASE_URL}/gsc/analytics dengan query parameters siteUrl, range, dan searchType.
3. THE method getGscSites dan getGscAnalytics SHALL ditambahkan sebelum penutup objek api (sebelum };) di file frontend/src/services/api.js.
4. THE method yang sudah ada di API_Service (termasuk semua method SEO) SHALL tidak diubah atau dihapus.
5. WHEN backend mengembalikan non-2xx status, THE API_Service SHALL melempar Error dengan pesan dari response body melalui handleResponse.

---

### Requirement 7: Frontend — Komponen GscDashboardPanel.jsx

**User Story:** Sebagai operator, saya ingin melihat performa GSC secara visual di dalam ERP, sehingga saya tidak perlu berpindah ke Google Search Console untuk memantau data pencarian organik.

#### Acceptance Criteria

1. THE GscDashboardPanel SHALL dibuat sebagai file baru frontend/src/components/GscDashboardPanel.jsx menggunakan pola React functional component dengan hooks.
2. WHEN GscDashboardPanel pertama kali di-mount, THE GscDashboardPanel SHALL secara otomatis memanggil api.getGscSites() dan menampilkan daftar site pada dropdown.
3. WHEN daftar site berhasil dimuat, THE GscDashboardPanel SHALL secara otomatis memilih site pertama dari daftar dan memanggil api.getGscAnalytics() dengan site tersebut.
4. THE GscDashboardPanel SHALL menampilkan dropdown untuk memilih site yang ingin ditampilkan datanya.
5. THE GscDashboardPanel SHALL menampilkan 3 tombol pill filter range dengan label "7 Hari" (7d), "28 Hari" (28d), dan "3 Bulan" (3m).
6. WHEN operator memilih range berbeda, THE GscDashboardPanel SHALL memanggil ulang api.getGscAnalytics() dengan nilai range yang baru.
7. THE GscDashboardPanel SHALL menampilkan dropdown untuk memilih searchType dengan pilihan: Web (web), Gambar (image), Video (video), dan Berita (news).
8. WHEN operator memilih searchType berbeda, THE GscDashboardPanel SHALL memanggil ulang api.getGscAnalytics() dengan nilai searchType yang baru.
9. THE GscDashboardPanel SHALL merender komponen LineChart dari recharts yang menampilkan metrik clicks dan impressions berdasarkan dimensi date.
10. WHILE data sedang dimuat dari API, THE GscDashboardPanel SHALL menampilkan indikator loading state.
11. IF API mengembalikan error, THEN THE GscDashboardPanel SHALL menampilkan pesan error yang deskriptif kepada operator.
12. THE GscDashboardPanel SHALL menggunakan CSS variables --text-primary, --text-secondary, --border-color, dan --accent-cyan untuk styling agar konsisten dengan tema aplikasi yang ada.

---

### Requirement 8: Frontend — Integrasi di App.jsx

**User Story:** Sebagai operator, saya ingin menemukan menu "GSC Dashboard" di sidebar Marketing dan bisa berpindah ke panel tersebut dengan klik, sehingga navigasi terasa konsisten dengan menu-menu lain yang sudah ada.

#### Acceptance Criteria

1. THE App SHALL mengimpor GscDashboardPanel di dekat baris import SeoInteractiveForm di bagian atas App.jsx.
2. THE Sidebar SHALL memuat item menu baru dengan label "GSC Dashboard" di dalam grup Marketing, ditempatkan setelah item menu "SEO Marketing".
3. THE item menu "GSC Dashboard" SHALL menggunakan icon Search dari lucide-react (icon Search yang sudah ter-import di App.jsx).
4. WHEN operator mengklik menu "GSC Dashboard" di Sidebar, THE App SHALL mengatur currentView ke 'digital-marketing' dan digitalTab ke 'gsc'.
5. THE tab bar pada view digital-marketing SHALL memuat tombol tab baru berlabel "GSC Performance" yang ditempatkan setelah tombol "Form Options SEO Interaktif".
6. WHEN operator mengklik tombol tab "GSC Performance", THE App SHALL mengatur digitalTab ke 'gsc'.
7. WHEN digitalTab bernilai 'gsc', THE App SHALL merender komponen GscDashboardPanel.
8. THE render GscDashboardPanel SHALL ditempatkan sejajar dengan blok render SeoInteractiveForm (dalam scope yang sama di dalam view digital-marketing).
9. THE item menu, tombol tab, dan blok render yang sudah ada untuk fitur SEO, Campaigns, Assets, dan Analytics SHALL tidak diubah atau dihapus.

---

### Requirement 9: Kompatibilitas dan Koeksistensi dengan Fitur SEO yang Ada

**User Story:** Sebagai developer, saya ingin fitur GSC berdampingan dengan fitur SEO yang sudah ada tanpa konflik, sehingga operator masih dapat menggunakan semua fitur SEO seperti sebelumnya.

#### Acceptance Criteria

1. THE file backend/routes/seo.js SHALL tidak diubah atau dihapus.
2. THE komponen frontend/src/components/SeoInteractiveForm.jsx SHALL tidak diubah atau dihapus.
3. THE method-method SEO di frontend/src/services/api.js SHALL tidak diubah atau dihapus.
4. WHEN digitalTab bernilai 'seo', THE App SHALL tetap merender SeoInteractiveForm seperti sebelumnya.
5. THE konvensi penamaan dan pola kode yang sudah ada (CommonJS di backend, React functional component di frontend, pola switch (currentView) di App) SHALL tetap diikuti oleh semua kode baru yang ditambahkan untuk fitur GSC.
