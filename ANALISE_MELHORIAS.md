# Relatório de Análise e Melhorias — Sistema Pernas Solidárias

Este documento apresenta uma análise técnica completa do projeto **Pernas Solidárias** (`backend` e `frontend`), comparando a implementação atual com a especificação de requisitos, regras de negócio e mockups presentes no documento RFC (`RFC/PDF/latex_projeto.tex`).

---

## Sumário Executivo dos Problemas Identificados

| Categoria | Quantidade | Severidade Principal |
| :--- | :---: | :--- |
| **Bugs Críticos de Execução** | 4 | Alta (Quebra de interface / erro de tipo) |
| **Inconsistências com a RFC (RF / RN)** | 5 | Média - Alta (Requisitos não atendidos) |
| **Segurança, Autenticação e LGPD** | 4 | Alta (Exposição de dados / falha de bloqueio) |
| **UX, Validação e Tratamento de Erros** | 5 | Média (Mensagens engolidas / usabilidade) |

---

## 1. Bugs Críticos e Erros em Tempo de Execução

### 1.1. Quebra de tela ao listar duplas (`pairs.map is not a function`)
* **Arquivo:** [`frontend/src/services/pairService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/services/pairService.ts#L12-L15)
* **Função:** `listByEvent(eventId: number)`
* **Linhas:** 12 a 15
* **Arquivos impactados:**
  * [`frontend/src/pages/PairFormation/PairFormationPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/PairFormation/PairFormationPage.tsx#L58-L65) (função `loadEventPairs`, linhas 58–65 e renderização linha 304)
  * [`frontend/src/pages/History/HistoryPairsModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/History/HistoryPairsModal.tsx#L33-L45) (função `fetchPairs`, linhas 33–45 e renderização linha 91)
  * [`backend/src/controllers/pairController.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/controllers/pairController.ts#L32-L45) (função `listByEvent`, linha 42)
  * [`backend/src/services/pairFormationService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/pairFormationService.ts#L76-L84) (função `listByEvent`, linha 83)
* **Problema:**
  O backend retorna `{ data: { evento: event, duplas: pairs } }`. O frontend em `pairService.listByEvent` retorna `response.data.data` e anota o tipo como `Promise<DuplaDetalhada[]>`. Tanto o `PairFormationPage` quanto o `HistoryPairsModal` atribuem esse objeto ao estado `pairs` (`setPairs(data)`). Ao tentar executar `pairs.map(...)`, ocorre a exceção de JavaScript: `Uncaught TypeError: pairs.map is not a function`, travando a interface do usuário.
* **Correção Recomendada:**
  Em `frontend/src/services/pairService.ts`:
  ```typescript
  async listByEvent(eventId: number): Promise<DuplaDetalhada[]> {
    const response = await api.get<ApiSuccessResponse<{ evento: any; duplas: DuplaDetalhada[] } | DuplaDetalhada[]>>(`/duplas/evento/${eventId}`);
    const data = response.data.data;
    if (data && 'duplas' in data && Array.isArray((data as any).duplas)) {
      return (data as any).duplas;
    }
    return Array.isArray(data) ? data : [];
  }
  ```

---

### 1.2. Supressão de mensagens de erro do backend (`err.response?.data?.error` vs `message`)
* **Arquivo Central:** [`backend/src/middlewares/errorHandler.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/middlewares/errorHandler.ts#L18-L23) (função `errorHandler`, linhas 18–23)
* **Arquivos do Frontend com Falha:**
  * [`frontend/src/pages/Auth/LoginPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Auth/LoginPage.tsx#L37) (função `handleSubmit`, linha 37)
  * [`frontend/src/pages/Participants/ParticipantsPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Participants/ParticipantsPage.tsx#L145) (função `handleConfirmDelete`, linha 145)
  * [`frontend/src/pages/Participants/ParticipantModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Participants/ParticipantModal.tsx#L141) (função `handleSubmit`, linha 141)
  * [`frontend/src/pages/Events/EventsPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Events/EventsPage.tsx#L81) (função `handleConfirmDelete`, linha 81)
  * [`frontend/src/pages/Events/EventModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Events/EventModal.tsx#L73) (função `handleSubmit`, linha 73)
  * [`frontend/src/pages/PairFormation/PairFormationPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/PairFormation/PairFormationPage.tsx#L147) (funções `handleGeneratePairs` linha 147 e `handleConfirmClear` linha 164)
  * [`frontend/src/pages/PairFormation/EditPairModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/PairFormation/EditPairModal.tsx#L76) (função `handleSubmit`, linha 76)
  * [`frontend/src/components/export/ExportModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/components/export/ExportModal.tsx#L41) (função `handleExport`, linha 41)
* **Problema:**
  O middleware do backend responde a erros no formato `{ status: 'error', message: err.message }`. Porém, em **todas** as telas e modais do frontend, o tratamento de erro faz `err.response?.data?.error || 'Mensagem genérica'`. Como a propriedade `.error` é `undefined`, o usuário **nunca** vê a causa real do erro retornada pelo servidor (ex: "CPF já cadastrado", "Acesso bloqueado por 15 minutos", "Participante já alocado em outra dupla").
* **Correção Recomendada:**
  1. No backend ([`backend/src/middlewares/errorHandler.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/middlewares/errorHandler.ts#L18-L23)), padronizar a resposta enviando ambos os campos para compatibilidade:
     ```typescript
     res.status(err.statusCode).json({
       status: 'error',
       message: err.message,
       error: err.message,
     });
     ```
  2. No frontend, tratar tanto `.message` quanto `.error`:
     ```typescript
     const errMsg = err.response?.data?.message || err.response?.data?.error || 'Erro inesperado.';
     ```

---

### 1.3. Bloqueio permanente de login após expiração do tempo de 15 minutos (FA01)
* **Arquivo:** [`backend/src/services/authService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/authService.ts#L45-L71)
* **Função:** `login(email, password)`
* **Linhas:** 45 a 71
* **Arquivo relacionado:** [`backend/src/repositories/userRepository.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/repositories/userRepository.ts#L26-L39) (função `incrementFailedAttempts`, linhas 26–39)
* **Problema:**
  Quando o usuário é bloqueado por 15 minutos (`tentativas_falhas = 5`), e o tempo expira (`now >= lockUntil`), o bloco passa na validação das linhas 45–55. Porém, o contador `tentativas_falhas` **não é zerado**. Se na sequência o usuário errar a senha apenas 1 vez, `incrementFailedAttempts` incrementa para 6 (que é `>= 5`), bloqueando o usuário por mais 15 minutos na primeira tentativa incorreta.
* **Correção Recomendada:**
  Em [`backend/src/services/authService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/authService.ts#L45-L55):
  ```typescript
  if (user.bloqueado_ate) {
    const lockUntil = new Date(user.bloqueado_ate);
    const now = new Date();
    if (now < lockUntil) {
      const remainingMinutes = Math.ceil((lockUntil.getTime() - now.getTime()) / (1000 * 60));
      throw new AppError(
        `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${remainingMinutes} minuto(s).`,
        429
      );
    } else {
      // Bloqueio expirou: reinicia contagem de falhas
      await this.userRepository.resetFailedAttempts(user.cd_user);
    }
  }
  ```

---

### 1.4. Falha de SQL na rota de rankings ao informar `limit` inválido
* **Arquivo:** [`backend/src/controllers/analyticsController.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/controllers/analyticsController.ts#L7-L15)
* **Função:** `getRankings(req, res, next)`
* **Linha:** 9
* **Problema:**
  O código executa `const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;`. Se o parâmetro não for um número válido (ex: `?limit=abc`), `parseInt` retorna `NaN`. Ao repassar `NaN` para o PostgreSQL na query `LIMIT $1` em `AnalyticsRepository`, o banco rejeita com erro de sintaxe SQL 500.
* **Correção Recomendada:**
  ```typescript
  const parsed = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
  const limit = isNaN(parsed) || parsed < 1 ? 5 : parsed;
  ```

---

## 2. Inconsistências com a RFC (Requisitos e Regras de Negócio)

### 2.1. Ausência do campo "Local" no cadastro de eventos (Requisito RF02)
* **Requisito RFC:** *RF02 – O sistema deve permitir que o coordenador cadastre novas corridas, informando nome do evento, data e local.*
* **Arquivos que precisam de alteração:**
  * [`backend/src/database/init-database.sql`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/database/init-database.sql#L10-L15) (Tabela `EVENTO`, linha 10)
  * [`backend/src/models/types.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/models/types.ts#L44-L50) (Interface `Evento`, linha 44)
  * [`backend/src/repositories/eventRepository.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/repositories/eventRepository.ts#L59-L82) (funções `create` e `update`, linhas 59 e 70)
  * [`backend/src/services/eventService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/eventService.ts#L23-L39) (funções `create` e `update`, linhas 23 e 31)
  * [`frontend/src/types/index.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/types/index.ts#L37-L43) (Interface `Evento`, linha 37)
  * [`frontend/src/pages/Events/EventModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Events/EventModal.tsx#L25-L65) (funções `validate` e `handleSubmit`, linhas 43 e 51)
* **Problema:**
  O banco de dados e a API possuem apenas `nm_evento` e `dt_evento`. O campo `local` exigido formalmente no RF02 não foi implementado.
* **Correção Recomendada:**
  Adicionar a coluna `local VARCHAR(255)` na tabela `EVENTO` via `ALTER TABLE EVENTO ADD COLUMN IF NOT EXISTS local VARCHAR(255);`, atualizar a tipagem no backend e frontend, e incluir o input correspondente no `EventModal.tsx`.

---

### 2.2. Filtro de histórico por "número de participações" não implementado (Requisito RF09)
* **Requisito RFC:** *RF09 – O sistema deve permitir a consulta e filtragem do histórico de corridas por período, participante ou número de participações.*
* **Arquivos que precisam de alteração:**
  * [`backend/src/models/types.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/models/types.ts#L104-L109) (Interface `HistoryFilters`, linha 104)
  * [`backend/src/repositories/pairRepository.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/repositories/pairRepository.ts#L206-L261) (função `findHistory`, linhas 206–261)
  * [`backend/src/controllers/pairController.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/controllers/pairController.ts#L102-L122) (função `history`, linhas 102–122)
  * [`frontend/src/pages/History/HistoryPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/History/HistoryPage.tsx#L38-L44) (estados de filtro, linhas 38–44 e `Select/Input`, linhas 170–205)
* **Problema:**
  O filtro atual de histórico só aceita `eventId`, `startDate`, `endDate` e `search`. O requisito RF09 estabelece explicitamente a possibilidade de filtrar participantes por quantidade de corridas já realizadas.
* **Correção Recomendada:**
  Incluir o parâmetro opcional `minParticipacoes` / `maxParticipacoes` na query SQL de histórico e adicionar um campo de seleção/numérico no formulário de filtros da tela `HistoryPage.tsx`.

---

### 2.3. Exportação de relatório geral de histórico indisponível (Requisito RF10)
* **Requisito RFC:** *RF10 – O sistema deve permitir a geração do relatório de duplas tanto a partir da tela de histórico geral quanto a partir da tela de detalhe de um evento específico do histórico.*
* **Arquivos que precisam de alteração:**
  * [`backend/src/routes/exportRoutes.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/routes/exportRoutes.ts#L10-L13) (linhas 10–13)
  * [`backend/src/controllers/exportController.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/controllers/exportController.ts#L7-L42) (linhas 7–42)
  * [`backend/src/services/exportService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/exportService.ts#L18-L30) (linhas 18–30)
  * [`frontend/src/pages/History/HistoryPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/History/HistoryPage.tsx#L125-L160) (cabeçalho de ações, linha 125)
* **Problema:**
  As rotas de exportação só aceitam `/export/event/:eventId`. Não existe rota nem botão no topo da tela de histórico geral para exportar a listagem consolidada ou filtrada dos registros históricos.
* **Correção Recomendada:**
  Implementar rota `GET /api/export/history` recebendo os filtros do histórico e gerando o relatório consolidado em Excel/CSV. Adicionar botão no cabeçalho da `HistoryPage.tsx`.

---

### 2.4. Cálculo de prioridade de formação considerando eventos futuros (Regras RN03 e RN07)
* **Arquivo:** [`backend/src/repositories/pairRepository.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/repositories/pairRepository.ts#L8-L30)
* **Funções:** `findPrioritizedWheelchairUsers()` e `findPrioritizedRunners()`
* **Linhas:** 8 a 30 e 35 a 56
* **Problema:**
  A query de ordenação de prioridade utiliza:
  ```sql
  ORDER BY MAX(e.dt_evento) ASC NULLS FIRST, c.created_at ASC, c.cd_cadeirante ASC
  ```
  Se houver outro evento futuro já cadastrado no banco com duplas previamente associadas, o `MAX(e.dt_evento)` assumirá essa data futura em vez da última participação real no passado.
* **Correção Recomendada:**
  Filtrar apenas eventos realizados (ou anteriores ao evento em formação):
  ```sql
  LEFT JOIN EVENTO e ON e.cd_evento = d.cd_evento AND e.dt_evento < CURRENT_DATE
  ```

---

## 3. Segurança, Privacidade e LGPD

### 3.1. Chave secreta JWT estática no código (Hardcoded Secret)
* **Arquivos:**
  * [`backend/src/middlewares/authMiddleware.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/middlewares/authMiddleware.ts#L37) (função `authMiddleware`, linha 37)
  * [`backend/src/services/authService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/authService.ts#L76) (função `login`, linha 76)
* **Linhas:** 37 (authMiddleware) e 76 (authService)
* **Problema:**
  Ambos utilizam o fallback `process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026'`. Em ambientes onde a variável de ambiente não foi configurada, uma chave pública conhecida é utilizada, permitindo a forja de tokens JWT por terceiros.
* **Correção Recomendada:**
  Exigir obrigatoriamente `JWT_SECRET` no arquivo `.env` e disparar erro na inicialização caso não esteja preenchida:
  ```typescript
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET não configurado nas variáveis de ambiente.');
  }
  ```

---

### 3.2. Exibição pública de CPF na listagem de participantes (Violação da Seção 6.2 da RFC / LGPD)
* **Especificação RFC (Seção 6.2):** *"Os CPFs são armazenados sem formatação e não são exibidos na interface após o cadastro."*
* **Arquivo:** [`frontend/src/pages/Participants/ParticipantsPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Participants/ParticipantsPage.tsx#L257)
* **Linhas:** 257, 275 (tabela de cadeirantes) e 359, 376 (tabela de condutores)
* **Problema:**
  O CPF de todos os cadeirantes e condutores é exibido abertamente na tabela principal da tela de participantes, contrariando a restrição de privacidade documental estipulada no projeto.
* **Correção Recomendada:**
  Remover a coluna de CPF da listagem principal ou aplicar mascaramento de dados (ex: `***.***.***-99` ou omitir o campo), mantendo a exibição apenas no momento da edição ou na exportação com autorização.

---

### 3.3. Interceptor 401 desloga usuário indevidamente em caso de falha de login
* **Arquivo:** [`frontend/src/services/api.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/services/api.ts#L27-L35)
* **Função:** Interceptor de resposta do Axios
* **Linhas:** 27 a 35
* **Problema:**
  O interceptor intercepta qualquer `401 Unauthorized` e dispara o evento `auth:unauthorized`, limpando o `localStorage`. Quando o usuário erra a senha na tela de login, a API retorna status `401`, ativando o interceptor desnecessariamente.
* **Correção Recomendada:**
  Ignorar requisições cujo endpoint seja de autenticação:
  ```typescript
  if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
    localStorage.removeItem('@PernasSolidarias:token');
    localStorage.removeItem('@PernasSolidarias:user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  ```

---

## 4. Validações e Tratamento de Erros

### 4.1. Validação de CPF apenas por tamanho de dígitos (sem validação de dígitos verificadores)
* **Arquivos:**
  * [`backend/src/services/wheelchairUserService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/wheelchairUserService.ts#L44-L47) (função `create` e `update`, linhas 44–47 e 86–89)
  * [`backend/src/services/runnerService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/backend/src/services/runnerService.ts#L43-L46) (função `create` e `update`, linhas 43–46 e 84–87)
  * [`frontend/src/pages/Participants/ParticipantModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Participants/ParticipantModal.tsx#L72-L77) (função `validate`, linhas 72–77)
* **Problema:**
  O sistema apenas valida `cleanCpf.length === 11`. Qualquer sequência arbitrária (ex: `00000000000` ou `11111111111`) é gravada no banco como CPF válido.
* **Correção Recomendada:**
  Implementar função utilitária de cálculo dos dígitos verificadores (módulo 11) do CPF tanto no backend quanto no frontend:
  ```typescript
  function isValidCPF(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(clean.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(clean.substring(10, 11));
  }
  ```

---

### 4.2. Erro do endpoint de exportação não legível por conta de `responseType: 'blob'`
* **Arquivo:** [`frontend/src/services/exportService.ts`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/services/exportService.ts#L8-L20)
* **Função:** `exportEventReport`
* **Linhas:** 8 a 20
* **Problema:**
  Ao usar `responseType: 'blob'`, quando a API retorna erro (ex: 400 "Este evento ainda não possui duplas formadas"), o Axios entrega o corpo do JSON de erro encapsulado em um `Blob` binário. No `ExportModal.tsx`, `err.response?.data?.message` é nulo porque `data` é um `Blob`.
* **Correção Recomendada:**
  No interceptor ou no `catch` de `exportEventReport`:
  ```typescript
  if (err.response?.data instanceof Blob) {
    const text = await err.response.data.text();
    try {
      const json = JSON.parse(text);
      err.response.data = json;
    } catch {}
  }
  ```

---

## 5. Usabilidade e Alinhamento com os Mockups da RFC

### 5.1. "Próximo Evento" no Dashboard exibe evento mais antigo do passado
* **Arquivo:** [`frontend/src/pages/Dashboard/DashboardPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Dashboard/DashboardPage.tsx#L80-L86)
* **Função:** `DashboardPage`
* **Linhas:** 80 a 86
* **Problema:**
  O código faz:
  ```typescript
  const upcomingEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.dt_evento).getTime();
    const dateB = new Date(b.dt_evento).getTime();
    return dateA - dateB;
  });
  const nextEvent = upcomingEvents[0];
  ```
  Isso ordena todos os eventos da data mais antiga para a mais recente sem filtrar se a data é futura. Caso existam eventos de anos anteriores, o card "Próximo Evento" exibe o evento mais velho do histórico da ONG.
* **Correção Recomendada:**
  Filtrar por eventos a partir de hoje:
  ```typescript
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const futureEvents = events
    .filter((e) => new Date(e.dt_evento).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dt_evento).getTime() - new Date(b.dt_evento).getTime());
  const nextEvent = futureEvents[0] || null;
  ```

---

### 5.2. Modal de edição de dupla permite selecionar participantes inativos
* **Arquivo:** [`frontend/src/pages/PairFormation/EditPairModal.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/PairFormation/EditPairModal.tsx#L114-L138)
* **Linhas:** 114 a 138
* **Problema:**
  As listas suspensas (Select) incluem participantes inativos. Se o coordenador selecionar um participante inativo, a API rejeita a requisição (`O cadeirante/condutor selecionado está inativo no sistema`), gerando frustração.
* **Correção Recomendada:**
  Filtrar a lista no Select para exibir apenas participantes ativos (`c.ativo === true`), ou incluir o participante da própria dupla mais os ativos disponíveis.

---

### 5.3. Link "Esqueci minha senha" ausente na tela de login (Fluxo Alternativo FA01)
* **Especificação RFC (Seção 3.2 – FA01):** *"O coordenador pode acionar a opção 'Esqueci minha senha'."*
* **Arquivo:** [`frontend/src/pages/Auth/LoginPage.tsx`](file:///c:/Users/User/Documents/PAC/marcon/Pernas_Solidarias/frontend/src/pages/Auth/LoginPage.tsx#L80-L113)
* **Linhas:** 80 a 113
* **Problema:**
  Não há opção ou orientação na interface de login para recuperação ou instruções em caso de esquecimento de senha, contrariando o caso de uso FA01 da RFC.
* **Correção Recomendada:**
  Incluir botão/link "Esqueci minha senha" com modal explicativa ou link de suporte da coordenação.

---

## Tabela de Ações Recomendadas por Arquivo e Linha

| # | Arquivo | Função / Componente | Linha | Severidade | Ação Recomendada |
| :-: | :--- | :--- | :-: | :-: | :--- |
| **1** | `frontend/src/services/pairService.ts` | `listByEvent` | 12–15 | **Crítica** | Extrair array `duplas` de `response.data.data` para evitar crash de `.map`. |
| **2** | `backend/src/middlewares/errorHandler.ts` | `errorHandler` | 18–23 | **Crítica** | Retornar campos `error` e `message` no JSON para não ocultar causas de erro. |
| **3** | `frontend/src/pages/*` (todas as páginas) | `handleSubmit` / `catch` | Várias | **Alta** | Buscar `err.response?.data?.message || err.response?.data?.error`. |
| **4** | `backend/src/services/authService.ts` | `login` | 45–55 | **Alta** | Resetar `tentativas_falhas` após o término do período de 15 min de bloqueio. |
| **5** | `backend/src/controllers/analyticsController.ts` | `getRankings` | 9 | **Alta** | Tratar `NaN` no parâmetro `limit` antes de repassar à query do banco. |
| **6** | `backend/src/database/init-database.sql` | Tabela `EVENTO` | 10–15 | **Média** | Adicionar coluna `local` (Requisito RF02 da RFC). |
| **7** | `backend/src/repositories/eventRepository.ts` | `create` / `update` | 59–82 | **Média** | Persistir campo `local` do evento. |
| **8** | `frontend/src/pages/Events/EventModal.tsx` | `EventModal` | 57–60 | **Média** | Adicionar input do campo "Local do Evento" no formulário. |
| **9** | `backend/src/repositories/pairRepository.ts` | `findHistory` | 206–261 | **Média** | Adicionar filtro por número de participações (Requisito RF09 da RFC). |
| **10** | `backend/src/routes/exportRoutes.ts` | `exportRoutes` | 10–13 | **Média** | Criar rota de exportação geral do histórico (Requisito RF10 da RFC). |
| **11** | `backend/src/repositories/pairRepository.ts` | `findPrioritizedWheelchairUsers` | 24, 50 | **Média** | Considerar apenas `dt_evento < CURRENT_DATE` no cálculo de prioridade. |
| **12** | `backend/src/middlewares/authMiddleware.ts` | `authMiddleware` | 37 | **Média** | Exigir `JWT_SECRET` obrigatório sem fallback estático no código. |
| **13** | `frontend/src/pages/Participants/ParticipantsPage.tsx` | Tabela de participantes | 275, 376 | **Média** | Mascarar/ocultar CPF na visualização em conformidade com LGPD (Seção 6.2). |
| **14** | `frontend/src/services/api.ts` | Interceptor de resposta | 27–35 | **Média** | Não acionar logout em respostas 401 provenientes de `/auth/login`. |
| **15** | `frontend/src/pages/Dashboard/DashboardPage.tsx` | `DashboardPage` | 80–86 | **Baixa** | Filtrar apenas eventos com data `>= hoje` para o card "Próximo Evento". |
| **16** | `frontend/src/pages/PairFormation/EditPairModal.tsx` | `EditPairModal` | 118–138 | **Baixa** | Desabilitar ou filtrar participantes inativos nos selects de edição de dupla. |
| **17** | `frontend/src/services/exportService.ts` | `exportEventReport` | 8–20 | **Baixa** | Decodificar Blob de erro caso a API de exportação responda com erro 4xx/5xx. |
| **18** | `frontend/src/pages/Auth/LoginPage.tsx` | `LoginPage` | 100–115 | **Baixa** | Incluir link e fluxo de "Esqueci minha senha" (Fluxo FA01 da RFC). |
