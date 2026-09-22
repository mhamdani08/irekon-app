import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_v1_router
from app.exceptions.base import CustomException
from app.database.init_db import init_db

app = FastAPI(
    title="iRekon API",
    description="FastAPI Backend for iRekon Transaction Reconciliation & IAM System",
    version="1.0.0",
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom Exception Handler
@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "errors": exc.errors
        }
    )

# Run DB seeding on startup
@app.on_event("startup")
def startup_event():
    try:
        init_db()
    except Exception as e:
        print(f"[Main Startup] Exception initializing DB: {e}")

# Include API Router
app.include_router(api_v1_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "iRekon API with IAM/RBAC Module",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("APP_ENV", "development"),
        "postgres_host": os.getenv("POSTGRES_SERVER", "localhost"),
        "redis_host": os.getenv("REDIS_HOST", "localhost"),
        "rabbitmq_host": os.getenv("RABBITMQ_HOST", "localhost"),
    }
