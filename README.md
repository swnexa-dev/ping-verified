# Verificador de Ping

## Visão geral

Este repositório contém uma aplicação de monitoramento de dispositivos em rede, dividida em duas partes:

- `Frontend/`: interface web em Vue 3
- `Backend/`: API em Express e motor de monitoramento

O sistema foi desenhado para um caso de uso bastante objetivo: manter um inventário simples de dispositivos, monitorar disponibilidade via ping e destacar rapidamente o que está offline.

## Arquitetura em alto nível

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

1. o backend sobe e executa o primeiro monitoramento
2. o monitoramento roda novamente a cada 60 segundos
3. o frontend consulta `/devices` em polling a cada 5 segundos
4. o dashboard mostra apenas os dispositivos offline
5. a tela de grupos concentra cadastro, edição e exclusão em lote
6. quando há transição confirmada de estado, o sistema pode gerar toasts, notificações do navegador e alerta por Telegram

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

## O que cada camada faz

### Frontend

Responsável por:

- exibir o dashboard operacional
- organizar dispositivos por grupo
- permitir cadastro de novos dispositivos
- executar exclusão em lote e edição sequencial por modal
- mostrar alertas locais e notificações do navegador

Mais detalhes em [Frontend/README.md](Frontend/README.md).

### Backend

Responsável por:

- manter o cadastro de dispositivos
- executar o monitoramento periódico
- aplicar histerese para reduzir flapping
- publicar o snapshot atual dos dispositivos
- registrar eventos de mudança de estado
- enviar notificações para Telegram, quando configurado

Mais detalhes em [Backend/README.md](Backend/README.md).

## Decisões técnicas importantes

### 1. Persistência em JSON na raiz

O inventário atual fica em `data/devices.json`, fora da pasta `Backend`.

Isso foi uma decisão operacional importante: quando o arquivo ficava dentro do backend, salvar dispositivos durante o desenvolvimento podia disparar restart do `nodemon`, quebrando requisições em andamento.

### 2. Histerese no monitoramento

O backend não alterna entre online e offline de forma imediata. Ele exige:

- 3 falhas consecutivas para derrubar um dispositivo
- 2 sucessos consecutivos para considerar recuperação

Essa escolha reduz ruído em ambientes com rede instável.

### 3. Dashboard orientado à exceção

A tela principal não tenta mostrar tudo. Ela foi ajustada para mostrar apenas o que exige atenção, ou seja, os dispositivos offline. Isso melhora legibilidade e tempo de resposta operacional.

### 4. Estilização separada da camada Vue

Todo o CSS do frontend foi movido para arquivos dedicados. Isso facilita manutenção, revisão e evolução visual sem misturar estrutura de componente com estilo.

## Como rodar o projeto

### Backend

```bash
cd Backend
npm install
npm run dev
```

Servidor esperado em `http://localhost:3000`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Aplicação esperada em `http://localhost:5173`.

## Variáveis de ambiente do backend

Se quiser habilitar notificações por Telegram, configure:

```env
DEV_PORT=3000
WEBAPP_PORT=3004
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_CHAT_ID=seu_chat_id
```

Sem essas variáveis, o sistema continua funcionando normalmente, apenas sem envio para Telegram.

## Estado atual do projeto

Hoje o projeto já tem uma base boa para uso interno e para evolução incremental, mas ainda é importante considerar algumas limitações:

- não há testes automatizados
- o histórico de eventos é mantido apenas em memória
- o inventário ainda usa JSON em vez de banco de dados
- a API não possui autenticação

Essas escolhas são razoáveis para o porte atual da aplicação. O ponto importante é que elas estejam explícitas, para que futuras evoluções sejam guiadas por necessidade real e não por suposição.

## Direção natural de evolução

- adicionar testes de backend e frontend
- persistir eventos
- externalizar configurações de ambiente no frontend
- introduzir autenticação, se o sistema sair de uso restrito
- migrar a persistência para banco quando houver necessidade de histórico, concorrência ou maior volume
