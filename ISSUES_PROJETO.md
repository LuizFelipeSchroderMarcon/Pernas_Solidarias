# Issues do Projeto — Pernas Solidárias

---

## Issue 1

**Titulo:** Fortalecer segurança de autenticação (CORS, JWT, bloqueio de brute-force) e conformidade com LGPD no cadastro de CPF

*Contexto:*
Durante a análise de segurança, autenticação e privacidade de dados do projeto **Pernas Solidárias** (`backend` e `frontend`), foram identificadas vulnerabilidades e inconsistências em relação aos requisitos não funcionais de segurança (**RNF04**), ao fluxo alternativo de bloqueio de login (**FA01**) e à especificação de privacidade e validação de documentos (**Seção 6.2 da RFC / LGPD**).

*Problemas Identificados:*
1. *CORS Irrestrito e Segredo JWT Hardcoded:* Em `backend/src/app.ts` (linha 8), `app.use(cors())` está habilitado sem restrição de origem (`FRONTEND_URL`). Além disso, em `backend/src/middlewares/authMiddleware.ts` (linha 40) e `backend/src/services/authService.ts` (linha 79), existe o fallback estático `'super_secret_jwt_key_pernas_solidarias_2026'`, permitindo a forja de tokens caso `process.env.JWT_SECRET` não seja definido no ambiente.
2. *Falha no Fluxo de Bloqueio de Login (FA01), Falta de Normalização de E-mail e Interceptor 401:* Em `backend/src/services/authService.ts` (linhas 42–74), o método `login()` não normaliza o e-mail (`trim().toLowerCase()`) como faz o `register()`, e quando o bloqueio temporário de 15 minutos (`bloqueado_ate`) expira, o contador `tentativas_falhas` permanece `>= 5`, rebloqueando o usuário já na primeira tentativa falha subsequente. No frontend, `frontend/src/services/api.ts` (linhas 28–32) dispara o evento global `auth:unauthorized` mesmo quando o erro `401` vem do próprio endpoint `/auth/login`.
3. *Exibição Indevida de CPF em Tela (LGPD) e Ausência de Validação de Dígitos Verificadores:* Em `frontend/src/pages/Participants/ParticipantsPage.tsx` (linhas 293 e 394), o CPF completo de cadeirantes e condutores é exibido na tabela principal, contrariando a **Seção 6.2 da RFC** (*"Os CPFs são armazenados sem formatação e não são exibidos na interface após o cadastro"*). Adicionalmente, `backend/src/services/wheelchairUserService.ts` (linhas 44–47), `backend/src/services/runnerService.ts` (linhas 43–46) e `frontend/src/pages/Participants/ParticipantModal.tsx` (linhas 73–78) validam apenas `cleanCpf.length !== 11`, aceitando CPFs inválidos como `00000000000` ou `11111111111`.

*Correção Proposta:*
1. Em `backend/src/app.ts` e `backend/src/middlewares/authMiddleware.ts` (e `authService.ts`), restringir o CORS por variável de ambiente e exigir `JWT_SECRET` obrigatoriamente:
   ```typescript
   // backend/src/app.ts
   app.use(
     cors({
       origin: process.env.FRONTEND_URL || 'http://localhost:5173',
       credentials: true,
     })
   );

   // backend/src/middlewares/authMiddleware.ts e authService.ts
   const secret = process.env.JWT_SECRET;
   if (!secret) {
     throw new Error('FATAL: JWT_SECRET não configurado nas variáveis de ambiente.');
   }
   ```

2. Em `backend/src/services/authService.ts` e `frontend/src/services/api.ts`, normalizar o e-mail no login, resetar `tentativas_falhas` após expiração do bloqueio e ignorar `/auth/login` no interceptor de `401`:
   ```typescript
   // backend/src/services/authService.ts
   const emailNormalizado = email.trim().toLowerCase();
   const user = await this.userRepository.findByEmail(emailNormalizado);
   // ...
   if (user.bloqueado_ate) {
     const lockUntil = new Date(user.bloqueado_ate);
     if (new Date() < lockUntil) {
       const remainingMinutes = Math.ceil((lockUntil.getTime() - Date.now()) / (1000 * 60));
       throw new AppError(
         `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${remainingMinutes} minuto(s).`,
         429
       );
     } else {
       await this.userRepository.resetFailedAttempts(user.cd_user);
     }
   }

   // frontend/src/services/api.ts
   if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
     localStorage.removeItem('@PernasSolidarias:token');
     localStorage.removeItem('@PernasSolidarias:user');
     window.dispatchEvent(new Event('auth:unauthorized'));
   }
   ```

3. Em `backend/src/services/wheelchairUserService.ts`, `runnerService.ts` e `frontend/src/pages/Participants/ParticipantModal.tsx`, validar os dígitos verificadores do CPF (módulo 11) e ocultar/mascarar a coluna de CPF em `ParticipantsPage.tsx`:
   ```typescript
   export function isValidCPF(cpf: string): boolean {
     const clean = cpf.replace(/\D/g, '');
     if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
     let sum = 0;
     for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
     let rest = (sum * 10) % 11;
     if (rest === 10 || rest === 11) rest = 0;
     if (rest !== parseInt(clean.substring(9, 10), 10)) return false;
     sum = 0;
     for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
     rest = (sum * 10) % 11;
     if (rest === 10 || rest === 11) rest = 0;
     return rest === parseInt(clean.substring(10, 11), 10);
   }
   ```

---

## Issue 2

**Titulo:** Corrigir regras de negócio na formação de duplas, sanitizar parâmetros de consulta e adequar requisitos pendentes da RFC (RF02, RF09, RF10)

*Contexto:*
Durante a revisão das regras de negócio (**RN03**, **RN07**, **RN08**), dos endpoints da API e das telas de Dashboard, Formação de Duplas, Eventos e Histórico do sistema **Pernas Solidárias**, foram identificados bugs de cálculo de fila de prioridade, falhas de validação de query params e lacunas funcionais em relação à RFC do projeto.

*Problemas Identificados:*
1. *Cálculo de Prioridade Distorcido por Eventos Futuros (RN03):* Em `backend/src/repositories/pairRepository.ts` (`findPrioritizedWheelchairUsers` nas linhas 24–28 e `findPrioritizedRunners` nas linhas 52–56), a ordenação `ORDER BY MAX(e.dt_evento) ASC NULLS FIRST` faz `JOIN` com todos os eventos `d.cd_evento <> $1`, sem restringir `e.dt_evento <= CURRENT_DATE`. Caso existam corridas futuras já planejadas com duplas pré-alocadas, a data futura sobrescreve a última participação real no passado.
2. *Erro SQL 500 por `NaN` no Ranking e Despadronização de Respostas de Erro:* Em `backend/src/controllers/analyticsController.ts` (linha 9), `parseInt(req.query.limit as string, 10)` não trata valores inválidos (`NaN`) ou menores que 1 antes de executar `LIMIT $1` no PostgreSQL. Além disso, `backend/src/controllers/pairController.ts` (linhas 15, 37, 60, 88) retorna `{ error: '...' }` sem `message`, enquanto `errorHandler.ts` (linhas 21–24) retorna `{ status: 'error', message: '...' }`.
3. *Exibição de Eventos Passados como "Próximo Evento" e Inativos no Modal de Edição de Dupla (RN07):* Em `frontend/src/pages/Dashboard/DashboardPage.tsx` (linhas 80–85), `upcomingEvents` ordena todos os eventos em ordem crescente sem filtrar `dt_evento >= hoje`, fazendo com que o card "Próximo Evento" exiba o evento mais antigo do histórico. Já em `frontend/src/pages/PairFormation/EditPairModal.tsx` (linhas 116–121 e 132–136), o `<Select>` permite escolher participantes inativos, gerando erro `400` ao submeter.
4. *Requisitos Funcionais Incompletos perante a RFC (RF02, RF09 e RF10):*
   - **RF02:** A tabela `EVENTO` (`backend/src/database/init-database.sql`, linhas 10–15) e o modal `EventModal.tsx` não possuem o campo obrigatório `local` do evento.
   - **RF09:** O filtro de histórico (`backend/src/repositories/pairRepository.ts`, `findHistory` linhas 210–265, e `HistoryPage.tsx`) não permite filtrar por *número de participações*.
   - **RF10:** Não há endpoint em `backend/src/routes/exportRoutes.ts` nem ação no cabeçalho de `HistoryPage.tsx` para exportar o relatório consolidado a partir da tela de histórico geral.

*Correção Proposta:*
1. Em `backend/src/repositories/pairRepository.ts`, considerar apenas eventos realizados até a data do evento atual (ou `CURRENT_DATE`) no cálculo de prioridade:
   ```typescript
   // backend/src/repositories/pairRepository.ts (findPrioritizedWheelchairUsers e findPrioritizedRunners)
   LEFT JOIN DUPLA d ON d.cd_cadeirante = c.cd_cadeirante AND d.cd_evento <> $1
   LEFT JOIN EVENTO e ON e.cd_evento = d.cd_evento AND e.dt_evento <= CURRENT_DATE
   ```

2. Em `backend/src/controllers/analyticsController.ts` e `backend/src/middlewares/errorHandler.ts`, sanitizar o parâmetro `limit` e padronizar os campos de erro (`message` e `error`):
   ```typescript
   // backend/src/controllers/analyticsController.ts
   const parsedLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
   const limit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 5 : Math.min(parsedLimit, 100);
   const data = await analyticsService.getRankings(limit);

   // backend/src/middlewares/errorHandler.ts
   if (err instanceof AppError) {
     res.status(err.statusCode).json({
       status: 'error',
       message: err.message,
       error: err.message,
     });
     return;
   }
   ```

3. Em `frontend/src/pages/Dashboard/DashboardPage.tsx` e `frontend/src/pages/PairFormation/EditPairModal.tsx`, filtrar eventos futuros para o card "Próximo Evento" e listar apenas participantes ativos (ou o integrante atual da dupla) nos selects de edição:
   ```typescript
   // frontend/src/pages/Dashboard/DashboardPage.tsx
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const upcomingEvents = events
     .filter((evt) => new Date(evt.dt_evento).getTime() >= today.getTime())
     .sort((a, b) => new Date(a.dt_evento).getTime() - new Date(b.dt_evento).getTime());
   const nextEvent = upcomingEvents[0] || null;

   // frontend/src/pages/PairFormation/EditPairModal.tsx
   const eligibleCadeirantes = cadeirantes.filter(
     (c) => c.ativo || c.cd_cadeirante === pair?.cd_cadeirante
   );
   const eligibleCondutores = condutores.filter(
     (c) => c.ativo || c.cd_condutor === pair?.cd_condutor
   );
   ```

4. Em `backend/src/database/init-database.sql` (e camadas correspondentes), adicionar a coluna `local` em `EVENTO` (**RF02**), suportar filtro por quantidade de participações em `findHistory` (**RF09**) e expor `GET /api/export/history` (**RF10**):
   ```sql
   -- backend/src/database/init-database.sql
   ALTER TABLE EVENTO ADD COLUMN IF NOT EXISTS local VARCHAR(255);
   ```

