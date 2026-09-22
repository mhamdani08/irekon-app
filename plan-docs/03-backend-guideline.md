# Backend Development Guideline

Version : 1.0
Status  : Draft

---

# 1. Overview

Backend iRekon dibangun menggunakan FastAPI dengan pendekatan **Clean Architecture** yang dipadukan dengan **Layered Architecture**.

Tujuan utama:

- Maintainable
- Testable
- Modular
- Scalable
- Enterprise Ready

Backend tidak boleh berisi business logic di dalam Controller (API Route).

---

# 2. Technology Stack

| Component | Technology |
|------------|------------|
| Language | Python 3.13+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2 |
| Validation | Pydantic v2 |
| Migration | Alembic |
| Authentication | JWT |
| Queue | RabbitMQ |
| Worker | Dramatiq |
| Storage | MinIO |
| Cache | Redis |
| Logging | Loguru |
| Testing | Pytest |

---

# 3. Folder Structure

```
backend/

app/

├── api/
│
├── core/
│
├── database/
│
├── middleware/
│
├── models/
│
├── schemas/
│
├── repositories/
│
├── services/
│
├── workers/
│
├── notifications/
│
├── storage/
│
├── utils/
│
├── config/
│
├── exceptions/
│
└── main.py

tests/

alembic/

Dockerfile

requirements.txt
```

---

# 4. Layer Responsibilities

## API Layer

Responsibilities

- menerima request
- validasi sederhana
- memanggil service
- mengembalikan response

Tidak boleh:

- query database
- business logic
- transaksi database

Contoh

```
POST /api/files/upload

↓

FileService.upload()
```

---

## Service Layer

Tempat seluruh business logic.

Contoh

```
Upload File

↓

Validasi

↓

Upload MinIO

↓

Insert Database

↓

Publish RabbitMQ
```

Semua business process berada di sini.

---

## Repository Layer

Hanya berinteraksi dengan database.

Contoh

```
UserRepository

FileRepository

JobRepository

TransactionRepository
```

Repository tidak boleh mengetahui HTTP Request.

---

## Model Layer

Berisi SQLAlchemy Model.

Satu model untuk satu tabel.

---

## Schema Layer

Berisi Pydantic Schema.

Pisahkan

```
Create

Update

Response

List Response
```

Contoh

```
UserCreate

UserUpdate

UserResponse
```

---

## Worker Layer

Berisi asynchronous job.

Contoh

```
Parse CSV

Matching

Generate Report

Cleanup
```

Worker tidak boleh dipanggil langsung dari Frontend.

---

## Notification Layer

Semua pengiriman notifikasi berada di sini.

Channel

- WebSocket
- Email
- Future Push Notification

---

# 5. Dependency Flow

```
API

↓

Service

↓

Repository

↓

Database
```

Tidak boleh

```
API

↓

Database
```

atau

```
API

↓

SQLAlchemy
```

---

# 6. Dependency Injection

Gunakan dependency bawaan FastAPI.

Contoh

```
Database Session

Current User

Permission

Configuration
```

Jangan membuat object database secara manual di setiap endpoint.

---

# 7. Transaction Management

Semua transaksi dilakukan di Service Layer.

Contoh

```
Begin Transaction

↓

Insert File

↓

Insert Job

↓

Commit

↓

Publish Event
```

Jika gagal

```
Rollback
```

---

# 8. Error Handling

Gunakan Custom Exception.

Contoh

```
ValidationException

AuthenticationException

BusinessException

FileException

StorageException
```

Response API harus konsisten.

```
{
    "success": false,
    "message": "...",
    "errors": []
}
```

---

# 9. Response Standard

Success

```
{
    "success": true,
    "message": "Success",
    "data": {}
}
```

Error

```
{
    "success": false,
    "message": "Validation Error",
    "errors": []
}
```

List

```
{
    "success": true,
    "data": [],
    "pagination": {}
}
```

---

# 10. Logging

Semua request dicatat.

Minimal

- Request ID
- User
- URL
- Method
- Execution Time
- Status Code

Gunakan JSON Logging.

---

# 11. Authentication

Menggunakan

- JWT Access Token
- Refresh Token

Current User diperoleh melalui Dependency Injection.

Authorization menggunakan RBAC.

---

# 12. File Upload

Semua file disimpan ke MinIO.

Database hanya menyimpan metadata.

```
filename

bucket

object_name

mime_type

size
```

---

# 13. Background Job

Semua proses berat wajib menggunakan Worker.

Contoh

- Parsing CSV
- Parsing Excel
- Matching
- Generate Report
- Email
- Cleanup

API hanya membuat Job.

Worker yang menjalankan proses.

---

# 14. RabbitMQ Convention

Exchange

```
rekon.upload

rekon.parsing

rekon.matching

rekon.report

rekon.notification
```

Queue

```
upload.queue

parser.queue

matching.queue

report.queue

notification.queue
```

Semua queue harus memiliki Retry dan Dead Letter Queue.

---

# 15. Redis Usage

Redis digunakan untuk

- Cache
- Session
- Temporary Token
- Rate Limiting

Tidak digunakan sebagai database utama.

---

# 16. Coding Standard

Gunakan

- Type Hint
- Async Function jika memungkinkan
- Docstring
- Black Formatter
- Ruff Linter

Tidak diperbolehkan

- Global Variable
- Hardcode Configuration
- Duplicate Business Logic

---

# 17. Configuration

Semua konfigurasi berasal dari Environment Variable.

Contoh

```
DATABASE_URL

REDIS_URL

RABBITMQ_URL

MINIO_ENDPOINT

JWT_SECRET

SMTP_HOST
```

Tidak boleh ada credential di source code.

---

# 18. Testing

Minimal

- Unit Test
- Integration Test

Framework

Pytest

Target Coverage

Minimal 80%.

---

# 19. Security

- JWT Authentication
- RBAC
- HTTPS
- Password Hashing (bcrypt)
- Rate Limiting
- Input Validation
- SQL Injection Protection
- XSS Protection
- CORS Configuration

---

# 20. Development Principles

Backend iRekon mengikuti prinsip berikut:

- Clean Architecture
- Separation of Concerns
- SOLID
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- API First
- Event Driven
- Asynchronous Processing
- Stateless Service
- Enterprise Ready

Seluruh business logic harus berada pada Service Layer agar mudah diuji, dipelihara, dan dikembangkan tanpa bergantung pada framework atau implementasi transport (HTTP, Worker, Scheduler, maupun CLI).