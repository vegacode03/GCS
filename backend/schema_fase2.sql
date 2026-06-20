-- ============================================================
-- GCS — Schema da Fase 2 (Clientes e Jornada de Onboarding)
-- Rode este arquivo no Supabase → SQL Editor → New query → Run.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- Extensao para gen_random_uuid() (ja vem habilitada no Supabase, mas garantimos)
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. CLIENTES
-- ------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  nome          text not null,
  empresa       text,
  email         text,
  whatsapp      text,
  produto       text not null default 'pix_ip'
                  check (produto in ('pix_ip', 'sub', 'paghub', 'pix_ip+paghub')),
  tier          text not null default 'small'
                  check (tier in ('small', 'middle', 'large', 'key')),
  status        text not null default 'onboarding'
                  check (status in ('onboarding', 'integracao', 'aguardando_golive',
                                    'operacional', 'em_risco', 'inativo')),
  health_score  text not null default 'verde'
                  check (health_score in ('verde', 'amarelo', 'vermelho', 'preto')),
  arquivado     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_clients_user on public.clients (user_id);

-- ------------------------------------------------------------
-- 2. ETAPAS DA JORNADA (template global — igual para todos)
-- ------------------------------------------------------------
create table if not exists public.onboarding_steps (
  id          uuid primary key default gen_random_uuid(),
  ordem       int  not null unique,
  titulo      text not null,
  descricao   text,
  obrigatorio boolean not null default false
);

-- Seed das 6 fases — so insere se a tabela estiver vazia.
-- Usa WHERE NOT EXISTS (nao depende de unique constraint), entao
-- funciona tanto num banco novo quanto num que ja tem as tabelas.
insert into public.onboarding_steps (ordem, titulo, descricao, obrigatorio)
select * from (values
  (1, 'Venda imediato',                     'Dono: Comercial — CS monitora',       false),
  (2, 'Onboarding documental e risco',      'Dono: Cadastro/Risco — CS acompanha', false),
  (3, 'Setup de conta + onboarding tecnico','Dono: CS — obrigatorio',              true),
  (4, 'Go-live — primeiras transacoes',     'Dono: CS',                            true),
  (5, 'Pos-go-live 0-90 dias',              'Dono: CS',                            true),
  (6, 'Operacao continua e expansao',       'Dono: CS',                            true)
) as v(ordem, titulo, descricao, obrigatorio)
where not exists (select 1 from public.onboarding_steps);

-- ------------------------------------------------------------
-- 3. PROGRESSO DE CADA CLIENTE NAS ETAPAS
-- ------------------------------------------------------------
create table if not exists public.client_steps (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  step_id     uuid not null references public.onboarding_steps (id) on delete cascade,
  status      text not null default 'pendente'
                check (status in ('pendente', 'em_andamento', 'concluido')),
  concluido_em timestamptz,
  notas       text,
  unique (client_id, step_id)
);

create index if not exists idx_client_steps_client on public.client_steps (client_id);

-- ------------------------------------------------------------
-- 4. ANOTACOES POR ETAPA
-- ------------------------------------------------------------
create table if not exists public.annotations (
  id             uuid primary key default gen_random_uuid(),
  client_step_id uuid not null references public.client_steps (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  texto          text not null,
  criado_em      timestamptz not null default now()
);

create index if not exists idx_annotations_step on public.annotations (client_step_id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (defesa em profundidade)
-- O backend usa a service_role key (que ignora RLS) e ja filtra
-- por user_id. Estas policies protegem caso a anon key seja usada.
-- ------------------------------------------------------------
alter table public.clients         enable row level security;
alter table public.onboarding_steps enable row level security;
alter table public.client_steps    enable row level security;
alter table public.annotations     enable row level security;

-- clients: dono ve/edita os seus
drop policy if exists "clients_owner" on public.clients;
create policy "clients_owner" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- onboarding_steps: template legivel por qualquer usuario autenticado
drop policy if exists "steps_read" on public.onboarding_steps;
create policy "steps_read" on public.onboarding_steps
  for select using (auth.role() = 'authenticated');

-- client_steps: acessivel se o cliente pertence ao usuario
drop policy if exists "client_steps_owner" on public.client_steps;
create policy "client_steps_owner" on public.client_steps
  for all using (
    exists (select 1 from public.clients c
            where c.id = client_steps.client_id and c.user_id = auth.uid())
  );

-- annotations: idem
drop policy if exists "annotations_owner" on public.annotations;
create policy "annotations_owner" on public.annotations
  for all using (
    exists (select 1 from public.clients c
            where c.id = annotations.client_id and c.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 6. Trigger para manter atualizado_em em clients
-- ------------------------------------------------------------
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_atualizado on public.clients;
create trigger trg_clients_atualizado
  before update on public.clients
  for each row execute function public.set_atualizado_em();
