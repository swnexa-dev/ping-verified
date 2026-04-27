# Verificador de Ping

Aplicação full stack para monitoramento de disponibilidade de dispositivos em rede, com foco em operação: destacar rapidamente o que está offline e reduzir ruído de oscilação.

## Stack

- Frontend: Vue 3 + Vite + Axios
- Backend: Node.js + Express 5 + Ping + Axios
- Persistência atual: arquivo JSON (`data/devices.json`)
- Notificação opcional: Telegram Bot API

## Funcionalidades

- Cadastro de dispositivos por grupo
- Dashboard orientado à exceção (mostra foco em indisponibilidade)
- Monitoramento periódico com histerese para reduzir flapping
- Edição sequencial e exclusão em lote por grupo
- Toasts e notificações do navegador
- Histórico de transições de status em memória
- Envio de alertas para Telegram (quando configurado)

## Arquitetura

```text
Frontend (Vue)
    |
    | HTTP
    v
Backend (Express)
    |
    | leitura/escrita
    v
data/devices.json
```

Fluxo principal:

1. backend sobe e roda o primeiro ciclo de monitoramento
2. monitoramento roda novamente a cada 60s
3. frontend atualiza dados em polling de 5s
4. alertas disparam apenas em transição confirmada de estado

## Como executar localmente

Pré-requisitos:

- Node.js 20+
- npm 10+

### 1. Backend

```bash
cd Backend
npm install
npm run dev
```

Backend em `http://localhost:3000` (padrão).

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend em `http://localhost:5173` (padrão).

## Variáveis de ambiente (Backend)

Crie `Backend/.env` com base em `Backend/.env.example`.

```env
DEV_PORT=3000
WEBAPP_PORT=3004
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_CHAT_ID=seu_chat_id
```

As variáveis do Telegram são opcionais. Sem elas, o monitoramento continua funcionando normalmente.

## Estrutura do repositório

```text
.
|-- README.md
|-- data/
|   `-- devices.json
|-- Frontend/
|   |-- README.md
|   `-- src/
`-- Backend/
    |-- README.md
    `-- src/
```

Detalhes por camada:

- Frontend: [Frontend/README.md](Frontend/README.md)
- Backend: [Backend/README.md](Backend/README.md)

## Decisões técnicas

- Persistência em JSON fora da pasta do backend para evitar restart indevido do `nodemon` durante desenvolvimento.
- Histerese no monitoramento:
  - offline após `3` falhas consecutivas
  - online após `2` sucessos consecutivos
- Rotas de leitura usam snapshot em memória do monitor, não leitura direta de arquivo.

## Limitações atuais

- Sem autenticação na API
- Sem testes automatizados
- Histórico de eventos apenas em memória
- Persistência em arquivo (bom para pequeno volume, não ideal para escala)

## Próximos passos sugeridos

- Adicionar suíte de testes (backend + frontend)
- Persistir eventos em banco ou arquivo dedicado
- Introduzir autenticação para cenários multiusuário
- Containerizar com Docker para facilitar execução
- Configurar CI (lint/build/test) no GitHub Actions
