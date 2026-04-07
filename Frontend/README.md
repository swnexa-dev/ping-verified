# Frontend

## Visão geral

O frontend é uma SPA em Vue 3 com Vite. Ele consome a API do backend em `http://localhost:3000`, faz polling periódico dos dispositivos e organiza a experiência em duas telas principais:

- `Dashboard`: mostra apenas os dispositivos offline e os indicadores mais importantes do ambiente.
- `Grupos`: concentra cadastro, organização e operações em lote por grupo.

O frontend foi mantido propositalmente simples: sem Vue Router, sem store global externa e com o estado principal centralizado no `App.vue`. Para o tamanho atual do projeto, essa decisão reduz complexidade sem comprometer clareza.

## Como rodar

```bash
npm install
npm run dev
```

Por padrão, o Vite sobe em `http://localhost:5173`.

## Responsabilidades do frontend

- carregar a lista de dispositivos a partir do backend
- manter o estado visual da aplicação
- preservar o estado local de confirmação de alertas entre polls
- exibir notificações visuais e notificações do navegador
- permitir cadastro, exclusão em lote e edição sequencial de dispositivos

## Estrutura relevante

```text
src/
  App.vue
  main.js
  services/
    api.js
  composables/
    useAlerts.js
  views/
    Dashboard.vue
    GroupsPage.vue
  components/
    AlertModal.vue
    DeviceEditModal.vue
    DeviceForm.vue
    DeviceGroups.vue
    DeviceList.vue
    LoadingScreen.vue
    ToastContainer.vue
  styles/
    app.css
    base.css
    theme.css
    components/
    views/
```

## Arquitetura da interface

### `src/App.vue`

É o orquestrador da aplicação. Aqui ficam:

- o carregamento inicial dos dispositivos
- o polling de atualização a cada 5 segundos
- a navegação por hash entre `dashboard` e `groups`
- o estado compartilhado entre as views
- a integração com o sistema de alertas

Na prática, `App.vue` funciona como a "casca" da aplicação. Enquanto o projeto permanecer pequeno e com poucas rotas, essa abordagem continua adequada.

### `src/views/Dashboard.vue`

Tela focada em operação. O dashboard filtra a lista recebida e mostra apenas os dispositivos offline. Isso reduz ruído e transforma a tela principal em uma área de atenção imediata, em vez de uma listagem completa.

### `src/views/GroupsPage.vue`

Tela de manutenção do inventário. Ela combina:

- `DeviceForm.vue` para cadastro
- `DeviceGroups.vue` para visualização e operações em lote

Essa separação deixa o fluxo de cadastro isolado do fluxo de manutenção.

## Componentes principais

### `src/components/DeviceForm.vue`

Responsável por cadastrar dispositivos. O formulário aceita:

- nome
- IP ou hostname
- grupo existente
- novo grupo

O grupo não tem entidade própria no frontend. Ele é derivado do campo `group` de cada dispositivo.

### `src/components/DeviceGroups.vue`

Esse é o componente mais rico da tela de grupos. Ele resolve três problemas:

1. agrupar dispositivos por nome de grupo
2. abrir e fechar grupos individualmente
3. executar seleção para exclusão ou edição em lote

No fluxo de edição, os dispositivos selecionados entram em uma fila local (`editQueue`) e são editados um por vez via modal. Essa estratégia evita um formulário gigante e reduz chance de erro operacional.

### `src/components/DeviceEditModal.vue`

Modal sequencial para editar dispositivos selecionados. Ele recebe um dispositivo por vez, exibe progresso (`x de y`) e devolve o payload limpo para o componente pai salvar.

### `src/components/DeviceList.vue`

Listagem simples de dispositivos, usada no dashboard para a visão de offline. Mantém o componente reaproveitável e evita duplicar markup de card.

### `src/components/AlertModal.vue` e `src/components/ToastContainer.vue`

São as duas camadas de alerta:

- `ToastContainer.vue`: feedback rápido para transições de estado
- `AlertModal.vue`: destaque mais forte para dispositivos offline ainda não reconhecidos pelo usuário

## Composable de alertas

### `src/composables/useAlerts.js`

Esse arquivo concentra a lógica de notificação do cliente.

Pontos importantes:

- compara o snapshot atual com o snapshot anterior
- só alerta quando há transição real de estado
- não gera alerta retroativo na primeira carga
- preserva a necessidade de reconhecimento (`acknowledged`) enquanto o dispositivo permanecer offline

Essa decisão evita o comportamento clássico de flooding visual em interfaces monitoradas por polling.

## Camada de API

### `src/services/api.js`

Usa `axios` com `baseURL` fixa apontando para o backend local.

Se a API mudar de porta ou de host no modo de desenvolvimento, o frontend pode usar a variável `VITE_API_BASE_URL`.

Exemplo:

```env
VITE_API_BASE_URL=http://localhost:3010
```

## Estilização

Toda a estilização foi separada dos componentes e organizada em arquivos CSS dedicados.

### Organização

- `src/style.css`: ponto de entrada dos estilos
- `src/styles/theme.css`: tokens de tema
- `src/styles/base.css`: reset e utilitários de base
- `src/styles/app.css`: estrutura global da aplicação
- `src/styles/views/*`: estilos por tela
- `src/styles/components/*`: estilos por componente

Essa estrutura ajuda manutenção e reduz o acoplamento entre estrutura Vue e CSS.

## Convenções de manutenção

- o estado compartilhado deve permanecer em `App.vue` enquanto não houver necessidade real de store global
- componentes visuais devem receber dados por `props` e emitir eventos para cima
- regras de negócio de alerta devem continuar em `useAlerts.js`, não espalhadas pelos componentes
- novos estilos devem entrar nos arquivos de `src/styles`, e não em blocos `<style>` dentro dos `.vue`

## Limitações atuais

- a navegação usa hash simples, não Vue Router
- não há suíte de testes automatizados
- a `baseURL` da API está fixa em ambiente local

## Sugestões naturais de evolução

- mover configurações de API para variáveis de ambiente do Vite
- adicionar testes de interface para os fluxos de alerta e edição em lote
- introduzir Vue Router caso a aplicação ganhe mais telas
- criar uma store dedicada se o estado compartilhado crescer além do que `App.vue` comporta bem
