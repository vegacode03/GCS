"""Rotas de Tarefas, métricas do dashboard e geração de alertas (Fase 3).

Tudo via supabase-py (service role). A propriedade dos dados é garantida
filtrando por user_id extraído do JWT do Supabase (claim 'sub').
"""

import calendar
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import get_current_user
from ..database import get_supabase
from ..schemas import TaskCreate, TaskNoteCreate, TaskUpdate

router = APIRouter(
    prefix="/tarefas",
    tags=["Tarefas"],
    dependencies=[Depends(get_current_user)],
)
dashboard_router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)],
)

# Embed do cliente vinculado (para mostrar a tag na tarefa)
TASK_SELECT = "*, clients(nome, empresa, health_score, tier)"


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _uid(user: dict) -> str:
    uid = user.get("sub")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sem identificador de usuario")
    return uid


def _get_owned_task(task_id: str, uid: str) -> dict:
    sb = get_supabase()
    res = (
        sb.table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", uid)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarefa nao encontrada")
    return res.data[0]


def _validate_client(client_id: str | None, uid: str) -> None:
    """Se um cliente foi vinculado, garante que pertence ao usuario."""
    if not client_id:
        return
    sb = get_supabase()
    res = (
        sb.table("clients")
        .select("id")
        .eq("id", client_id)
        .eq("user_id", uid)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente vinculado nao encontrado")


def _ref_date(ref: str | None) -> date:
    """Data de referência (hoje no fuso do usuário, enviado pelo frontend)."""
    if ref:
        try:
            return date.fromisoformat(ref)
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Parametro 'ref' invalido (use YYYY-MM-DD)")
    return datetime.now(timezone.utc).date()


def _period_bounds(ref: date, period: str) -> tuple[date, date]:
    if period == "hoje":
        return ref, ref
    if period == "semana":
        inicio = ref - timedelta(days=ref.weekday())  # segunda
        return inicio, inicio + timedelta(days=6)  # domingo
    if period == "mes":
        ultimo = calendar.monthrange(ref.year, ref.month)[1]
        return ref.replace(day=1), ref.replace(day=ultimo)
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Periodo invalido")


def _as_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def _in_period(task: dict, inicio: date, fim: date) -> bool:
    """Pendente: aparece se vencida/sem data/dentro da janela (cumulativo até o fim).
    Concluída: aparece se foi concluída dentro da janela."""
    if task["status"] == "pendente":
        deadline = _as_date(task.get("deadline"))
        return deadline is None or deadline <= fim
    concluido = _as_date(task.get("concluido_em"))
    return concluido is not None and inicio <= concluido <= fim


def _fetch_tasks(uid: str) -> list[dict]:
    sb = get_supabase()
    return (
        sb.table("tasks")
        .select(TASK_SELECT)
        .eq("user_id", uid)
        .order("prioridade", desc=True)  # urgente antes de normal
        .order("deadline", desc=False)
        .execute()
        .data
    )


# ------------------------------------------------------------------
# CRUD de tarefas
# ------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, user: dict = Depends(get_current_user)):
    uid = _uid(user)
    _validate_client(payload.client_id, uid)
    sb = get_supabase()
    res = (
        sb.table("tasks")
        .insert({**payload.model_dump(mode="json"), "user_id": uid})
        .execute()
    )
    return res.data[0]


@router.get("")
def list_tasks(
    user: dict = Depends(get_current_user),
    status_: str | None = Query(None, alias="status"),
    tipo: str | None = None,
    client_id: str | None = None,
    data: str | None = None,
):
    sb = get_supabase()
    q = sb.table("tasks").select(TASK_SELECT).eq("user_id", _uid(user))
    if status_:
        q = q.eq("status", status_)
    if tipo:
        q = q.eq("tipo", tipo)
    if client_id:
        q = q.eq("client_id", client_id)
    if data:
        q = q.eq("deadline", data)
    return q.order("deadline", desc=False).execute().data


@router.get("/hoje")
def tasks_hoje(user: dict = Depends(get_current_user), ref: str | None = None):
    inicio, fim = _period_bounds(_ref_date(ref), "hoje")
    return [t for t in _fetch_tasks(_uid(user)) if _in_period(t, inicio, fim)]


@router.get("/semana")
def tasks_semana(user: dict = Depends(get_current_user), ref: str | None = None):
    inicio, fim = _period_bounds(_ref_date(ref), "semana")
    return [t for t in _fetch_tasks(_uid(user)) if _in_period(t, inicio, fim)]


@router.get("/mes")
def tasks_mes(user: dict = Depends(get_current_user), ref: str | None = None):
    inicio, fim = _period_bounds(_ref_date(ref), "mes")
    return [t for t in _fetch_tasks(_uid(user)) if _in_period(t, inicio, fim)]


@router.patch("/{task_id}")
def update_task(task_id: str, payload: TaskUpdate, user: dict = Depends(get_current_user)):
    uid = _uid(user)
    atual = _get_owned_task(task_id, uid)

    changes = payload.model_dump(mode="json", exclude_unset=True)
    if not changes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nenhum campo para atualizar")

    if "client_id" in changes:
        _validate_client(changes["client_id"], uid)

    # Carimbo de conclusão acompanha a mudança de status
    if "status" in changes and changes["status"] != atual["status"]:
        changes["concluido_em"] = (
            datetime.now(timezone.utc).isoformat()
            if changes["status"] == "concluido"
            else None
        )

    sb = get_supabase()
    res = sb.table("tasks").update(changes).eq("id", task_id).eq("user_id", uid).execute()
    return res.data[0]


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    uid = _uid(user)
    _get_owned_task(task_id, uid)
    sb = get_supabase()
    sb.table("tasks").delete().eq("id", task_id).eq("user_id", uid).execute()
    return {"removida": True}


# ------------------------------------------------------------------
# Anotações da tarefa
# ------------------------------------------------------------------
@router.get("/{task_id}/notas")
def list_task_notes(task_id: str, user: dict = Depends(get_current_user)):
    uid = _uid(user)
    _get_owned_task(task_id, uid)
    sb = get_supabase()
    return (
        sb.table("task_notes")
        .select("*")
        .eq("task_id", task_id)
        .order("criado_em", desc=True)
        .execute()
        .data
    )


@router.post("/{task_id}/notas", status_code=status.HTTP_201_CREATED)
def add_task_note(
    task_id: str, payload: TaskNoteCreate, user: dict = Depends(get_current_user)
):
    uid = _uid(user)
    _get_owned_task(task_id, uid)
    sb = get_supabase()
    res = (
        sb.table("task_notes")
        .insert({"task_id": task_id, "user_id": uid, "texto": payload.texto})
        .execute()
    )
    return res.data[0]


# ------------------------------------------------------------------
# Geração automática de alertas de saúde
# Cliente com health vermelho/preto (ou status em_risco) ganha uma tarefa
# de alerta de saúde — desde que ainda não exista uma pendente para ele.
# ------------------------------------------------------------------
@router.post("/gerar-alertas")
def gerar_alertas(user: dict = Depends(get_current_user)):
    uid = _uid(user)
    sb = get_supabase()

    clientes = (
        sb.table("clients")
        .select("id, nome, health_score, status")
        .eq("user_id", uid)
        .eq("arquivado", False)
        .execute()
        .data
    )
    em_risco = [
        c
        for c in clientes
        if c["health_score"] in ("vermelho", "preto") or c["status"] == "em_risco"
    ]
    if not em_risco:
        return {"criadas": 0}

    abertos = (
        sb.table("tasks")
        .select("client_id")
        .eq("user_id", uid)
        .eq("tipo", "alerta_saude")
        .eq("status", "pendente")
        .execute()
        .data
    )
    com_alerta = {t["client_id"] for t in abertos}

    novas = [
        {
            "user_id": uid,
            "client_id": c["id"],
            "titulo": f"Alerta de saúde: {c['nome']}",
            "descricao": "Cliente com health score crítico — revisar e acionar playbook de retenção.",
            "tipo": "alerta_saude",
            "prioridade": "urgente",
            "deadline": datetime.now(timezone.utc).date().isoformat(),
        }
        for c in em_risco
        if c["id"] not in com_alerta
    ]
    if novas:
        sb.table("tasks").insert(novas).execute()
    return {"criadas": len(novas)}


# ------------------------------------------------------------------
# Métricas do dashboard (Home)
# ------------------------------------------------------------------
@dashboard_router.get("/metricas")
def metricas(user: dict = Depends(get_current_user), ref: str | None = None):
    uid = _uid(user)
    sb = get_supabase()

    clientes = (
        sb.table("clients")
        .select("health_score")
        .eq("user_id", uid)
        .eq("arquivado", False)
        .execute()
        .data
    )
    health_scores = {"verde": 0, "amarelo": 0, "vermelho": 0, "preto": 0}
    for c in clientes:
        hs = c["health_score"]
        if hs in health_scores:
            health_scores[hs] += 1

    hoje = _ref_date(ref)
    inicio, fim = _period_bounds(hoje, "hoje")
    tarefas = _fetch_tasks(uid)
    do_dia = [t for t in tarefas if _in_period(t, inicio, fim)]
    onboarding_calls = [
        t
        for t in tarefas
        if t["tipo"] == "onboarding_call"
        and t["status"] == "pendente"
        and (_as_date(t.get("deadline")) is None or _as_date(t.get("deadline")) >= hoje)
    ]

    return {
        "clientes_ativos": len(clientes),
        "clientes_em_risco": health_scores["vermelho"] + health_scores["preto"],
        "health_scores": health_scores,
        "tarefas_hoje": {
            "total": len(do_dia),
            "concluidas": len([t for t in do_dia if t["status"] == "concluido"]),
        },
        "proximas_onboarding_calls": len(onboarding_calls),
    }
