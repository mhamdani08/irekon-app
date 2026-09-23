from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.roles import router as roles_router
from app.api.v1.menus import router as menus_router
from app.api.v1.recon_config import router as recon_config_router
from app.api.v1.recon_execution import router as recon_execution_router
from app.api.v1.recon_approval import router as recon_approval_router
from app.api.v1.recon_audit import router as recon_audit_router
from app.api.v1.dashboard import router as dashboard_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(menus_router)
api_v1_router.include_router(recon_config_router)
api_v1_router.include_router(recon_execution_router)
api_v1_router.include_router(recon_approval_router)
api_v1_router.include_router(recon_audit_router)
api_v1_router.include_router(dashboard_router)
