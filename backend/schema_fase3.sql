-- ============================================================
-- GCS — Schema da Fase 3 (Home · Tarefas e visão diária)
-- Rode este arquivo no Supabase → SQL Editor → New query → Run.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. TAREFAS do dia a dia
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete set null,
  titulo       text not null,
  descricao    text,
  status       text not null default 'pendente'
                 check (status in ('pendente', 'concluido')),
  prioridade   text not null default 'normal'
                 check (prioridade in ('normal', 'urgente')),
  tipo         text not null default 'avulsa'
                 check (tipo in ('bloco_analitico', 'onboarding_call',
                                 'check_in', 'qbr', 'alerta_saude', 'avulsa')),
  deadline     date,
  concluido_em timestamptz,
  criado_em    timestamptz not null default now()
);

create index if not exists idx_tasks_user     on public.tasks (user_id);
create index if not exists idx_tasks_client   on public.tasks (client_id);
create index if not exists idx_tasks_deadline on public.tasks (deadline);

-- ------------------------------------------------------------
-- 2. ANOTAÇÕES por tarefa (histórico livre)
-- ------------------------------------------------------------
create table if not exists public.task_notes (
  id        uuid primary key default gen_random_uuid(),
  task_id   uuid not null references public.tasks (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  texto     text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_task_notes_task on public.task_notes (task_id);

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (defesa em profundidade)
-- O backend usa a service_role key (ignora RLS) e ja filtra por user_id.
-- ------------------------------------------------------------
alter table public.tasks      enable row level security;
alter table public.task_notes enable row level security;

drop policy if exists "tasks_owner" on public.tasks;
create policy "tasks_owner" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "task_notes_owner" on public.task_notes;
create policy "task_notes_owner" on public.task_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
