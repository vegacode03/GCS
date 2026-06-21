"""Relatório consolidado do período (Fase 4).

Agrega métricas da carteira (clientes, onboarding, QBRs, incidentes) para
apresentação ao gestor. Cálculos feitos em Python sobre os dados do
supabase-py — volume é de um único CSM, então não há gargalo.
"""

import calendar
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import get_current_user
from ..database import get_supabase

router = APIRouter(
    prefix="/relatorio",
    tags=["Relatório"],
    dependencies=[Depends(get_current_user)],
)


def _uid(user: dict) -> str:
    uid = user.get("sub")
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sem identificador de usuario")
    return uid


def _as_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def _periodo_bounds(periodo: str, ref: date, data_inicio: str | None, data_fim: str | None):
    """Retorna (inicio, fim, label) conforme o tipo de período."""
    if periodo == "mes_atual":
        ultimo = calendar.monthrange(ref.year, ref.month)[1]
        inicio, fim = ref.replace(day=1), ref.replace(day=ultimo)
        return inicio, fim, inicio.strftime("%m/%Y")
    if periodo == "trimestre":
        q = (ref.month - 1) // 3
        mes_ini = q * 3 + 1
        inicio = date(ref.year, mes_ini, 1)
        mes_fim = mes_ini + 2
        fim = date(ref.year, mes_fim, calendar.monthrange(ref.year, mes_fim)[1])
        return inicio, fim, f"{q + 1}º trimestre/{ref.year}"
    if periodo == "personalizado":
        if not data_inicio or not data_fim:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Periodo personalizado exige data_inicio e data_fim",
            )
        try:
            inicio, fim = date.fromisoformat(data_inicio), date.fromisoformat(data_fim)
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Datas invalidas (use YYYY-MM-DD)")
        if inicio > fim:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "data_inicio nao pode ser depois de data_fim")
        return inicio, fim, f"{inicio.strftime('%d/%m/%Y')} – {fim.strftime('%d/%m/%Y')}"
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Periodo invalido")


def _contar_incidentes(sb, uid: str, inicio: date, fim: date) -> int:
    """Incidentes do caderno (tipo 'erro'). A tabela só existe a partir da
    Fase 6 — se ainda não existir, retorna 0 sem quebrar o relatório."""
    try:
        res = (
            sb.table("caderno_entries")
            .select("criado_em, tipo")
            .eq("user_id", uid)
            .eq("tipo", "erro")
            .execute()
        )
    except Exception:
        return 0
    return sum(
        1
        for e in res.data
        if (d := _as_date(e.get("criado_em"))) and inicio <= d <= fim
    )


@router.get("")
def relatorio(
    user: dict = Depends(get_current_user),
    periodo: str = "mes_atual",
    data_inicio: str | None = None,
    data_fim: str | None = None,
    ref: str | None = None,
):
    uid = _uid(user)
    sb = get_supabase()

    hoje = date.fromisoformat(ref) if ref else datetime.now(timezone.utc).date()
    inicio, fim, label = _periodo_bounds(periodo, hoje, data_inicio, data_fim)

    # Clientes gerenciados no período (não arquivados, criados até o fim)
    todos = (
        sb.table("clients")
        .select("id, nome, produto, tier, status, criado_em")
        .eq("user_id", uid)
        .eq("arquivado", False)
        .execute()
        .data
    )
    clientes = [c for c in todos if (d := _as_date(c.get("criado_em"))) and d <= fim]

    # Etapas template (quais são obrigatórias) + progresso de cada cliente
    steps_tpl = sb.table("onboarding_steps").select("id, obrigatorio").execute().data
    obrigatorias = {s["id"] for s in steps_tpl if s["obrigatorio"]}

    ids = [c["id"] for c in clientes]
    client_steps = []
    if ids:
        client_steps = (
            sb.table("client_steps")
            .select("client_id, step_id, status, concluido_em")
            .in_("client_id", ids)
            .execute()
            .data
        )

    # Indexa etapas por cliente
    por_cliente: dict = {cid: [] for cid in ids}
    for cs in client_steps:
        por_cliente.setdefault(cs["client_id"], []).append(cs)

    jornada = []
    status_count: dict = {}
    onboardados = 0
    dias_onboarding: list[int] = []

    for c in clientes:
        steps = por_cliente.get(c["id"], [])
        total = len(steps)
        concluidas = sum(1 for s in steps if s["status"] == "concluido")
        progresso = round(100 * concluidas / total) if total else 0

        status_count[c["status"]] = status_count.get(c["status"], 0) + 1

        jornada.append(
            {
                "id": c["id"],
                "nome": c["nome"],
                "produto": c["produto"],
                "tier": c["tier"],
                "status": c["status"],
                "etapas_total": total,
                "etapas_concluidas": concluidas,
                "progresso": progresso,
            }
        )

        # Onboarding completo = todas as etapas obrigatórias concluídas
        obrig_do_cliente = [s for s in steps if s["step_id"] in obrigatorias]
        if obrig_do_cliente and all(s["status"] == "concluido" for s in obrig_do_cliente):
            onboardados += 1
            datas = [_as_date(s.get("concluido_em")) for s in obrig_do_cliente]
            datas = [d for d in datas if d]
            criado = _as_date(c.get("criado_em"))
            if datas and criado:
                dias_onboarding.append(max((max(datas) - criado).days, 0))

    total_clientes = len(clientes)
    taxa = round(100 * onboardados / total_clientes) if total_clientes else 0
    tempo_medio = round(sum(dias_onboarding) / len(dias_onboarding)) if dias_onboarding else None

    # QBRs concluídos no período
    qbrs = (
        sb.table("tasks")
        .select("concluido_em")
        .eq("user_id", uid)
        .eq("tipo", "qbr")
        .eq("status", "concluido")
        .execute()
        .data
    )
    qbrs_realizados = sum(
        1 for q in qbrs if (d := _as_date(q.get("concluido_em"))) and inicio <= d <= fim
    )

    return {
        "periodo": {
            "tipo": periodo,
            "inicio": inicio.isoformat(),
            "fim": fim.isoformat(),
            "label": label,
        },
        "total_clientes": total_clientes,
        "onboardados": onboardados,
        "em_andamento": total_clientes - onboardados,
        "taxa_conclusao_onboarding": taxa,
        "tempo_medio_onboarding_dias": tempo_medio,
        "clientes_por_status": status_count,
        "qbrs_realizados": qbrs_realizados,
        "incidentes_caderno": _contar_incidentes(sb, uid, inicio, fim),
        "jornada": sorted(jornada, key=lambda j: j["progresso"]),
    }
