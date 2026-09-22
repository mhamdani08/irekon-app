# iRekon System Architecture

Version : 1.0
Status  : Draft

---

# 1. High Level Architecture

                    +----------------------+
                    |      Browser         |
                    +----------+-----------+
                               |
                               |
                        Next.js Frontend
                               |
                     REST API / WebSocket
                               |
                    +----------v-----------+
                    |      FastAPI API     |
                    +----------+-----------+
                               |
     -------------------------------------------------------------
     |              |              |             |                |
     |              |              |             |                |
 PostgreSQL      Redis         RabbitMQ       MinIO       Prometheus
     |                              |
     |                              |
     |                     Dramatiq Workers
     |                              |
     +------------------------------+
                    |
                    |
             Notification Service
                    |
           +--------+--------+
           |                 |
       WebSocket         Email

---

# 2. System Components

## Frontend

Responsibilities

- Authentication
- Dashboard
- Upload File
- Monitoring
- Notification
- Reporting

Technology

- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query

---

## Backend API

Responsibilities

- Authentication
- Authorization
- Validation
- Business Logic
- REST API

Technology

- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

---

## PostgreSQL

Responsibilities

- Master Data
- Transaction Data
- Audit Trail
- Job Status

---

## Redis

Responsibilities

- Cache
- Session
- Temporary Data

---

## RabbitMQ

Responsibilities

- Job Queue
- Event Bus
- Retry
- Dead Letter Queue

Exchange

- rekon.upload
- rekon.parsing
- rekon.matching
- rekon.report
- rekon.notification

---

## Dramatiq Worker

Responsibilities

- File Parsing
- Matching
- Report Generation
- Notification

Workers

- parser_worker
- matching_worker
- report_worker
- notification_worker
- cleanup_worker

---

## MinIO

Responsibilities

- Uploaded Files
- Generated Reports
- Temporary Files

Bucket

uploads/
reports/
archive/
temp/

---

## Notification Service

Responsibilities

- WebSocket
- Email
- Future Push Notification

---

## Monitoring

Prometheus

Collect Metrics

Grafana

Visualization

Metrics

- API Response Time
- Worker Status
- Queue Length
- CPU
- Memory
- Database Connection

---

# 3. Data Flow

Upload File

↓

FastAPI

↓

Save Metadata

↓

Upload MinIO

↓

Publish RabbitMQ

↓

Parser Worker

↓

Store Transaction

↓

Update Job

↓

Notification

↓

Dashboard

---

# 4. Design Principles

## Stateless API

Semua request harus bersifat stateless.

Authentication menggunakan JWT.

---

## Event Driven

Setiap proses panjang dilakukan melalui RabbitMQ.

---

## Asynchronous Processing

Parsing, Matching, Reporting dijalankan oleh Worker.

---

## Separation of Concerns

Frontend

↓

API

↓

Worker

↓

Infrastructure

dipisahkan secara jelas.

---

## Scalability

Setiap komponen dapat di-scale secara independen.

Contoh

FastAPI

1 → 10 Instance

Worker

1 → 20 Instance

RabbitMQ

Cluster

PostgreSQL

Primary + Replica

---

# 5. Folder Structure

backend/

app/
api/
core/
models/
schemas/
services/
repositories/
workers/
utils/

frontend/

app/
components/
hooks/
store/
lib/
types/

infrastructure/

docker/
rabbitmq/
postgres/
redis/
minio/
grafana/
prometheus/

---

# 6. Architecture Goals

- Modular
- Maintainable
- High Performance
- Observable
- Secure
- Scalable
- Easy Deployment
- Enterprise Ready