# Backend

## Visão geral

O backend é uma API em Express responsável por três funções centrais:

- manter o cadastro de dispositivos
- executar o monitoramento periódico via ping
- publicar o estado atual e o histórico de eventos para o frontend

O projeto foi estruturado em torno de um fluxo simples e pragmático: leitura do inventário, execução do monitoramento, atualização do snapshot em memória e exposição desse snapshot pela API.

## Como rodar

```bash
npm install
npm run dev
```

O servidor sobe na porta `3000`.

## Stack técnica

- Node.js com ESM
- Express 5
- `ping` para verificação ICMP
- `axios` para integração com Telegram
- `nodemon` no ambiente de desenvolvimento

## Estrutura relevante

```text
src/
  server.js
  routes/
    devices.routes.js
    events.routes.js
  services/
    monitor.service.js
    ping.service.js
    telegram.js
    events.service.js
  utils/
    file.js
```

## Fluxo de inicialização

### `src/server.js`

Na subida da aplicação, o backend:

1. registra middlewares de `cors` e `express.json()`
2. monta as rotas `/devices` e `/events`
3. executa `runMonitoring()` imediatamente
4. agenda novas execuções de monitoramento a cada 60 segundos

Esse desenho evita esperar um minuto inteiro para obter o primeiro estado do ambiente.

## Persistência

### Fonte de verdade

O cadastro atual de dispositivos fica em:

```text
../data/devices.json
```

Ou seja, no diretório `data` da raiz do repositório.

### `src/utils/file.js`

Esse módulo centraliza leitura e escrita do arquivo de dispositivos.

Há dois pontos importantes aqui:

- os dados foram movidos para fora da pasta `Backend` para não disparar restart do `nodemon` a cada alteração
- o leitor ainda aceita caminhos legados para manter compatibilidade com instalações antigas

Em outras palavras, hoje o caminho da raiz é a fonte de verdade, e os caminhos antigos existem apenas como fallback de leitura.

## Monitoramento

### `src/services/monitor.service.js`

Esse é o coração do backend.

Responsabilidades:

- ler o inventário salvo
- executar ping para cada dispositivo
- manter o snapshot atual em memória
- registrar eventos de transição
- acionar Telegram quando houver mudança confirmada de estado

### Histerese de estado

O monitoramento não troca de estado no primeiro sucesso ou na primeira falha. Ele aplica histerese:

- um dispositivo só cai para offline após `3` falhas consecutivas
- um dispositivo só volta para online após `2` sucessos consecutivos

Essa decisão é importante. Em rede real, perda intermitente é comum. Sem histerese, o sistema geraria flapping visual e notificações ruidosas.

### Concorrência

`runMonitoring()` serializa execuções concorrentes usando uma `Promise` compartilhada. Isso evita sobreposição entre:

- o timer de 1 minuto
- refresh disparado após cadastro, edição ou exclusão

Sem essa proteção, snapshots poderiam ser sobrescritos fora de ordem.

## Serviços auxiliares

### `src/services/ping.service.js`

Wrapper fino em cima da biblioteca `ping`. Ele devolve:

- `online`
- `time`

Manter essa camada pequena vale a pena porque facilita troca futura da biblioteca sem espalhar dependência no restante do backend.

### `src/services/telegram.js`

Encapsula a integração com a API do Telegram. A integração é opcional: se as variáveis de ambiente não estiverem definidas, o backend apenas registra aviso em log e segue operando normalmente.

Variáveis esperadas:

- `DEV_PORT`
- `WEBAPP_PORT`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Uso recomendado:

- `DEV_PORT`: porta usada por `npm run dev` e `npm run start`
- `WEBAPP_PORT`: porta usada por `npm run webapp`

Há um modelo pronto em `./.env.example`.

### `src/services/events.service.js`

Mantém o histórico de eventos em memória.

Importante: esse histórico não é persistido em disco. Ao reiniciar o processo, os eventos acumulados se perdem.

Isso é aceitável para o estágio atual do projeto, mas precisa ser revisto caso o histórico passe a ter valor operacional ou auditoria.

## Rotas da API

### `GET /devices`

Devolve o snapshot atual em memória do monitoramento.

Observação importante: essa rota não lê o JSON diretamente. Ela devolve o estado produzido pelo monitor. Isso significa que o frontend recebe o status mais recente conhecido, com `online`, `lastCheck`, `offlineSince`, contadores e demais campos enriquecidos.

### `POST /devices`

Adiciona um dispositivo novo.

Regras relevantes:

- `name` e `ip` são obrigatórios
- o grupo padrão é `Sem grupo`
- o sistema bloqueia duplicidade por combinação de `nome + ip + grupo`
- após salvar, o backend dispara monitoramento imediato

### `PUT /devices/:id`

Edita `name` e `ip` de um dispositivo existente.

Regras relevantes:

- valida o `id`
- mantém o grupo atual
- reaplica a validação de duplicidade dentro do grupo
- executa refresh do monitoramento após salvar

### `POST /devices/bulk-delete`

Remove dispositivos em lote a partir de uma lista de IDs.

Depois da exclusão, o backend atualiza o monitoramento para manter o snapshot coerente com o inventário atual.

### `GET /events`

Devolve o histórico em memória das transições confirmadas de estado.

## Modelo de dados

Um dispositivo salvo em disco segue, em linhas gerais, esta estrutura:

```json
{
  "id": 1768335960667,
  "name": "Impressora ADM",
  "ip": "192.168.40.190",
  "group": "Impressoras",
  "online": false,
  "lastCheck": null,
  "offlineSince": null
}
```

Durante o monitoramento, o snapshot em memória ainda pode incluir campos como:

- `failCount`
- `successCount`
- `time`

Esses campos são derivados da execução do monitor e não precisam, necessariamente, ser tratados como parte do contrato de persistência em disco.

## Convenções do backend

- as rotas devem continuar finas e orientadas à validação/orquestração
- a regra de monitoramento deve ficar concentrada em `monitor.service.js`
- leitura e escrita de arquivo devem passar por `utils/file.js`
- integrações externas devem permanecer encapsuladas em serviços dedicados

## Limitações atuais

- eventos são armazenados apenas em memória
- não há autenticação
- não há testes automatizados
- a persistência ainda é baseada em arquivo JSON, o que funciona bem para pequeno volume, mas não escala como banco de dados

## Próximos passos naturais

- persistir eventos em disco ou banco
- criar configuração formal de ambiente com `.env.example`
- adicionar testes de rota e testes de monitoramento
- mover o inventário para uma base de dados quando houver necessidade de concorrência real, auditoria ou maior volume
