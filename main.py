"""
GaiaPulse / Earth System Trend Detective v2 — FastAPI Application Entrypoint.
NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective", Dr. James Acker — NASA Goddard).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from nasa_client import close_shared_http_client
from presets import router as presets_router
from routers.analysis import router as analysis_router
from routers.system import api_status_payload
from routers.system import router as system_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)

FRONTEND_DIST_DIR = Path(__file__).resolve().parent / "frontend" / "dist"
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"

_REFERENCE_CACHE_PATHS = {"/api/presets", "/api/variables", "/api/v2/resources"}


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and graceful HTTP client shutdown."""
    yield
    await close_shared_http_client()


app = FastAPI(
    title="GaiaPulse — NASA Earth System Trend Detective API v2",
    description=(
        "Інтерактивна геопросторова аналітична платформа для NASA Space Apps Challenge 2026: "
        "каталог історичних феноменів д-ра Джеймса Екера та CSA (SWOT / RADARSAT), живі події NASA EONET v3, "
        "імпорт CSV із NASA Giovanni / AppEEARS / NOAA CDO, сезонна фільтрація (raw, deseasonalized, DJF, MAM, JJA, SON), "
        "Student's t-test, Mann-Kendall, Sen's Slope, 95% CI, STL-декомпозиція та Time-to-Significance Calculator."
    ),
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.middleware("http")
async def add_cache_control_headers(request: Request, call_next: Any) -> Response:
    """Attach Cache-Control headers for reference catalogs, phenomena, and hashed static assets."""
    response: Response = await call_next(request)
    if request.method in ("GET", "HEAD") and response.status_code == 200 and "cache-control" not in response.headers:
        path = request.url.path
        if path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif path in _REFERENCE_CACHE_PATHS:
            response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
        elif path == "/api/v2/fetch-phenomena":
            response.headers["Cache-Control"] = "public, max-age=300"
        elif response.headers.get("content-type", "").startswith("text/html"):
            response.headers["Cache-Control"] = "no-cache"
    return response


app.include_router(presets_router)
app.include_router(system_router)
app.include_router(analysis_router)


@app.get("/", tags=["System"], response_model=None)
async def root() -> Any:
    """Serve built React frontend when available, otherwise return API status."""
    if FRONTEND_INDEX_FILE.is_file():
        return FileResponse(FRONTEND_INDEX_FILE)
    return api_status_payload()


if (FRONTEND_DIST_DIR / "assets").is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST_DIR / "assets"),
        name="frontend-assets",
    )

if FRONTEND_INDEX_FILE.is_file():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve built frontend assets or SPA index.html for non-API routes."""
        if full_path == "api" or full_path.startswith("api/") or full_path in (
            "docs",
            "redoc",
            "openapi.json",
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        dist_root = FRONTEND_DIST_DIR.resolve()
        candidate = (FRONTEND_DIST_DIR / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(dist_root):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_INDEX_FILE)


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "8000")))
    uvicorn.run("main:app", host=host, port=port, reload=True)
