# Identity & Access Management (IAM)

Version : 1.0
Status  : Draft

---

# 1. Overview

iRekon menggunakan **Role Based Access Control (RBAC)** sebagai mekanisme otorisasi.

Authentication dan Authorization dipisahkan secara jelas.

Authentication bertugas memverifikasi identitas pengguna.

Authorization bertugas menentukan apa saja yang boleh dilakukan oleh pengguna.

Sistem dirancang agar mendukung beberapa Authentication Provider:

- Local Database
- LDAP / Active Directory
- OAuth (Future)

Dengan desain ini, perusahaan dapat menggunakan Active Directory tanpa mengubah mekanisme RBAC aplikasi.

---

# 2. Design Principles

Identity Management mengikuti prinsip berikut:

- Authentication terpisah dari Authorization
- Mendukung Multi Authentication Provider
- Multiple Role per User
- Permission berbasis Action
- Menu dibangun secara dinamis
- Enterprise Ready
- Audit Ready

---

# 3. High Level Architecture

```
                +----------------+
                | Authentication |
                +--------+-------+
                         |
      +------------------+------------------+
      |                                     |
      |                                     |
   Local User                         LDAP / AD
      |                                     |
      +------------------+------------------+
                         |
                  Identity Verified
                         |
                         ▼
                Load User Profile
                         |
                         ▼
                  Load User Roles
                         |
                         ▼
               Load Permissions
                         |
                         ▼
                 Generate JWT
                         |
                         ▼
                  Access Application
```

---

# 4. Entity Relationship

```
Users
    │
    │ N
    ▼
User Roles
    │
    │ N
    ▼
Roles
    │
    │ N
    ▼
Role Permissions
    │
    │ N
    ▼
Permissions
    │
    │ N
    ▼
Menu Permissions
    │
    ▼
Menus
```

Future

```
Users
    │
    ▼
User Groups
    │
    ▼
Group Roles
    │
    ▼
Roles
```

---

# 5. Database Tables

## users

Master pengguna aplikasi.

| Column | Type | Description |
|----------|------|-------------|
| id | bigserial PK | Primary Key |
| username | varchar(100) UNIQUE | Login Username |
| employee_no | varchar(50) | Employee Number |
| full_name | varchar(200) | Full Name |
| email | varchar(255) | Email |
| password_hash | text | Password Hash |
| auth_provider | varchar(20) | LOCAL / LDAP / OAUTH |
| ldap_dn | text | LDAP Distinguished Name |
| is_active | boolean | Active Flag |
| last_login_at | timestamp | Last Login |
| created_at | timestamp | Created Date |
| updated_at | timestamp | Updated Date |

---

## roles

Master Role.

| Column | Type |
|----------|------|
| id | bigserial PK |
| role_code | varchar(50) UNIQUE |
| role_name | varchar(100) |
| description | text |
| is_system | boolean |
| created_at | timestamp |

Contoh

- SUPER_ADMIN
- ADMIN
- OPERATOR
- APPROVER
- AUDITOR
- VIEWER

---

## permissions

Master Permission.

Permission menggunakan format:

```
module.resource.action
```

Contoh

```
dashboard.view

user.create

user.update

user.delete

profile.view

profile.update

schedule.execute

job.retry

matching.execute

approval.execute

audit.view

report.export
```

Table

| Column | Type |
|----------|------|
| id | bigserial PK |
| permission_code | varchar(100) UNIQUE |
| permission_name | varchar(200) |
| module | varchar(100) |
| action | varchar(50) |
| description | text |

---

## permission_groups

Permission dikelompokkan berdasarkan modul agar lebih mudah dikelola pada halaman Role Management.

| Column | Type | Description |
|----------|------|-------------|
| id | bigserial PK | Primary Key |
| group_code | varchar(100) UNIQUE | Kode Group |
| group_name | varchar(200) | Nama Group |
| display_order | integer | Urutan Tampilan |
| description | text | Keterangan |

Contoh Data

| group_code | group_name |
|------------|------------|
| USER_MANAGEMENT | User Management |
| RECON_CONFIGURATION | Reconciliation Configuration |
| RECON_EXECUTION | Reconciliation Execution |
| REPORTING | Reporting |
| SYSTEM_ADMIN | System Administration |

---

## permissions

Permission selalu berada di bawah sebuah Permission Group.

Relationship

```
Permission Group
      │
      │ 1
      │
      ▼
Permissions
```

| Column | Type |
|----------|------|
| id | bigserial PK |
| permission_group_id | bigint FK |
| permission_code | varchar(100) UNIQUE |
| permission_name | varchar(200) |
| module | varchar(100) |
| action | varchar(50) |
| description | text |

## user_roles

Many-to-Many User dan Role.

| Column | Type |
|----------|------|
| id | bigserial PK |
| user_id | bigint FK |
| role_id | bigint FK |
| assigned_at | timestamp |
| assigned_by | bigint FK |

---

## role_permissions

Many-to-Many Role dan Permission.

| Column | Type |
|----------|------|
| id | bigserial PK |
| role_id | bigint FK |
| permission_id | bigint FK |

---

## menus

Master Menu.

Sidebar dibangun dari tabel ini.

| Column | Type |
|----------|------|
| id | bigserial PK |
| parent_id | bigint FK |
| menu_code | varchar(100) UNIQUE |
| menu_name | varchar(200) |
| route | varchar(255) |
| icon | varchar(100) |
| display_order | integer |
| is_visible | boolean |
| is_active | boolean |

Contoh

Dashboard

Configuration

Reconciliation

Jobs

Reports

Administration

---

## menu_permissions

Permission untuk mengakses menu.

| Column | Type |
|----------|------|
| id | bigserial PK |
| menu_id | bigint FK |
| permission_id | bigint FK |

Apabila user tidak memiliki permission tersebut maka menu tidak ditampilkan.

---

## auth_providers

Konfigurasi Authentication Provider.

| Column | Type |
|----------|------|
| id | bigserial PK |
| provider_name | varchar(100) |
| provider_type | varchar(20) |
| host | varchar(255) |
| port | integer |
| base_dn | text |
| bind_dn | text |
| bind_password | text |
| use_ssl | boolean |
| is_active | boolean |

Provider Type

- LOCAL
- LDAP
- OAUTH

---

## refresh_tokens

JWT Refresh Token.

| Column | Type |
|----------|------|
| id | bigserial PK |
| user_id | bigint FK |
| token_hash | text |
| expired_at | timestamp |
| revoked_at | timestamp |
| ip_address | varchar(100) |
| device_name | varchar(200) |

---

## login_histories

Audit Login.

| Column | Type |
|----------|------|
| id | bigserial PK |
| user_id | bigint FK |
| login_at | timestamp |
| logout_at | timestamp |
| ip_address | varchar(100) |
| user_agent | text |
| status | varchar(30) |
| failure_reason | text |

---

# 6. Authentication Flow

Form login aplikasi menggunakan **Single Login Form** tanpa opsi pemilih Authentication Provider (*no provider selector*). Backend secara otomatis menangani routing autentikasi (*Smart Authentication Routing*).

## Single Form Smart Authentication Flow

```
                     Input: Username & Password
                                 │
                                 ▼
                      Cari Username di Database
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           User Ditemukan               User Tidak Ditemukan
                 │                               │
        ┌────────┴────────┐                      ▼
        │                 │            Coba Authenticate LDAP
      LOCAL             LDAP                     │
        │                 │               ┌──────┴──────┐
        ▼                 ▼               │             │
 Verify bcrypt     LDAP Bind Check     Sukses         Gagal
     Hash           (Check Pass)          │             │
        │                 │               ▼             ▼
        │                 │        Auto-Provision  Return Error
        │                 │         (JIT Provisioning) "Username/Password
        │                 │               │             Salah"
        └────────┬────────┘               │
                 │                        │
                 └───────────┬────────────┘
                             │
                             ▼
                    Load Roles & Permissions
                             │
                             ▼
                        Generate JWT
```

## Detail Mekanisme Autentikasi

1. **User Local (Super Admin / Service Account / Internal User)**
   - Jika data user ditemukan di DB dengan `auth_provider = 'LOCAL'`, backend langsung memverifikasi hash password menggunakan `bcrypt`.
   - Menjamin akses darurat (*break-glass account*) tetap bisa login meskipun server LDAP sedang tidak dapat dijangkau.

2. **User LDAP Eksis**
   - Jika data user ditemukan di DB dengan `auth_provider = 'LDAP'`, backend melakukan *LDAP Bind* ke Active Directory/LDAP server menggunakan kredensial yang diinput.
   - Jika *LDAP Bind* berhasil, backend memuat role & permission dari DB aplikasi.

3. **User LDAP Baru (Just-In-Time / JIT Provisioning)**
   - Jika `username` tidak ditemukan di DB internal, backend akan mencoba autentikasi (*LDAP Bind*) ke LDAP Server.
   - Jika autentikasi LDAP berhasil:
     - User otomatis dibuatkan record baru pada tabel `users` (`auth_provider = 'LDAP'`).
     - Atribut user (nama lengkap, email, no pegawai) diisi dari atribut LDAP.
     - Diberikan Role default sistem (misal: `OPERATOR`).
     - Melanjutkan ke proses penerbitan JWT.
   - Jika autentikasi LDAP gagal:
     - Mengembalikan pesan kesalahan seragam *"Username atau password salah"*.

## Keamanan & Pengamanan Skenario

- **Unified Error Message**: Seluruh kegagalan autentikasi (user tidak ditemukan, password lokal salah, atau LDAP bind gagal) mengembalikan pesan kesalahan yang sama untuk mencegah *User Enumeration Attack*.
- **LDAP Downtime Fallback**: Kegagalan koneksi ke server LDAP dicatat pada log internal, sementara akun `LOCAL` tetap dapat berfungsi normal.
- **Authorization Separation**: LDAP hanya memverifikasi identitas (*Authentication*). Seluruh otorisasi (*Authorization*, *Roles*, & *Permissions*) dikelola sepenuhnya di database aplikasi.


---

# 7. Authorization Flow

```
Request

↓

JWT Validation

↓

Load Permission

↓

Permission Checker

↓

Allowed

↓

Execute Endpoint
```

---

# 8. Menu Authorization

Frontend tidak memiliki menu statis.

Flow

```
Login

↓

Get Current User

↓

Get Permissions

↓

Generate Sidebar

↓

Render Menu
```

Dengan pendekatan ini administrator cukup mengubah Role atau Permission tanpa melakukan deployment frontend.

---

# 9. Naming Convention

Permission

```
module.resource.action
```

Contoh

```
dashboard.view

user.view

user.create

user.update

user.delete

recon.profile.view

recon.profile.create

recon.run.execute

recon.run.retry

matching.execute

approval.execute

report.export

audit.view
```

Role

Gunakan huruf besar.

```
SUPER_ADMIN

ADMIN

OPERATOR

SUPERVISOR

APPROVER

AUDITOR

VIEWER
```

Menu Code

Gunakan snake_case.

```
dashboard

master_user

master_role

reconciliation

job_monitor

report
```

---

# 10. Future Enhancement

Untuk mendukung organisasi yang lebih besar, struktur RBAC dapat diperluas menjadi:

```
Company

↓

Department

↓

User Group

↓

Role

↓

Permission

↓

Menu
```

Dengan model tersebut administrator cukup memberikan Role kepada Group, kemudian User menjadi anggota Group.

---

# 11. Security Recommendation

- Password menggunakan bcrypt.
- JWT Access Token maksimal 30 menit.
- Refresh Token maksimal 7 hari.
- Seluruh komunikasi menggunakan HTTPS.
- Password tidak pernah dikembalikan melalui API.
- Refresh Token disimpan dalam bentuk hash.
- Login Activity dicatat pada login_histories.
- Seluruh perubahan Role dan Permission dicatat pada recon_audit_logs.

---

# 12. Design Goals

Modul Identity & Access Management harus memenuhi tujuan berikut:

- Enterprise Ready
- LDAP Compatible
- Multi Role per User
- Dynamic Menu
- Dynamic Permission
- Audit Ready
- Easy to Extend
- Stateless Authentication
- Secure by Default