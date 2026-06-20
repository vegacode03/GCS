"""Rotas de Clientes e Jornada de Onboarding (Fase 2).

Tudo via supabase-py (service role). A propriedade dos dados e garantida
filtrando por user_id extraido do JWT do Supabase (claim 'sub').
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import get_current_user
from ..database import get_supabase
from ..schemas import (
    AnotacaoCreate,
    ClientCreate,
    ClientUpdate,
    JornadaStepUpdate,
)

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)],
)


def _uid(user: dict) -> str:
    """Extrai o id do usuario do payload do JWT."""
    uid = user.get("sub")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sem identificador de usuario")
    return uid


def _get_owned_client(client_id: str, uid: str) -> dict:
    """Busca um cliente garantindo que pertence ao usuario, ou 404."""
    sb = get_supabase()
    res = (
        sb.table("clients")
        .select("*")
        .eq("id", client_id)
        .eq("user_id", uid)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente nao encontrado")
    return res.data[0]


# ------------------------------------------------------------------
# CRUD de clientes
# ------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, user: dict = Depends(get_current_user)):
    """Cria o cliente e gera automaticamente as 6 etapas da jornada."""
    sb = get_supabase()
    uid = _uid(user)

    res = sb.table("clients").insert({**payload.model_dump(), "user_id": uid}).execute()
    client = res.data[0]

    # Gera as etapas da jornada a partir do template global
    steps = sb.table("onboarding_steps").select("id").order("ordem").execute()
    if steps.data:
        sb.table("client_steps").insert(
            [{"client_id": client["id"], "step_id": s["id"]} for s in steps.data]
        ).execute()

    return client


@router.get("")
def list_clients(user: dict = Depends(get_current_user)):
    """Lista os clientes ativos do usuario, com o progresso da jornada."""
    sb = get_supabase()
    res = (
        sb.table("clients")
        .select("*")
        .eq("user_id", _uid(user))
        .eq("arquivado", False)
        .order("criado_em", desc=True)
        .execute()
    )
    clients = res.data
    if not clients:
        return clients

    # Uma unica consulta para o progresso de todos os clientes
    ids = [c["id"] for c in clients]
    steps = (
        sb.table("client_steps").select("client_id, status").in_("client_id", ids).execute()
    )
    total: dict = {}
    feitas: dict = {}
    for s in steps.data:
        cid = s["client_id"]
        total[cid] = total.get(cid, 0) + 1
        if s["status"] == "concluido":
            feitas[cid] = feitas.get(cid, 0) + 1

    for c in clients:
        c["etapas_total"] = total.get(c["id"], 0)
        c["etapas_concluidas"] = feitas.get(c["id"], 0)
    return clients


@router.get("/{client_id}")
def get_client(client_id: str, user: dict = Depends(get_current_user)):
    return _get_owned_client(client_id, _uid(user))


@router.patch("/{client_id}")
def update_client(
    client_id: str, payload: ClientUpdate, user: dict = Depends(get_current_user)
):
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nenhum campo para atualizar")

    sb = get_supabase()
    res = sb.table("clients").update(changes).eq("id", client_id).execute()
    return res.data[0]


@router.delete("/{client_id}", status_code=status.HTTP_200_OK)
def archive_client(client_id: str, user: dict = Depends(get_current_user)):
    """Arquiva o cliente (soft delete) em vez de apagar definitivamente."""
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    sb = get_supabase()
    sb.table("clients").update({"arquivado": True, "status": "inativo"}).eq(
        "id", client_id
    ).execute()
    return {"arquivado": True}


# ------------------------------------------------------------------
# Jornada
# ------------------------------------------------------------------
@router.get("/{client_id}/jornada")
def get_jornada(client_id: str, user: dict = Depends(get_current_user)):
    """Retorna as etapas da jornada do cliente, ordenadas por ordem."""
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    sb = get_supabase()
    res = (
        sb.table("client_steps")
        .select("*, onboarding_steps(*)")
        .eq("client_id", client_id)
        .execute()
    )
    # Ordena pela 'ordem' da etapa template (embed nao garante ordenacao)
    etapas = sorted(res.data, key=lambda s: s["onboarding_steps"]["ordem"])
    return etapas


@router.patch("/{client_id}/jornada/{step_id}")
def update_jornada_step(
    client_id: str,
    step_id: str,
    payload: JornadaStepUpdate,
    user: dict = Depends(get_current_user),
):
    """Atualiza o status de uma etapa (step_id = id em client_steps)."""
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    changes: dict = {"status": payload.status}
    if payload.notas is not None:
        changes["notas"] = payload.notas
    # Marca/desmarca o carimbo de conclusao conforme o status
    changes["concluido_em"] = (
        datetime.now(timezone.utc).isoformat() if payload.status == "concluido" else None
    )

    sb = get_supabase()
    res = (
        sb.table("client_steps")
        .update(changes)
        .eq("id", step_id)
        .eq("client_id", client_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Etapa nao encontrada")
    return res.data[0]


# ------------------------------------------------------------------
# Anotacoes
# ------------------------------------------------------------------
@router.post("/{client_id}/anotacoes", status_code=status.HTTP_201_CREATED)
def add_anotacao(
    client_id: str, payload: AnotacaoCreate, user: dict = Depends(get_current_user)
):
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    sb = get_supabase()
    # Garante que a etapa pertence a este cliente
    step = (
        sb.table("client_steps")
        .select("id")
        .eq("id", payload.client_step_id)
        .eq("client_id", client_id)
        .limit(1)
        .execute()
    )
    if not step.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Etapa nao encontrada")

    res = (
        sb.table("annotations")
        .insert(
            {
                "client_step_id": payload.client_step_id,
                "client_id": client_id,
                "texto": payload.texto,
            }
        )
        .execute()
    )
    return res.data[0]


@router.get("/{client_id}/anotacoes")
def list_anotacoes(client_id: str, user: dict = Depends(get_current_user)):
    """Lista todas as anotacoes do cliente (todas as etapas)."""
    uid = _uid(user)
    _get_owned_client(client_id, uid)

    sb = get_supabase()
    res = (
        sb.table("annotations")
        .select("*")
        .eq("client_id", client_id)
        .order("criado_em", desc=True)
        .execute()
    )
    return res.data
