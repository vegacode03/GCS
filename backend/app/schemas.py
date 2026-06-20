"""Schemas Pydantic para validacao de entrada da Fase 2.

As respostas sao devolvidas como dicts vindos do Supabase (ja serializados),
entao aqui definimos apenas os modelos de *entrada* com os enums validados.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

Produto = Literal["pix_ip", "sub", "paghub", "pix_ip+paghub"]
Tier = Literal["small", "middle", "large", "key"]
ClientStatus = Literal[
    "onboarding", "integracao", "aguardando_golive", "operacional", "em_risco", "inativo"
]
HealthScore = Literal["verde", "amarelo", "vermelho", "preto"]
StepStatus = Literal["pendente", "em_andamento", "concluido"]


class ClientCreate(BaseModel):
    nome: str = Field(min_length=1)
    empresa: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    produto: Produto = "pix_ip"
    tier: Tier = "small"


class ClientUpdate(BaseModel):
    """Todos opcionais — atualiza apenas os campos enviados."""

    nome: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    produto: Optional[Produto] = None
    tier: Optional[Tier] = None
    status: Optional[ClientStatus] = None
    health_score: Optional[HealthScore] = None


class JornadaStepUpdate(BaseModel):
    status: StepStatus
    notas: Optional[str] = None


class AnotacaoCreate(BaseModel):
    client_step_id: str
    texto: str = Field(min_length=1)
