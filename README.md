# iRekon App - Sistem Rekonsiliasi Transaksi & Keuangan

**iRekon App** adalah platform rekonsiliasi transaksi otomatis berbasis mikroarsitektur yang dirancang untuk mencocokkan data keuangan, transaksi SFTP/FTP, serta laporan perbankan secara presisi dan efisien.

---

## 🛠️ Teknologi & Arsitektur

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Zustand, TanStack React Query.
* **Backend API**: Python 3.10+, FastAPI, SQLAlchemy (ORM), Pydantic v2, Alembic.
* **Worker & Queue**: Dramatiq, RabbitMQ (Message Broker), Redis (Cache & Backend).
* **Database & Storage**: PostgreSQL 16, MinIO (S3 Object Storage).
* **Monitoring & Infrastruktur**: Prometheus, Grafana, Docker & Docker Compose, Alpine SFTP/FTP.

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang software berikut:
* **Git**: Versi 2.30+
* **Docker Engine**: Versi 24.0+
* **Docker Compose**: Versi 2.20+
*(Opsional untuk pengembangan lokal tanpa Docker)*:
* **Node.js**: Versi 18.x atau 20.x
* **Python**: Versi 3.10+

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi (Menggunakan Docker)

Metode ini adalah cara **tercepat dan terkoordinasi** untuk menjalankan seluruh ekosistem iRekon App (Database, Cache, Object Storage, Backend API, Worker, dan Frontend).

### 1. Clone Repositori
Buka terminal dan jalankan perintah:
```bash
git clone https://github.com/mhamdani08/irekon-app.git
cd irekon-app
```

### 2. Konfigurasi Environment Variable
Salin file template environment `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
*(Anda dapat menyesuaikan kredensial di dalam file `.env` jika diperlukan, namun secara default konfigurasi bawaan sudah siap digunakan)*.

### 3. Build & Jalankan Container
Jalankan Docker Compose untuk mengunduh image, melakukan build, dan mengaktifkan service:
```bash
docker compose up -d --build
```
> **Catatan**: Proses pertama kali mungkin memakan waktu beberapa menit untuk mengunduh image dasar dan meng-install dependencies backend/frontend.

### 4. Inisialisasi Database & Seeding Data
Setelah seluruh container aktif dan berstatus `healthy`, jalankan script migrasi dan seed data awal:
```bash
./run_migration.sh
```
Atau Anda dapat menjalankannya secara manual via Docker exec:
```bash
docker compose exec backend python -m app.database.init_db
```

---

## 🌐 Daftar Akses Layanan (Endpoints & Ports)

Setelah container berhasil berjalan, Anda dapat mengakses layanan pada URL berikut:

| Layanan | URL / Endpoint | Kredensial Default |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:4000](http://localhost:4000) | - |
| **Backend API (Swagger Docs)** | [http://localhost:8005/docs](http://localhost:8005/docs) | - |
| **MinIO Console (S3 Storage)** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadmin` |
| **RabbitMQ Management UI** | [http://localhost:15672](http://localhost:15672) | User: `guest` / Pass: `guest` |
| **Grafana Dashboard** | [http://localhost:3001](http://localhost:3001) | User: `admin` / Pass: `admin` |
| **Prometheus Metrics** | [http://localhost:9090](http://localhost:9090) | - |
| **PostgreSQL Database** | `localhost:5433` | User: `irekon` / Pass: `irekon_pass` / DB: `irekon_db` |
| **Redis Cache** | `localhost:6380` | - |
| **SFTP Service** | `localhost:2222` | User: `admin` / Pass: `admin123` |

---

## 💻 Cara Menjalankan Secara Manual (Pengembangan Lokal)

Jika Anda ingin menjalankan Backend dan Frontend secara independen di komputer lokal tanpa Docker untuk kebutuhan development:

### A. Menjalankan Backend (FastAPI)

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Buat dan aktifkan Virtual Environment Python:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Di Linux/macOS
   # venv\Scripts\activate   # Di Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Pastikan PostgreSQL, Redis, dan RabbitMQ lokal sudah berjalan dan sesuaikan environment di `.env`.
5. Jalankan migrasi & seeding database:
   ```bash
   python -m app.database.init_db
   ```
6. Jalankan FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
7. *(Opsional)* Jalankan Dramatiq worker di terminal terpisah:
   ```bash
   dramatiq app.workers.dramatiq_app
   ```

### B. Menjalankan Frontend (Next.js)

1. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server pengembang (development mode):
   ```bash
   npm run dev
   ```
4. Akses aplikasi frontend di [http://localhost:3000](http://localhost:3000).

---

## 📂 Struktur Direktori Proyek

```text
irekon-app/
├── backend/                  # Source code FastAPI & Worker
│   ├── app/
│   │   ├── api/              # Route & Endpoints API (v1)
│   │   ├── core/             # Auth, Security, & Dependencies
│   │   ├── database/         # Session & Initial DB Migrations
│   │   ├── models/           # SQLAlchemy Data Models
│   │   ├── repositories/     # Data Access Layer
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business Logic & Recon Engine
│   │   └── workers/          # Dramatiq Background Jobs
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Source code Next.js App
│   ├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── components/           # UI Components (Header, Sidebar, Forms, dll)
│   ├── lib/                  # Client API Helper & Fetcher
│   ├── store/                # State Management (Zustand)
│   ├── Dockerfile
│   └── package.json
├── infrastructure/           # Konfigurasi Prometheus, SFTP, & Server Keys
├── plan-docs/                # Dokumentasi Rancangan & Arsitektur
├── .env.example              # Template Environment Variable
├── docker-compose.yml        # Konfigurasi Multi-Container Services
├── run_migration.sh          # Script Inisialisasi Database
└── README.md                 # Dokumentasi Resmi Proyek
```

---

## 🔧 Troubleshooting Utilitas & Perintah Berguna

* **Melihat log container secara realtime**:
  ```bash
  docker compose logs -f
  ```
* **Melihat log backend saja**:
  ```bash
  docker compose logs -f backend
  ```
* **Menghentikan seluruh service**:
  ```bash
  docker compose down
  ```
* **Menghentikan dan menghapus seluruh data volume**:
  ```bash
  docker compose down -v
  ```

---

## 📝 Lisensi & Kontribusi

Proyek ini dikembangkan untuk kebutuhan internal sistem rekonsiliasi. Dikelola oleh [Hamdani](https://github.com/mhamdani08).
