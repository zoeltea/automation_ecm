# K2 & ECM Automation Suite (Eigerindo)

Repositori ini berisi kumpulan script otomatisasi untuk sistem **ECM K2 SmartForms (Eigerindo)**, termasuk alur login, pembuatan tiket GA Service Head Office, serta interaksi form K2.

---

## 🔒 Keamanan Kredensial
> **PENTING**: Kredensial (Username, Password, Token, dan API Key) **TIDAK PERNAH** disimpan di dalam repositori Git. Repositori ini sudah dilengkapi konfigurasi `.gitignore` untuk mencegah file `.env` ter-commit.

Gunakan file template `.env.example` untuk membuat konfigurasi lokal Anda sendiri:
```bash
cp .env.example .env
```
Kemudian lengkapi nilai kredensial di dalam `.env`:
```env
ECM_BASE_URL=https://ecm-uat-k2.eigerindo.co.id
ECM_USERNAME=your_username
ECM_PASSWORD=your_password
```

---

## 📁 Struktur Repositori

```text
automation_ecm/
├── .env.example          # Template konfigurasi environment (tanpa data sensitif)
├── .gitignore            # Filter git untuk mencegah file sensitif dan node_modules ter-commit
├── package.json          # Manifest dependensi & script runner
├── README.md             # Dokumentasi instalasi dan penggunaan
└── src/
    ├── login.js          # Script otomatisasi login STS / K2 Workspace
    └── create_ticket.js  # Script modul pengisian dan submit tiket GA Service
```

---

## 🚀 Instalasi & Persiapan

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Setup file konfigurasi**:
   Salin `.env.example` ke `.env` dan sesuaikan kredensial Anda.

---

## 📖 Cara Menjalankan

### 1. Menjalankan Script Login
Untuk menjalankan otomatisasi proses autentikasi / login K2:
```bash
npm run login
```
Script akan:
- Membuka halaman login Workspace K2 (`/Workspace/`).
- Mengisi formulir username & password dari `.env`.
- Menangani WS-Federation redirect form secara otomatis hingga mendarat di halaman utama Workspace.

### 2. Menjalankan Pembuatan Tiket GA Service
Modul `src/create_ticket.js` dapat diintegrasikan langsung dengan Puppeteer, Playwright, atau OpenClaw Browser Runner untuk mengeksekusi otomasi pengisian form K2 SmartForms:
- Pemilihan dropdown *Type of Ticket* & *Type of Service*
- Input *Request Description*
- Penambahan item *Detail Service*
- Trigger *LOAD E-SIGN*
- Penanganan modal konfirmasi *Are you sure?* dan alert *Push OSMS*
- Menangkap nomor dokumen transaksi (*Document Number*) & *Workflow ID*
