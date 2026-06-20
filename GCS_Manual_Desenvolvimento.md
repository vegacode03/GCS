# GCS — Guia do Customer Success
## Manual de Desenvolvimento · Claude Code no VS Code

> **Como usar este manual:** Abra este arquivo no VS Code ao lado do terminal. A cada fase, copie o bloco de prompt indicado e cole diretamente no Claude Code. Siga a ordem das fases — cada uma depende da anterior.

---

## Visão geral do sistema

O **GCS (Guia do Customer Success)** é uma ferramenta de trabalho pessoal para o CSM da Pagsmile IP. Tem três pilares:

1. **Jornada do cliente** — acompanhar cada cliente nas 6 fases de onboarding com checklist, anotações e histórico
2. **Gerenciador de tarefas** — visão diária/semanal/mensal, rotina do bloco analítico e registro por etapa
3. **Guia de conhecimento** — documentação técnica da API Pagsmile + scripts de atendimento + caderno de campo

---

## Stack definida

| Camada | Tecnologia | Hospedagem | Custo |
|---|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Vercel | Gratuito |
| Backend | Python + FastAPI | Render | Gratuito |
| Banco de dados | PostgreSQL + Storage de imagens | Supabase | Gratuito |
| Autenticação | Supabase Auth (e-mail + senha) | Supabase | Gratuito |
| Repositório | GitHub (monorepo) | GitHub | Gratuito |
| Deploy | Push na main = deploy automático | Vercel + Render | Gratuito |

---

## Estrutura de pastas do projeto

```
gcs/
├── frontend/              ← React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Clientes.jsx
│   │   │   ├── ClienteDetalhe.jsx
│   │   │   ├── Relatorio.jsx
│   │   │   ├── Guia.jsx
│   │   │   └── Caderno.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── TaskItem.jsx
│   │   │   ├── ClienteCard.jsx
│   │   │   ├── JornadaStep.jsx
│   │   │   ├── HealthBadge.jsx
│   │   │   └── PillStatus.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js    ← cliente Supabase
│   │   │   └── api.js         ← chamadas ao backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local
│   ├── vite.config.js
│   └── package.json
│
├── backend/               ← FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── clientes.py
│   │       ├── tarefas.py
│   │       ├── jornada.py
│   │       ├── anotacoes.py
│   │       └── guia.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## Modelo de dados (banco de dados)

```sql
-- Usuários (gerenciado pelo Supabase Auth)
users: id, email, created_at

-- Clientes em onboarding
clients:
  id, user_id, nome, empresa, email, whatsapp,
  produto (pix_ip | sub | paghub | pix_ip+paghub),
  tier (small | middle | large | key),
  status (onboarding | integracao | aguardando_golive | operacional | em_risco | inativo),
  health_score (verde | amarelo | vermelho | preto),
  criado_em, atualizado_em

-- Etapas fixas da jornada (template — igual para todos)
onboarding_steps:
  id, ordem, titulo, descricao, obrigatorio

-- Progresso de cada cliente nas etapas
client_steps:
  id, client_id, step_id, status (pendente | em_andamento | concluido),
  concluido_em, notas

-- Anotações por etapa por cliente
annotations:
  id, client_step_id, client_id, texto, criado_em

-- Tarefas avulsas do dia a dia
tasks:
  id, user_id, client_id (nullable), titulo, descricao,
  status (pendente | concluido), prioridade (normal | urgente),
  tipo (bloco_analitico | onboarding | check_in | qbr | alerta_saude | avulsa),
  deadline, concluido_em, criado_em

-- Seções do guia (estrutura fixa)
guide_sections:
  id, tipo (tecnico | script | operacional), slug, titulo,
  ordem, conteudo_fixo (Markdown), status_tecnico (testado | progresso | a_explorar)

-- Notas editáveis por seção do guia
guide_notes:
  id, section_id, user_id, conteudo (Markdown), criado_em, atualizado_em

-- Entradas do caderno de campo
caderno_entries:
  id, user_id, tipo (erro | processo | relato | print | script),
  titulo, conteudo (Markdown), imagens (array de URLs), tags,
  criado_em, atualizado_em
```

---

## Fases de desenvolvimento

---

### FASE 1 — Setup completo do projeto

**Objetivo:** repositório no GitHub, projeto React funcionando na Vercel, FastAPI no Render, banco no Supabase e login funcionando.

**Pré-requisitos antes de começar:**
- Conta criada no [GitHub](https://github.com)
- Conta criada no [Vercel](https://vercel.com) (conectar com GitHub)
- Conta criada no [Render](https://render.com) (conectar com GitHub)
- Conta criada no [Supabase](https://supabase.com) — criar projeto chamado `gcs`
- Node.js instalado (`node -v` deve retornar versão)
- Python 3.11+ instalado (`python --version`)

---

#### Prompt Fase 1 — cole no Claude Code:

```
Vamos criar o projeto GCS (Guia do Customer Success) do zero.

Crie a estrutura completa de um monorepo com duas pastas: /frontend e /backend.

FRONTEND:
- React + Vite + Tailwind CSS
- React Router DOM para navegação
- @supabase/supabase-js para autenticação e banco
- Estrutura de pastas: src/pages, src/components, src/lib
- Tela de Login funcional com e-mail e senha usando Supabase Auth
- Após login, redirecionar para /home
- Sidebar com navegação: Home, Clientes, Relatório, Guia da API, Caderno
- Topbar com título da página atual e nome do usuário logado
- Dark mode nativo via Tailwind (classe 'dark' no html)
- Variáveis de ambiente em .env.local:
  VITE_SUPABASE_URL=sua_url
  VITE_SUPABASE_ANON_KEY=sua_key
  VITE_API_URL=url_do_backend

BACKEND:
- Python + FastAPI + Uvicorn
- Conexão com Supabase via supabase-py
- Middleware CORS configurado para aceitar o domínio da Vercel
- Rota GET /health retornando {"status": "ok"}
- Variáveis de ambiente em .env:
  SUPABASE_URL=sua_url
  SUPABASE_SERVICE_KEY=sua_service_key
- requirements.txt com todas as dependências

README.md na raiz com instruções de como rodar localmente.

Após criar tudo, me diga exatamente o que preciso configurar no Supabase, Vercel e Render para subir o projeto.
```

---

**Após rodar a Fase 1, configure:**

1. **Supabase** → Authentication → Email confirmations: desabilitar (facilita testes)
2. **Supabase** → SQL Editor → rodar o schema de banco (Claude Code vai gerar)
3. **Vercel** → importar repositório GitHub → pasta raiz: `frontend` → adicionar variáveis de ambiente
4. **Render** → New Web Service → repositório GitHub → pasta raiz: `backend` → `uvicorn app.main:app --host 0.0.0.0 --port 10000`

---

### FASE 2 — Clientes e Jornada de Onboarding

**Objetivo:** cadastrar clientes, ver a jornada com as 6 fases, marcar etapas e adicionar anotações.

**Contexto importante para o Claude Code:**

As 6 fases da jornada são:
1. Venda imediato (dono: Comercial — CS monitora)
2. Onboarding documental e risco (dono: Cadastro/Risco — CS acompanha)
3. Setup de conta + onboarding técnico (dono: CS — obrigatório)
4. Go-live — primeiras transações (dono: CS)
5. Pós-go-live 0–90 dias (dono: CS)
6. Operação contínua e expansão (dono: CS)

CS é dono ativo a partir da fase 3. Fases 1 e 2 são monitoramento.

Os produtos são: `pix_ip`, `sub`, `paghub`, `pix_ip+paghub`

Os tiers são: `small`, `middle`, `large`, `key`

Os status do cliente são: `onboarding`, `integracao`, `aguardando_golive`, `operacional`, `em_risco`, `inativo`

O health score tem 4 cores: verde (manter cadência), amarelo (agendar check-in adicional), vermelho (ativar playbook de retenção), preto (ação imediata + acionar coordenador).

---

#### Prompt Fase 2 — cole no Claude Code:

```
Implemente a funcionalidade completa de Clientes e Jornada no projeto GCS.

BACKEND — rotas necessárias:
POST   /clientes              → criar cliente
GET    /clientes              → listar clientes do usuário logado
GET    /clientes/{id}         → detalhe do cliente
PATCH  /clientes/{id}         → atualizar status, health_score, tier, produto
DELETE /clientes/{id}         → arquivar cliente
GET    /clientes/{id}/jornada → etapas da jornada com status
PATCH  /clientes/{id}/jornada/{step_id} → atualizar status de uma etapa
POST   /clientes/{id}/anotacoes         → adicionar anotação em uma etapa
GET    /clientes/{id}/anotacoes         → listar anotações do cliente

Ao criar um cliente, gerar automaticamente as 6 etapas da jornada associadas a ele no banco.

FRONTEND — telas:
Página /clientes:
- Lista de clientes em cards com: nome, produto (Pix IP / Sub / Paghub), tier, status com cor, barra de progresso (etapas concluídas / total), health score colorido
- Botão "Novo cliente" abrindo modal com formulário: nome, empresa, e-mail, WhatsApp, produto, tier
- Ao clicar no card, abrir painel lateral com a jornada completa

Painel de jornada do cliente:
- 6 etapas em sequência com ícone de status (pendente / em andamento / concluído)
- Fases 1 e 2 marcadas como "monitoramento" (cinza), fases 3 a 6 como "dono: CS" (azul)
- Botão para marcar etapa como concluída
- Campo de texto para adicionar anotação em cada etapa
- Histórico de anotações da etapa abaixo do campo

Autenticação: todas as rotas protegidas — verificar JWT do Supabase no header Authorization.
```

---

### FASE 3 — Home · Tarefas e visão diária

**Objetivo:** tela principal com métricas, lista de tarefas do dia/semana/mês e carteira com alertas.

**Contexto para o Claude Code:**

A rotina diária tem dois blocos:
- **Manhã (bloco analítico):** revisar Metabase, verificar flags no motor de segmentação, tickets críticos no Zendesk, atualizar HubSpot
- **Restante do dia:** calls com clientes, onboarding calls, follow-ups

Tipos de tarefa: `bloco_analitico`, `onboarding_call`, `check_in`, `qbr`, `alerta_saude`, `avulsa`

Alertas automáticos que o sistema deve gerar:
- Cliente com flag `em_risco` → gera tarefa de alerta de saúde
- Onboarding call pendente há mais de 48h (clientes Middle) → gera alerta
- Cliente com health score vermelho ou preto → aparece destacado na carteira

---

#### Prompt Fase 3 — cole no Claude Code:

```
Implemente a tela Home e o gerenciador de tarefas completo no projeto GCS.

BACKEND — rotas:
POST  /tarefas              → criar tarefa
GET   /tarefas              → listar tarefas com filtros: data, status, tipo, client_id
PATCH /tarefas/{id}         → atualizar (marcar como concluída, editar, prioridade)
DELETE /tarefas/{id}        → remover tarefa
GET   /tarefas/hoje         → tarefas do dia atual
GET   /tarefas/semana       → tarefas da semana atual
GET   /tarefas/mes          → tarefas do mês atual
GET   /dashboard/metricas   → retornar: total de clientes, tarefas hoje, clientes em risco, health scores

FRONTEND — tela /home:
Topbar: "Bom dia, [nome]" com data atual

4 cards de métricas no topo:
- Clientes ativos
- Tarefas hoje (concluídas / total)
- Clientes em risco (health vermelho ou preto)
- Próximas onboarding calls

Duas colunas:
Coluna esquerda — lista de tarefas com abas: Hoje / Semana / Mês
- Cada tarefa: checkbox para marcar como feita, texto, tag do cliente vinculado, badge de tipo
- Tarefa concluída: riscada e esmaecida
- Botão "Nova tarefa" com modal: título, cliente (opcional), tipo, deadline, prioridade
- Campo de anotação livre por tarefa (clicável — abre campo de texto)
- Histórico de anotações da tarefa

Coluna direita — carteira com ação pendente
- Clientes ordenados por urgência: preto → vermelho → amarelo → verde
- Mostrar produto, tier, status e health score de cada um
- Clicar leva para /clientes/:id

Dark mode: todos os componentes devem funcionar em modo escuro.
```

---

### FASE 4 — Relatório

**Objetivo:** dashboard visual com dados do período e geração de relatório exportável para apresentar ao gestor.

---

#### Prompt Fase 4 — cole no Claude Code:

```
Implemente a tela de Relatório no projeto GCS.

BACKEND:
GET /relatorio?periodo=mes_atual|trimestre|personalizado&data_inicio=&data_fim=
Retornar:
- Total de clientes gerenciados no período
- Clientes por status (onboarding, go-live, operacional, em risco)
- Taxa de conclusão de onboarding
- Tempo médio de onboarding (dias)
- Jornada por cliente: nome, produto, tier, etapas concluídas, % progresso, status
- QBRs realizados no período
- Incidentes registrados no caderno

FRONTEND — tela /relatorio:
Filtro de período: mês atual / trimestre / personalizado (date picker)

4 cards de métricas: clientes onboardados, em andamento, taxa de conclusão, tempo médio

Tabela de jornada por cliente com barra de progresso e badge de status

Bloco "Resumo para o gestor": texto editável gerado automaticamente com os dados do período. O texto deve ser pré-preenchido com as métricas reais mas permitir edição livre antes de exportar.

Botão "Exportar PDF": gerar PDF do relatório com os dados e o resumo do gestor. Usar a biblioteca jsPDF ou react-pdf no frontend para gerar o PDF sem precisar de backend.

O PDF deve ter:
- Cabeçalho com logo GCS e período
- Cards de métricas
- Tabela de clientes
- Resumo do gestor
- Rodapé com data de geração e nome do CSM
```

---

### FASE 5 — Guia da API

**Objetivo:** documentação técnica da API Pagsmile com exemplos de código e status por seção.

**Seções fixas do guia técnico:**
1. Criação de conta (campos obrigatórios, JSON de exemplo)
2. Criação de app (credenciais, tenant)
3. Autenticação (x-api-key, HMAC SHA256)
4. Endpoints (pagamentos, consultas, status)
5. Webhooks (eventos, callbacks, validação)
6. Sandbox vs produção (diferenças, ambientes)

**Scripts de atendimento (seções do caderno de scripts):**
1. Boas-vindas
2. Onboarding call (7 blocos)
3. Check-in recorrente
4. QBR — Quarterly Business Review
5. Alerta de saúde (gatilhos, WhatsApp, e-mail, call)
6. Oferta de novo produto
7. Churn e winback

---

#### Prompt Fase 5 — cole no Claude Code:

```
Implemente a tela Guia da API no projeto GCS.

BACKEND:
GET    /guia/secoes          → listar seções com tipo e status
GET    /guia/secoes/{slug}   → conteúdo completo de uma seção (Markdown)
POST   /guia/notas           → salvar nota editável em uma seção
GET    /guia/notas/{section_id} → listar notas da seção
PATCH  /guia/notas/{id}      → editar nota
DELETE /guia/notas/{id}      → remover nota

Fazer seed das seções fixas na primeira inicialização do banco.
As seções técnicas têm conteúdo_fixo em Markdown (não editável pelo usuário).
As notas são editáveis e ficam abaixo do conteúdo fixo.

FRONTEND — tela /guia:
Duas colunas lado a lado:

Coluna esquerda — Documentação técnica:
- Lista de seções: ícone colorido, título, subtítulo, badge de status (testado / em progresso / a explorar)
- Ao clicar: abrir painel com conteúdo em Markdown renderizado (usar react-markdown)
- Bloco de código com syntax highlighting (usar react-syntax-highlighter)
- Abaixo do conteúdo fixo: campo de notas editável pelo usuário (editor simples de texto)
- Histórico de notas da seção com data

Coluna direita — Scripts de atendimento:
- Lista de scripts com ícone e descrição
- Ao clicar: abrir o roteiro completo em Markdown renderizado
- Campo para notas pessoais do CSM sobre aquele script

Barra de busca no topo que filtra seções por título ou conteúdo.
```

---

### FASE 6 — Caderno de Campo

**Objetivo:** repositório de conhecimento operacional com texto livre, upload de imagens e tags.

---

#### Prompt Fase 6 — cole no Claude Code:

```
Implemente a tela Caderno de Campo no projeto GCS.

BACKEND:
POST   /caderno              → criar entrada
GET    /caderno              → listar entradas com filtros: tipo, tags, busca por texto
GET    /caderno/{id}         → detalhe da entrada
PATCH  /caderno/{id}         → editar entrada
DELETE /caderno/{id}         → remover entrada
POST   /caderno/{id}/imagens → upload de imagem para Supabase Storage, retornar URL pública

Tipos de entrada: erro | processo | relato | script | print | outro

FRONTEND — tela /caderno:
Lista de entradas em cards com: tipo (badge colorido), título, data, trecho do conteúdo, tags

Filtros: por tipo, por tag, busca livre

Botão "Nova entrada" com formulário:
- Tipo (dropdown)
- Título
- Conteúdo: editor de texto com suporte a Markdown (usar @uiw/react-md-editor ou similar)
- Upload de imagens: arrastar e soltar ou clicar, preview das imagens antes de salvar, limite de 5 imagens por entrada
- Tags: campo livre com sugestões das tags já usadas

Visualização de entrada:
- Conteúdo renderizado em Markdown
- Imagens em galeria clicável (lightbox simples)
- Botão editar e deletar
- Data de criação e última atualização

Busca: ao digitar, filtrar em tempo real por título, conteúdo e tags.
```

---

### FASE 7 — Dark mode, ajustes finais e deploy

**Objetivo:** polimento visual, dark mode completo, deploy estável e testes finais.

---

#### Prompt Fase 7 — cole no Claude Code:

```
Fase final do projeto GCS. Faça os ajustes de polimento e prepare o deploy.

1. DARK MODE:
Garantir que todas as telas funcionam corretamente em dark mode.
Usar Tailwind dark: prefix em todos os componentes.
Toggle de dark/light mode no topbar, salvando preferência no localStorage.
Testar em todas as páginas: Home, Clientes, Relatório, Guia, Caderno.

2. RESPONSIVIDADE BÁSICA:
O sistema é desktop-first mas deve ser minimamente usável em telas de 1024px+.
Sidebar deve colapsar em tela menor com ícones apenas.

3. LOADING STATES:
Adicionar skeleton loading em todas as listas (clientes, tarefas, entradas do caderno).
Indicador de loading nos botões de salvar.
Toast de sucesso/erro em todas as ações (usar react-hot-toast ou similar).

4. VARIÁVEIS DE AMBIENTE — checklist:
Verificar que .env.local (frontend) e .env (backend) têm todas as variáveis necessárias.
Confirmar que nenhuma chave de API está hardcoded no código.

5. DEPLOY VERCEL:
Confirmar que vite.config.js tem o base path correto.
Confirmar que todas as rotas do React Router funcionam com refresh (configurar rewrites no vercel.json).

vercel.json deve conter:
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

6. DEPLOY RENDER:
Confirmar que o backend tem health check na rota GET /health.
Confirmar que o CORS está liberado para o domínio da Vercel em produção.
Start command: uvicorn app.main:app --host 0.0.0.0 --port 10000

7. TESTES FINAIS — checklist manual:
[ ] Login com e-mail e senha funciona
[ ] Logout funciona e redireciona para /login
[ ] Criar cliente novo funciona
[ ] Marcar etapa da jornada como concluída funciona
[ ] Criar tarefa e marcar como feita funciona
[ ] Adicionar anotação em tarefa funciona
[ ] Relatório carrega com dados reais
[ ] Exportar PDF funciona
[ ] Guia da API renderiza Markdown corretamente
[ ] Upload de imagem no caderno funciona
[ ] Dark mode funciona em todas as telas
[ ] Deploy na Vercel e Render estáveis
```

---

## Referências importantes para o Claude Code

### Regras de negócio que o Claude Code precisa saber

**Jornada:**
- CS é dono ativo a partir da fase 3
- Onboarding call é obrigatória para Middle em até 48h após ativação da conta
- Para Large e Key: kick-off formal, presença do Coordenador
- Ao concluir a fase 3, gerar automaticamente tarefa de acompanhamento de go-live

**Health score:**
- Verde → manter cadência normal
- Amarelo → agendar check-in adicional
- Vermelho → ativar playbook de retenção (gerar tarefa de alerta de saúde)
- Preto → ação imediata + notificar coordenador

**Alerta de saúde — gatilhos automáticos:**
- Flag decreased: queda ≥ 25% MoM no volume
- Incidente crítico recorrente: 3+ ocorrências
- Ausência de resposta do cliente por 2+ semanas
- Cliente expressa insatisfação diretamente

**Segmentação de clientes por tier:**
- Small: até ~200k USD/mês, até ~30.000 transações → tech-touch
- Middle: ~200k a 1M USD/mês → mid-touch, onboarding call obrigatória
- Large: ~1M a 5M USD/mês → high-touch, QBR trimestral
- Key: acima de 5M USD/mês → high-touch premium, QBR trimestral, CSM pleno

**O que CS não faz (nunca modelar como funcionalidade):**
- Tickets operacionais N1 → vai para Suporte
- Decisões de limite/risco → vai para Cadastro/Risco
- Negociação comercial → vai para Comercial
- Análise de compliance/jurídico → vai para Suporte → Jurídico

### Fontes de dados reais usadas pela equipe
- Volume e transações Pix: `banking.pagsmile.com.br`
- Volume Sub/Cartão: `sub.pagsmile.com.br`
- Status da conta e histórico de contatos: HubSpot
- Tickets abertos/recorrentes: Zendesk
- Dashboards e análises: Metabase

### Produtos Pagsmile (para o Guia da API)
- **Pix IP:** pagamento instantâneo direto via Bacen, API REST, Pix IN e Pix OUT, liquidação instantânea
- **Sub:** cartão de crédito, sub-merchants
- **Paghub:** gateway cross-border Latam (Brasil, México, Argentina, Colômbia, Chile, Peru), uma integração cobre todos os países, intermediário entre merchant e PSPs locais
- **Combinação Pix IP + Paghub:** canal Pix IP criado dentro da conta Paghub, usado especialmente por clientes betting

---

## Comandos úteis no terminal

```bash
# Rodar o frontend localmente
cd frontend && npm run dev

# Rodar o backend localmente
cd backend && uvicorn app.main:app --reload --port 8000

# Instalar dependências do frontend
cd frontend && npm install

# Instalar dependências do backend
cd backend && pip install -r requirements.txt

# Ver logs do Render em produção
# Acessar dashboard do Render → seu serviço → Logs

# Fazer deploy manual (normalmente automático via push)
git add . && git commit -m "feat: descrição" && git push origin main
```

---

## Ordem de execução recomendada

```
Fase 1 → Setup + Login         (1 sessão)
Fase 2 → Clientes + Jornada    (2 sessões)
Fase 3 → Home + Tarefas        (1 sessão)
Fase 4 → Relatório             (1 sessão)
Fase 5 → Guia da API           (1 sessão)
Fase 6 → Caderno de campo      (1 sessão)
Fase 7 → Polish + Deploy       (1 sessão)
```

Total estimado: **8 sessões de desenvolvimento** aos fins de semana.

---

*GCS — Guia do Customer Success · Pagsmile IP*
*Desenvolvido por Léo Borges · 2026*
