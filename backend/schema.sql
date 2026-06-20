-- ============================================================
-- GCS — Guia do Customer Success · Schema do banco (PostgreSQL/Supabase)
-- Rode este script no Supabase: SQL Editor > New query > Run.
-- Cobre o modelo de dados completo do manual (Fases 1 a 6).
-- ============================================================

-- Extensao para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- CLIENTES em onboarding
-- ------------------------------------------------------------
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  nome          text not null,
  empresa       text,
  email         text,
  whatsapp      text,
  produto       text not null check (produto in ('pix_ip', 'sub', 'paghub', 'pix_ip+paghub')),
  tier          text not null check (tier in ('small', 'middle', 'large', 'key')),
  status        text not null default 'onboarding'
                check (status in ('onboarding', 'integracao', 'aguardando_golive', 'operacional', 'em_risco', 'inativo')),
  health_score  text not null default 'verde'
                check (health_score in ('verde', 'amarelo', 'vermelho', 'preto')),
  arquivado     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ETAPAS FIXAS da jornada (template — igual para todos)
-- ------------------------------------------------------------
create table if not exists onboarding_steps (
  id          uuid primary key default gen_random_uuid(),
  ordem       int not null,
  titulo      text not null,
  descricao   text,
  obrigatorio boolean not null default false
);

-- ------------------------------------------------------------
-- PROGRESSO de cada cliente nas etapas
-- ------------------------------------------------------------
create table if not exists client_steps (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  step_id      uuid not null references onboarding_steps (id) on delete cascade,
  status       text not null default 'pendente'
               check (status in ('pendente', 'em_andamento', 'concluido')),
  concluido_em timestamptz,
  notas        text
);

-- ------------------------------------------------------------
-- ANOTACOES por etapa por cliente
-- ------------------------------------------------------------
create table if not exists annotations (
  id             uuid primary key default gen_random_uuid(),
  client_step_id uuid references client_steps (id) on delete cascade,
  client_id      uuid not null references clients (id) on delete cascade,
  texto          text not null,
  criado_em      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TAREFAS avulsas do dia a dia
-- ------------------------------------------------------------
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  client_id    uuid references clients (id) on delete set null,
  titulo       text not null,
  descricao    text,
  status       text not null default 'pendente' check (status in ('pendente', 'concluido')),
  prioridade   text not null default 'normal' check (prioridade in ('normal', 'urgente')),
  tipo         text not null default 'avulsa'
               check (tipo in ('bloco_analitico', 'onboarding', 'onboarding_call', 'check_in', 'qbr', 'alerta_saude', 'avulsa')),
  deadline     timestamptz,
  concluido_em timestamptz,
  criado_em    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SECOES do guia (estrutura fixa)
-- ------------------------------------------------------------
create table if not exists guide_sections (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('tecnico', 'script', 'operacional')),
  slug           text not null unique,
  titulo         text not null,
  ordem          int not null default 0,
  conteudo_fixo  text,
  status_tecnico text check (status_tecnico in ('testado', 'progresso', 'a_explorar'))
);

-- ------------------------------------------------------------
-- NOTAS editaveis por secao do guia
-- ------------------------------------------------------------
create table if not exists guide_notes (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references guide_sections (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  conteudo      text not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ENTRADAS do caderno de campo
-- ------------------------------------------------------------
create table if not exists caderno_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  tipo          text not null check (tipo in ('erro', 'processo', 'relato', 'print', 'script', 'outro')),
  titulo        text not null,
  conteudo      text,
  imagens       text[] default '{}',
  tags          text[] default '{}',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SEED — 6 etapas fixas da jornada
-- ------------------------------------------------------------
insert into onboarding_steps (ordem, titulo, descricao, obrigatorio)
select * from (values
  (1, 'Venda imediato', 'Dono: Comercial — CS monitora', false),
  (2, 'Onboarding documental e risco', 'Dono: Cadastro/Risco — CS acompanha', false),
  (3, 'Setup de conta + onboarding tecnico', 'Dono: CS — obrigatorio', true),
  (4, 'Go-live — primeiras transacoes', 'Dono: CS', true),
  (5, 'Pos-go-live 0-90 dias', 'Dono: CS', true),
  (6, 'Operacao continua e expansao', 'Dono: CS', true)
) as v(ordem, titulo, descricao, obrigatorio)
where not exists (select 1 from onboarding_steps);

-- ------------------------------------------------------------
-- INDICES uteis
-- ------------------------------------------------------------
create index if not exists idx_clients_user on clients (user_id);
create index if not exists idx_client_steps_client on client_steps (client_id);
create index if not exists idx_tasks_user on tasks (user_id);
create index if not exists idx_caderno_user on caderno_entries (user_id);

-- ============================================================
-- RLS (Row Level Security)
-- O backend usa a SERVICE ROLE KEY (ignora RLS), mas habilitar
-- RLS protege caso o frontend acesse direto via anon key.
-- ============================================================
alter table clients          enable row level security;
alter table tasks            enable row level security;
alter table caderno_entries  enable row level security;
alter table guide_notes      enable row level security;

-- Cada usuario enxerga apenas os proprios registros.
-- PostgreSQL nao suporta "create policy if not exists"; entao dropamos
-- a policy antes de recria-la (idempotente — pode rodar o script de novo).
drop policy if exists "clients_owner" on clients;
create policy "clients_owner" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_owner" on tasks;
create policy "tasks_owner" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "caderno_owner" on caderno_entries;
create policy "caderno_owner" on caderno_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "guide_notes_owner" on guide_notes;
create policy "guide_notes_owner" on guide_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
