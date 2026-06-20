"""GCS — Backend FastAPI.

Fase 1: setup + health check + CORS.
As rotas de negocio (clientes, tarefas, jornada, guia, caderno) entram
a partir da Fase 2 em app/routers/.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import clientes

app = FastAPI(
    title="GCS API",
    description="Guia do Customer Success — Pagsmile IP",
    version="0.1.0",
)

# CORS — libera o frontend (Vercel / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de negocio
app.include_router(clientes.router)


@app.get("/health")
def health() -> dict:
    """Health check usado pelo Render e pelo frontend."""
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"app": "GCS API", "version": "0.1.0", "docs": "/docs"}
