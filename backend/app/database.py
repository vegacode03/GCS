"""Cliente Supabase compartilhado (service role) para o backend."""

from functools import lru_cache

from supabase import Client, create_client

from .config import settings


@lru_cache
def get_supabase() -> Client:
    """Retorna um cliente Supabase com a service role key.

    Usa lru_cache para reaproveitar a mesma conexao entre requisicoes.
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos no .env"
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)
