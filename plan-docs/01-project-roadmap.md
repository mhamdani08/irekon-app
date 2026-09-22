# iRekon Project Roadmap

Version : 1.0
Status  : Draft

---

# 1. Project Overview

iRekon adalah aplikasi rekonsiliasi transaksi yang bertujuan untuk membantu proses pencocokan data dari berbagai sumber (Bank, Core Banking, Switching, Payment Gateway, ERP, dan sistem lainnya) secara otomatis maupun manual.

Target utama sistem adalah:

- High Performance
- Asynchronous Processing
- Audit Trail
- Scalability
- Extensible Rule Engine
- Enterprise Ready

---

# 2. Technology Stack

| Layer | Technology |
|---------|------------|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS |
| State | Zustand |
| Data Fetching | TanStack Query |
| Backend | FastAPI |
| ORM | SQLAlchemy 2 |
| Validation | Pydantic v2 |
| Migration | Alembic |
| Database | PostgreSQL |
| Cache | Redis |
| Message Broker | RabbitMQ |
| Worker | Dramatiq |
| Storage | MinIO |
| Authentication | JWT + Refresh Token |
| Notification | WebSocket + Email |
| Logging | Loguru |
| Monitoring | Prometheus + Grafana |
| Deployment | Docker Compose → Kubernetes |

---

# 3. Development Phases

## Phase 1 - Foundation

Objective

Membangun seluruh infrastruktur aplikasi.

Deliverables

- Docker Compose
- PostgreSQL
- Redis
- RabbitMQ
- MinIO
- FastAPI
- NextJS
- Prometheus
- Grafana

---

## Phase 2 - Authentication

Deliverables

- Login
- JWT
- Refresh Token
- RBAC
- User Management

---

## Phase 3 - File Management

Deliverables

- Upload CSV
- Upload Excel
- File Metadata
- MinIO Integration

---

## Phase 4 - Background Processing

Deliverables

- RabbitMQ
- Dramatiq Worker
- Queue Monitoring
- Retry Mechanism

---

## Phase 5 - Parsing Engine

Deliverables

- CSV Parser
- Excel Parser
- Validation
- Batch Insert

---

## Phase 6 - Dashboard

Deliverables

- Dashboard
- Job Monitoring
- File Status
- Statistics

---

## Phase 7 - Notification

Deliverables

- Notification Center
- WebSocket
- Email Notification

---

## Phase 8 - Monitoring

Deliverables

- Prometheus
- Grafana
- Metrics Dashboard

---

# 4. Future Roadmap

Version 2

- Matching Engine
- Rule Engine
- Approval Workflow
- Scheduler
- Report Generator

Version 3

- Multi Source Connector
- REST API Integration
- SFTP Integration
- Webhook Integration

Version 4

- Multi Tenant
- HA Deployment
- Kubernetes
- Horizontal Scaling

---

# 5. Guiding Principles

Semua pengembangan mengikuti prinsip berikut:

- Clean Architecture
- SOLID Principle
- Domain Driven Design (Lightweight)
- API First
- Event Driven
- Asynchronous Processing
- Security by Design
- Testable Code
- Observable System

---

# 6. Success Criteria

MVP dianggap selesai apabila sistem mampu:

- Login
- Upload File
- Menyimpan File ke MinIO
- Parsing File
- Menjalankan Worker
- Menyimpan Data ke PostgreSQL
- Menampilkan Progress
- Mengirim Notification
- Monitoring Job