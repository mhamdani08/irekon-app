from app.database.session import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.role import Role, RolePermission
from app.models.permission import PermissionGroup, Permission
from app.models.menu import Menu, MenuPermission
from app.models.company import CompanyProfile
from app.models.recon_config import (
    ReconProfile, ReconSchedule, ReconSource, ReconSourceConnection,
    ReconSourceFileConfig, ReconFieldMapping, ReconCompareRule, ReconStatus
)

from app.core.security import get_password_hash
from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE recon_source_file_configs ADD COLUMN IF NOT EXISTS start_cell VARCHAR(10) DEFAULT 'A1';"))
        conn.execute(text("ALTER TABLE recon_source_file_configs ADD COLUMN IF NOT EXISTS sheet_name VARCHAR(100) DEFAULT 'Sheet1';"))
        conn.execute(text("ALTER TABLE recon_source_file_configs ADD COLUMN IF NOT EXISTS header_row INTEGER DEFAULT 1;"))
        conn.execute(text("ALTER TABLE recon_source_file_configs ADD COLUMN IF NOT EXISTS data_start_row INTEGER DEFAULT 2;"))
        conn.commit()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Role).filter(Role.role_code == "SUPER_ADMIN").first():
            print("[Init DB] Database is already seeded.")
            return

        print("[Init DB] Seeding Permission Groups & Permissions...")
        permission_groups_data = [
            {
                "group_code": "USER_MANAGEMENT",
                "group_name": "User & Role Management",
                "display_order": 1,
                "permissions": [
                    ("user.view", "View Users", "user", "view"),
                    ("user.create", "Create User", "user", "create"),
                    ("user.update", "Update User", "user", "update"),
                    ("user.delete", "Delete User", "user", "delete"),
                    ("role.view", "View Roles", "role", "view"),
                    ("role.create", "Create Role", "role", "create"),
                    ("role.update", "Update Role", "role", "update"),
                    ("role.delete", "Delete Role", "role", "delete"),
                ]
            },
            {
                "group_code": "RECON_CONFIGURATION",
                "group_name": "Reconciliation Configuration",
                "display_order": 2,
                "permissions": [
                    ("recon.profile.view", "View Recon Profile", "recon", "view"),
                    ("recon.profile.create", "Create Recon Profile", "recon", "create"),
                    ("recon.profile.update", "Update Recon Profile", "recon", "update"),
                ]
            },
            {
                "group_code": "RECON_EXECUTION",
                "group_name": "Reconciliation Execution & Job",
                "display_order": 3,
                "permissions": [
                    ("recon.run.execute", "Run Reconciliation", "recon", "execute"),
                    ("recon.run.retry", "Retry Failed Job", "recon", "retry"),
                    ("matching.execute", "Execute Matching", "matching", "execute"),
                    ("approval.execute", "Execute Approval", "approval", "execute"),
                    ("recon.approval.approve", "Approve Recon Mismatch", "recon", "approve"),
                    ("recon.approval.reject", "Reject Recon Mismatch", "recon", "reject"),
                    ("recon.adjustment.create", "Create Manual Adjustment", "recon", "adjust"),
                ]
            },
            {
                "group_code": "REPORTING",
                "group_name": "Reporting & Audit",
                "display_order": 4,
                "permissions": [
                    ("report.export", "Export Report", "report", "export"),
                    ("audit.view", "View Audit Logs", "audit", "view"),
                    ("dashboard.view", "View Dashboard", "dashboard", "view"),
                ]
            },
            {
                "group_code": "SYSTEM_ADMIN",
                "group_name": "System Administration",
                "display_order": 5,
                "permissions": [
                    ("schedule.execute", "Execute Schedule", "schedule", "execute"),
                    ("system.config", "System Config", "system", "config"),
                ]
            }
        ]

        all_permissions = []
        for g_data in permission_groups_data:
            group = PermissionGroup(
                group_code=g_data["group_code"],
                group_name=g_data["group_name"],
                display_order=g_data["display_order"]
            )
            db.add(group)
            db.flush()

            for code, name, module, action in g_data["permissions"]:
                perm = Permission(
                    permission_group_id=group.id,
                    permission_code=code,
                    permission_name=name,
                    module=module,
                    action=action
                )
                db.add(perm)
                db.flush()
                all_permissions.append(perm)

        print("[Init DB] Seeding Default Roles...")
        roles_data = [
            ("SUPER_ADMIN", "Super Administrator", "Full control of system", True),
            ("ADMIN", "System Administrator", "Administrative access", False),
            ("OPERATOR", "Recon Operator", "Operator to upload and run recon", False),
            ("APPROVER", "Recon Approver", "Approver for reconciliation results", False),
            ("AUDITOR", "Auditor", "Read-only access for compliance audit", False),
            ("VIEWER", "Viewer", "Basic view access", False),
        ]

        created_roles = {}
        for code, name, desc, is_sys in roles_data:
            role = Role(role_code=code, role_name=name, description=desc, is_system=is_sys)
            db.add(role)
            db.flush()
            created_roles[code] = role

        # Assign permissions to SUPER_ADMIN, ADMIN, APPROVER, AUDITOR
        for perm in all_permissions:
            db.add(RolePermission(role_id=created_roles["SUPER_ADMIN"].id, permission_id=perm.id))
            if perm.permission_code not in ["schedule.execute", "system.config"]:
                db.add(RolePermission(role_id=created_roles["ADMIN"].id, permission_id=perm.id))
            if perm.permission_code in ["dashboard.view", "recon.profile.view", "recon.run.execute", "recon.approval.approve", "recon.approval.reject", "audit.view", "report.export"]:
                db.add(RolePermission(role_id=created_roles["APPROVER"].id, permission_id=perm.id))
            if perm.permission_code in ["dashboard.view", "recon.profile.view", "audit.view", "report.export", "audit.view"]:
                db.add(RolePermission(role_id=created_roles["AUDITOR"].id, permission_id=perm.id))

        print("[Init DB] Seeding Master Menus...")
        menus_data = [
            {"code": "dashboard", "name": "Dashboard", "route": "/dashboard", "icon": "LayoutDashboard", "order": 1, "perm": "dashboard.view"},
            {"code": "recon_config", "name": "Master Configuration", "route": "/recon-config", "icon": "Sliders", "order": 2, "perm": "recon.profile.view"},
            {"code": "reconciliation", "name": "Reconciliation", "route": "/reconciliation", "icon": "GitCompare", "order": 3, "perm": "recon.run.execute"},
            {"code": "job_monitor", "name": "Job Monitor", "route": "/jobs", "icon": "Activity", "order": 4, "perm": "recon.run.execute"},
            {"code": "reports", "name": "Reports & Audit", "route": "/reports", "icon": "FileText", "order": 5, "perm": "report.export"},
            {"code": "iam_user", "name": "User Management", "route": "/iam/users", "icon": "Users", "order": 6, "perm": "user.view"},
            {"code": "iam_role", "name": "Role Management", "route": "/iam/roles", "icon": "ShieldCheck", "order": 7, "perm": "role.view"},
        ]

        perm_map = {p.permission_code: p.id for p in all_permissions}
        for m_data in menus_data:
            menu = Menu(
                menu_code=m_data["code"],
                menu_name=m_data["name"],
                route=m_data["route"],
                icon=m_data["icon"],
                display_order=m_data["order"],
                is_visible=True,
                is_active=True
            )
            db.add(menu)
            db.flush()

            if m_data["perm"] in perm_map:
                db.add(MenuPermission(menu_id=menu.id, permission_id=perm_map[m_data["perm"]]))

        print("[Init DB] Seeding Master Recon Statuses...")
        statuses = [
            ("ACTIVE", "Active"),
            ("INACTIVE", "Inactive"),
            ("PENDING", "Pending"),
            ("RUNNING", "Running"),
            ("SUCCESS", "Success"),
            ("FAILED", "Failed"),
            ("MATCHED", "Matched"),
            ("UNMATCHED", "Unmatched"),
            ("APPROVED", "Approved"),
            ("REJECTED", "Rejected")
        ]
        for s_code, s_name in statuses:
            db.add(ReconStatus(status_code=s_code, status_name=s_name))

        print("[Init DB] Creating Superadmin User...")
        superadmin = User(
            username="admin",
            full_name="System Administrator",
            email="admin@irekon.id",
            password_hash=get_password_hash("admin123"),
            auth_provider="LOCAL",
            is_active=True
        )
        db.add(superadmin)
        db.flush()

        # Assign SUPER_ADMIN role to superadmin
        db.add(UserRole(user_id=superadmin.id, role_id=created_roles["SUPER_ADMIN"].id))

        print("[Init DB] Seeding Sample Recon Profiles with 2 Sources (CORE & PARTNER)...")
        profile_pln = ReconProfile(
            recon_code="PLN_SETTLEMENT",
            recon_name="PLN Electricity Settlement",
            description="Reconciliation profile between Bank Core Banking System and PLN Biller Partner Host",
            timezone="Asia/Jakarta",
            is_active=True,
            auto_approve=False,
            retention_days=30,
            created_by=superadmin.id
        )
        db.add(profile_pln)
        db.flush()

        # 1. Source CORE (Bank Core Host)
        source_core = ReconSource(
            recon_profile_id=profile_pln.id,
            source_role="CORE",
            source_name="Bank Core Banking System",
            source_type="FILE",
            priority_order=1,
            is_active=True
        )
        db.add(source_core)
        db.flush()

        db.add(ReconSourceConnection(
            source_id=source_core.id,
            host="10.10.1.50",
            port=21,
            username="ftp_core_user",
            timeout_seconds=30
        ))

        db.add(ReconSourceFileConfig(
            source_id=source_core.id,
            file_pattern="BANK_CORE_{YYYYMMDD}.csv",
            file_type="CSV",
            delimiter=",",
            has_header=True,
            encoding="UTF-8",
            date_format="YYYY-MM-DD HH:mm:ss",
            archive_path="/var/archive/bank_core/"
        ))

        # Field Mappings for Source CORE
        core_mappings = [
            ("TRX_REF_NO", "reference_number", "STRING", 1, True, True, True, None),
            ("TRX_AMOUNT", "amount", "NUMBER", 2, False, True, True, "0"),
            ("TRX_TIMESTAMP", "transaction_date", "DATETIME", 3, False, True, True, None),
            ("HOST_STATUS", "status_code", "STRING", 4, False, True, True, "SUCCESS"),
        ]
        for s_f, t_f, d_t, f_o, i_k, i_c, i_r, d_v in core_mappings:
            db.add(ReconFieldMapping(
                recon_profile_id=profile_pln.id,
                source_id=source_core.id,
                source_field=s_f,
                target_field=t_f,
                data_type=d_t,
                field_order=f_o,
                is_key=i_k,
                is_compare=i_c,
                is_required=i_r,
                default_value=d_v
            ))

        # 2. Source PARTNER (PLN Biller Host)
        source_partner = ReconSource(
            recon_profile_id=profile_pln.id,
            source_role="PARTNER",
            source_name="PLN Switching Biller Host",
            source_type="SFTP",
            priority_order=2,
            is_active=True
        )
        db.add(source_partner)
        db.flush()

        db.add(ReconSourceConnection(
            source_id=source_partner.id,
            host="172.16.20.10",
            port=22,
            username="sftp_pln_partner",
            private_key_path="/etc/ssl/pln_sftp_rsa",
            timeout_seconds=30
        ))

        db.add(ReconSourceFileConfig(
            source_id=source_partner.id,
            file_pattern="PLN_BILLER_{YYYYMMDD}.txt",
            file_type="TXT",
            delimiter=";",
            has_header=True,
            encoding="UTF-8",
            date_format="YYYY-MM-DD HH:mm:ss",
            archive_path="/var/archive/pln_biller/"
        ))

        # Field Mappings for Source PARTNER
        partner_mappings = [
            ("BILLER_REF", "reference_number", "STRING", 1, True, True, True, None),
            ("TOTAL_BILL", "amount", "NUMBER", 2, False, True, True, "0"),
            ("SETTLEMENT_TIME", "transaction_date", "DATETIME", 3, False, True, True, None),
            ("RESP_CODE", "status_code", "STRING", 4, False, True, True, "00"),
        ]
        for s_f, t_f, d_t, f_o, i_k, i_c, i_r, d_v in partner_mappings:
            db.add(ReconFieldMapping(
                recon_profile_id=profile_pln.id,
                source_id=source_partner.id,
                source_field=s_f,
                target_field=t_f,
                data_type=d_t,
                field_order=f_o,
                is_key=i_k,
                is_compare=i_c,
                is_required=i_r,
                default_value=d_v
            ))

        # 3. Compare Rules for Normalized Target Fields
        compare_rules = [
            ("reference_number", "EXACT", 0.0, True, True, True),
            ("amount", "TOLERANCE_AMOUNT", 0.0, False, True, True),
            ("transaction_date", "TOLERANCE_TIME", 300.0, False, True, True),
            ("status_code", "EXACT", 0.0, True, True, True),
        ]
        for f_n, r_t, t_v, i_c, i_t, n_e in compare_rules:
            db.add(ReconCompareRule(
                recon_profile_id=profile_pln.id,
                field_name=f_n,
                rule_type=r_t,
                tolerance_value=t_v,
                ignore_case=i_c,
                ignore_trim=i_t,
                null_equals_empty=n_e
            ))

        db.commit()
        print("[Init DB] Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[Init DB] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
