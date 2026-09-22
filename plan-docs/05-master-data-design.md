# Master Data Design

Version : 1.0

Status : Draft

---

# 1. Overview

Master Data merupakan fondasi utama aplikasi iRekon.

Seluruh proses rekonsiliasi dikendalikan melalui konfigurasi yang disimpan pada Master Data sehingga penambahan jenis rekonsiliasi baru **tidak memerlukan perubahan kode aplikasi**.

Target utama desain ini adalah:

- Configurable
- Reusable
- Scalable
- Extensible
- Audit Ready

---

# 2. Objectives

Master Configuration harus mampu mendukung:

- Multiple Reconciliation Profile
- Multiple Data Source
- FTP / SFTP
- REST API
- Database Source
- Dynamic Scheduler
- Dynamic Field Mapping
- Dynamic Compare Rule
- Multi File Format
- Future Source Type

---

# 3. Module Overview

```
Reconciliation Profile
        │
        ├───────────────┐
        │               │
        ▼               ▼
Schedules         Sources
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
Connection Configuration       File Configuration
          │
          ▼
Field Mapping
          │
          ▼
Compare Rule
```

---

# 4. Master Tables

## 4.1 recon_profiles

Master seluruh jenis rekonsiliasi.

Contoh:

- PLN Settlement
- QRIS Settlement
- ATM Switching
- Virtual Account
- Core Banking vs GL

### Columns

| Column | Type | Description |
|----------|------|-------------|
| id | bigserial PK | Primary Key |
| recon_code | varchar(50) UNIQUE | Unique Code |
| recon_name | varchar(200) | Reconciliation Name |
| description | text | Description |
| timezone | varchar(50) | Timezone |
| is_active | boolean | Active Status |
| auto_approve | boolean | Auto Approval |
| retention_days | integer | Raw Data Retention |
| created_by | bigint FK | User |
| created_at | timestamp | Created Date |
| updated_at | timestamp | Updated Date |

---

## 4.2 recon_schedules

Menentukan kapan rekonsiliasi dijalankan.

Scheduler bersifat dinamis.

### Supported

- CRON
- Interval

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| recon_profile_id | bigint FK |
| schedule_type | varchar(20) |
| cron_expression | varchar(100) |
| interval_minutes | integer |
| is_active | boolean |
| next_run_at | timestamp |
| last_run_at | timestamp |
| created_at | timestamp |

---

## 4.3 recon_sources

Master sumber data.

Satu Reconciliation Profile dapat memiliki banyak Source.

Contoh

CORE

PARTNER

ERP

PAYMENT GATEWAY

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| recon_profile_id | bigint FK |
| source_role | varchar(20) |
| source_name | varchar(100) |
| source_type | varchar(20) |
| priority_order | integer |
| is_active | boolean |
| created_at | timestamp |

Supported Source Type

- FTP
- SFTP
- API
- Database

---

## 4.4 recon_source_connections

Konfigurasi koneksi.

Dipisahkan dari Source agar lebih aman.

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| source_id | bigint FK |
| host | varchar(255) |
| port | integer |
| username | varchar(255) |
| password_encrypted | text |
| database_name | varchar(100) |
| schema_name | varchar(100) |
| api_url | text |
| api_method | varchar(20) |
| private_key_path | text |
| timeout_seconds | integer |
| extra_config | jsonb |
| created_at | timestamp |

Future Enhancement

- Secret Vault
- Hashicorp Vault
- Azure Key Vault

---

## 4.5 recon_source_file_configs

Konfigurasi parser file.

Digunakan apabila Source berupa File.

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| source_id | bigint FK |
| file_pattern | varchar(255) |
| file_type | varchar(20) |
| delimiter | varchar(10) |
| enclosure_char | varchar(10) |
| escape_char | varchar(10) |
| has_header | boolean |
| encoding | varchar(50) |
| date_format | varchar(50) |
| decimal_separator | varchar(5) |
| thousand_separator | varchar(5) |
| archive_path | text |
| created_at | timestamp |

Supported Format

- CSV
- TXT
- Future: Excel
- Future: XML
- Future: JSON

---

## 4.6 recon_field_mappings

Melakukan mapping field dari Source menjadi Standard Model.

Tujuan utama agar semua proses compare menggunakan format yang sama.

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| recon_profile_id | bigint FK |
| source_id | bigint FK |
| source_field | varchar(100) |
| target_field | varchar(100) |
| data_type | varchar(30) |
| field_order | integer |
| is_key | boolean |
| is_compare | boolean |
| is_required | boolean |
| default_value | varchar(255) |
| transformation_rule | jsonb |
| created_at | timestamp |

Contoh

```
TRX_AMOUNT

↓

amount
```

```
TRX_DATE

↓

trx_date
```

Transformation Rule dapat berupa

- Uppercase
- Lowercase
- Trim
- Replace
- Date Format
- Custom Expression

---

## 4.7 recon_compare_rules

Rule compare bersifat configurable.

Tidak ada hardcode pada aplikasi.

### Columns

| Column | Type |
|----------|------|
| id | bigserial PK |
| recon_profile_id | bigint FK |
| field_name | varchar(100) |
| rule_type | varchar(50) |
| tolerance_value | numeric(18,2) |
| ignore_case | boolean |
| ignore_trim | boolean |
| null_equals_empty | boolean |
| custom_rule | jsonb |
| created_at | timestamp |

Supported Rule

- EXACT
- TOLERANCE
- REGEX (Future)
- SCRIPT (Future)

---

## 4.8 recon_statuses

Master seluruh status aplikasi.

Digunakan secara konsisten pada seluruh modul.

### Columns

| Column | Type |
|----------|------|
| id | bigint PK |
| status_code | varchar(50) |
| status_name | varchar(100) |

Contoh

```
ACTIVE

INACTIVE

PENDING

RUNNING

SUCCESS

FAILED

MATCHED

UNMATCHED

APPROVED

REJECTED
```

---

# 5. Relationship

```
recon_profiles
│
├── recon_schedules
│
├── recon_sources
│       │
│       ├── recon_source_connections
│       │
│       └── recon_source_file_configs
│
├── recon_field_mappings
│
└── recon_compare_rules
```

---

# 6. Development Sequence

Master Configuration akan dikembangkan dengan urutan berikut:

### Phase 1

- recon_profiles

### Phase 2

- recon_sources
- recon_source_connections

### Phase 3

- recon_source_file_configs

### Phase 4

- recon_field_mappings

### Phase 5

- recon_compare_rules

### Phase 6

- recon_schedules

### Phase 7

- recon_statuses

---

# 7. Future Enhancement

Master Configuration dirancang agar dapat dikembangkan tanpa mengubah struktur utama.

Rencana pengembangan berikutnya:

- Secret Manager Integration
- Dynamic SQL Source
- Dynamic REST API Authentication
- OAuth API Connector
- Multiple Compare Strategy
- JavaScript / Python Rule Engine
- Dynamic File Naming
- Multiple Scheduler per Profile
- Holiday Calendar
- Retry Policy
- File Encryption Configuration

---

# 8. Design Principles

Master Configuration harus memenuhi prinsip berikut:

- Configuration over Coding
- Single Source of Truth
- Extensible
- Versionable
- Audit Ready
- High Performance
- Easy Maintenance
- Enterprise Ready