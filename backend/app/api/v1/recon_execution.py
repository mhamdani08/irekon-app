from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Response, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_permissions
from app.services.recon_execution_service import ReconExecutionService
from app.schemas.recon_execution import (
    ReconRunTriggerRequest, ReconRunResponse, ReconMatchResultResponse
)
from app.schemas.response import BaseResponse
from app.models.user import User
from app.database.session import SessionLocal

def run_recon_background_task(run_id: UUID):
    db = SessionLocal()
    try:
        service = ReconExecutionService(db)
        service.process_run_execution(run_id)
    except Exception as e:
        print(f"[Background Task Error] Run {run_id} failed: {e}")
    finally:
        db.close()

router = APIRouter(prefix="/recon-execution", tags=["Reconciliation Execution Engine"])

@router.get("/runs", response_model=BaseResponse[List[ReconRunResponse]])
def list_runs(
    profile_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReconExecutionService(db)
    runs = service.list_runs(profile_id=profile_id, status=status, skip=skip, limit=limit)
    return BaseResponse(data=runs, message="Daftar eksekusi rekonsiliasi berhasil diambil")

@router.post("/runs/trigger", response_model=BaseResponse[ReconRunResponse])
def trigger_run(
    data: ReconRunTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.run.execute"]))
):
    service = ReconExecutionService(db)
    run = service.create_run_stub(data, user_id=current_user.id)
    background_tasks.add_task(run_recon_background_task, run.id)
    return BaseResponse(data=ReconRunResponse.from_orm(run), message="Eksekusi rekonsiliasi berhasil dipicu")

@router.get("/runs/{run_id}", response_model=BaseResponse[ReconRunResponse])
def get_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReconExecutionService(db)
    run = service.get_run(run_id)
    return BaseResponse(data=run, message="Detail eksekusi rekonsiliasi berhasil diambil")

@router.get("/runs/{run_id}/results", response_model=BaseResponse[List[ReconMatchResultResponse]])
def get_run_results(
    run_id: UUID,
    match_status: Optional[str] = Query("ALL"),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReconExecutionService(db)
    results = service.get_match_results(run_id=run_id, status_filter=match_status, skip=skip, limit=limit)
    return BaseResponse(data=results, message="Daftar hasil komparasi rekonsiliasi berhasil diambil")

@router.get("/runs/{run_id}/export")
def export_run_report(
    run_id: UUID,
    format: str = Query("excel", regex="^(excel|xlsx|csv|pdf|txt)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["recon.run.execute"]))
):
    service = ReconExecutionService(db)
    content, media_type, filename = service.export_run(run_id=run_id, export_format=format)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
