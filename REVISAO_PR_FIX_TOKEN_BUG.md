# Revisão de Pull Request — Branch `fix/token_bug`

- **Repositório:** `Pernas_Solidarias`
- **Comparação analisada:** `origin/dev` (`f9be28b`) ← `fix/token_bug` (`c02698d`)
- **Escopo da branch:** Invalidação de tokens JWT de instâncias anteriores do servidor via `SERVER_BOOT_ID`, inclusão de `jwtid` no login e ajustes de redirecionamento de autenticação/logout no frontend (`ProtectedRoute`, `Sidebar` e `LoginPage`).

---

## Resumo dos arquivos analisados na branch

1. **`serverInstance.ts` (linhas 1–5 — `SERVER_BOOT_ID`):** geração de UUID volátil em memória a cada boot derruba todas as sessões ativas a cada *hot-reload* do `tsx watch` em desenvolvimento (`docker-compose.yml`), anula na prática o `JWT_EXPIRES_IN=7d` em deploys/restarts e impede escalabilidade horizontal com múltiplas réplicas; considere permitir `process.env.SERVER_BOOT_ID` ou validar a existência/versão do usuário no banco.
2. **`authMiddleware.ts` (linhas 6–13 e 44–60 — `TokenPayload` / `authMiddleware`):** `next()` chamado dentro do `try` captura indevidamente erros síncronos de middlewares posteriores e os mascara como `401`; `AppError` é lançado dentro do `try` apenas para ser relançado no `catch`; falta validar se `decoded` é um objeto válido antes do cast `as TokenPayload`; e a mensagem na linha 50 expõe detalhe interno de infraestrutura (`"servidor reiniciado"`).
3. **`authService.ts` (linhas 80–93 — `AuthService.login`):** `jwtid: crypto.randomUUID()` adiciona o claim `jti` ao token sem nenhuma persistência, auditoria ou validação correspondente no backend (metadado morto), `bootId` volátil conflita com a expiração configurada de `7d`, e o cast `{ ... } as jwt.SignOptions` suprime checagem estática das opções do `jwt.sign` (além do fallback de `JWT_SECRET` hardcoded na linha 79).
4. **`ProtectedRoute.tsx` (linhas 1–8 e 15–19 — `ProtectedRoute`):** a remoção completa de `state={{ from: location }}` quebra o *deep linking* pós-login em toda a aplicação — se o token expirar ou o container reiniciar enquanto o coordenador estiver em `/duplas` ou `/historico` (ou ao abrir um link salvo), após relogar ele perde a página original; além disso, o motivo da expiração (`401`) nunca chega à tela de login.
5. **`Sidebar.tsx` (linhas 21–28 e 116–123 — `Sidebar` / `handleLogout`):** `handleLogout` não chama `onClose()` para recolher o menu lateral no mobile ao sair, o botão de logout (linha 116) não define `type="button"` explicitamente, e vale limpar explicitamente o `state` na navegação (`navigate('/login', { replace: true, state: null })`) caso o redirecionamento `from` seja mantido em `ProtectedRoute`.
6. **`LoginPage.tsx` (linhas 10–19 e 30–38 — `LoginPage` / `handleSubmit`):** usuários já autenticados conseguem acessar e visualizar `/login` sem serem redirecionados para `/`; `navigate('/', { replace: true })` fixo ignora rotas internas de origem seguras; `login(email, senha)` envia `email` sem `.trim()` (divergindo da validação na linha 24); e `catch (err: any)` usa `any` desnecessariamente em vez de `unknown`.

---

> **Como usar este guia no GitHub:** Abra a aba **Files changed** da Pull Request (`fix/token_bug` → `dev`). Para cada arquivo abaixo, selecione as linhas indicadas no lado direito (`+`) do diff e cole o bloco **Comentário para a PR**.

---

## 1. `backend/src/config/serverInstance.ts`

### 1.1. `SERVER_BOOT_ID` em memória desloga usuários a cada *hot-reload* (`tsx watch`) e quebra múltiplas instâncias
- **Linhas para comentar (lado direito `+`):** `1` a `5` (especialmente linha `5`)
- **Severidade:** **Alta (Arquitetura / DX / Disponibilidade)**
- **Problema:**
  1. No `docker-compose.yml` (linha 28) e `backend/package.json` (linha 7), o backend sobe com `tsx watch src/server.ts`. A cada alteração de código salva no backend (ou qualquer restart rápido do container), `SERVER_BOOT_ID` muda e **invalida instantaneamente todos os tokens ativos**, forçando novo login constante durante o desenvolvimento e contradizendo `JWT_EXPIRES_IN=7d`.
  2. Guardar estado de validação de sessão na memória RAM de um processo específico quebra a natureza *stateless* do JWT: se o backend rodar com mais de 1 instância/worker (PM2 cluster, múltiplas réplicas Docker/K8s), cada réplica terá um `SERVER_BOOT_ID` diferente e rejeitará os tokens emitidos pelas outras.
  3. Se o problema original era o banco ser recriado do zero (`docker compose down -v`) mantendo um token antigo no navegador, validar o usuário no banco (ou gravar um identificador de instância/seed no PostgreSQL) resolve a causa raiz sem derrubar sessões em restarts normais da API.

**Comentário para a PR:**
> **Arquitetura / DX (`SERVER_BOOT_ID` volátil em memória):**
> Gerar um `crypto.randomUUID()` em memória a cada inicialização traz dois efeitos colaterais importantes:
> 1. **Em desenvolvimento (`tsx watch` no Docker):** qualquer `Ctrl+S` em arquivos do backend reinicia o processo Node, troca o `SERVER_BOOT_ID` e derruba a sessão do usuário logado a todo instante.
> 2. **Em produção / deploys:** qualquer restart ou deploy da API invalida todos os tokens de `7d` (`JWT_EXPIRES_IN`), além de impedir rodar mais de uma instância/worker do backend (cada processo teria um UUID diferente).
>
> **Sugestão:** Permitir ao menos uma variável de ambiente de fallback em dev (`export const SERVER_BOOT_ID = process.env.SERVER_BOOT_ID || crypto.randomUUID();`) ou, caso o objetivo seja proteger contra reset de volume do banco no Docker, validar se o `userId`/`email` do token continua válido no banco (ou persistir uma versão/chave de sessão na tabela `"USER"`).

---

## 2. `backend/src/middlewares/authMiddleware.ts`

### 2.1. `next()` dentro do `try` e `throw AppError` capturado pelo próprio `catch`
- **Linhas para comentar (lado direito `+`):** `44` a `60`
- **Severidade:** **Alta (Bug de Tratamento de Erros no Express)**
- **Problema:**
  1. Na linha `54`, `next()` é chamado **dentro** do bloco `try`. Se qualquer middleware síncrono subsequente disparar um erro inesperado (que não seja instância de `AppError`), o `catch` do `authMiddleware` irá interceptá-lo e transformá-lo incorretamente em `401 'Token inválido ou expirado.'`, ocultando um erro `500` real!
  2. Nas linhas `44` e `50`, lança-se `AppError` dentro do `try` apenas para precisar filtrar `if (error instanceof AppError) { throw error; }` nas linhas `56–58`. Isolar somente `jwt.verify` no `try/catch` elimina esse rethrow e evita interceptar `next()`.
  3. Na linha `46`, `jwt.verify(token, secret)` pode retornar `string` ou um payload sem `userId` numérico; convém validar `typeof decoded === 'object' && decoded !== null && typeof decoded.userId === 'number'` antes do cast `as TokenPayload`.

**Comentário para a PR:**
> **Bug potencial com `next()` dentro do `try` + simplificação de fluxo:**
> 1. Chamar `next()` dentro do `try` (linha 54) faz com que erros síncronos lançados em middlewares/rotas seguintes (que não sejam `AppError`) caiam neste `catch` e sejam mascarados como `401 'Token inválido ou expirado.'`.
> 2. Isolando apenas o `jwt.verify` no `try/catch`, você também elimina a necessidade de `if (error instanceof AppError) throw error` e pode validar o formato do payload com segurança:
> ```ts
>   if (!token) {
>     throw new AppError('Token inválido.', 401);
>   }
>
>   let decoded: string | jwt.JwtPayload;
>   try {
>     decoded = jwt.verify(token, secret);
>   } catch {
>     throw new AppError('Token inválido ou expirado.', 401);
>   }
>
>   if (
>     typeof decoded !== 'object' ||
>     decoded === null ||
>     typeof decoded.userId !== 'number' ||
>     !decoded.bootId ||
>     decoded.bootId !== SERVER_BOOT_ID
>   ) {
>     throw new AppError('Sessão expirada. Por favor, faça login novamente.', 401);
>   }
>
>   req.user = decoded as TokenPayload;
>   next();
> ```

---

### 2.2. Exposição de detalhe interno na mensagem de erro (`servidor reiniciado`) e `jti` não utilizado
- **Linhas para comentar (lado direito `+`):** `9` a `10` e `49` a `51`
- **Severidade:** Baixa-Média (Segurança / Limpeza de Código)
- **Problema:**
  1. A mensagem `'Sessão expirada ou servidor reiniciado. Por favor, faça login novamente.'` expõe ao cliente externo quando o processo backend sofreu restart/crash ( e na prática essa mensagem sequer é exibida no frontend, pois o interceptor de `401` apenas limpa o `localStorage` e redireciona para `/login`).
  2. `jti?: string` foi adicionado em `TokenPayload` (linha `10`), mas nunca é lido ou validado em nenhum ponto.

**Comentário para a PR:**
> **Segurança / Limpeza:**
> - Na linha 50, evite expor eventos internos de infraestrutura na mensagem pública da API (`"servidor reiniciado"`). Prefira apenas `'Sessão expirada. Por favor, faça login novamente.'`.
> - Na linha 10, a propriedade `jti?: string` em `TokenPayload` não está sendo utilizada em nenhuma validação de revogação — se não houver *denylist* de tokens planejada nesta PR, pode ser removida junto com o `jwtid`.

---

## 3. `backend/src/services/authService.ts`

### 3.1. `jwtid` gerado sem uso real, cast `as jwt.SignOptions` e segredo hardcoded adjacente
- **Linhas para comentar (lado direito `+`):** `80` a `93`
- **Severidade:** Baixa-Média (Qualidade de Código / Segurança)
- **Problema:**
  1. `jwtid: crypto.randomUUID()` (linha `91`) aumenta o tamanho de todo token JWT emitido sem haver armazenamento ou checagem de revogação por `jti` no backend.
  2. O type assertion `{ expiresIn, jwtid: ... } as jwt.SignOptions` (linhas `89–92`) força a tipagem do objeto inteiro de opções em vez de tipar apenas `expiresIn`.
  3. Na linha `79` (logo acima do trecho alterado), permanece o fallback hardcoded `'super_secret_jwt_key_pernas_solidarias_2026'`, que deve ser evitado exigindo `process.env.JWT_SECRET`.

**Comentário para a PR:**
> **Sugestões na geração do JWT:**
> 1. `jwtid: crypto.randomUUID()` (linha 91) gera o claim `jti`, mas não há nenhuma validação/revogação usando `jti` no `authMiddleware` ou no banco. Se não for usado para *blacklist* de tokens, vale remover para enxugar o payload do token.
> 2. Em vez de fazer cast do objeto inteiro com `as jwt.SignOptions` (linha 92), tipe `const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];` para manter validação estática nas demais propriedades de `jwt.sign`.
> 3. Aproveitando a mexida na assinatura do token, considere remover o fallback hardcoded de `JWT_SECRET` na linha 79 (e no `authMiddleware`), falhando caso a variável de ambiente não esteja configurada.

---

## 4. `frontend/src/components/layout/ProtectedRoute.tsx`

### 4.1. Remoção de `state={{ from: location }}` quebra *deep linking* e descarta feedback de sessão expirada
- **Linhas para comentar (lado direito `+`):** `15` a `19` (linha `18`)
- **Severidade:** **Média-Alta (Regressão de UX / Navegação)**
- **Problema:**
  1. Ao remover `state={{ from: location }}`, se o usuário acessar diretamente uma URL interna (ex.: `/duplas` ou `/historico`) ou tiver a sessão expirada pelo novo `SERVER_BOOT_ID` no meio do uso, após fazer login ele perde a rota onde estava e volta sempre para `/`.
  2. Como o `Sidebar.tsx` já foi corrigido nesta PR para navegar diretamente para `/login` no clique de "Sair" (`handleLogout`), manter o `state={{ from: location }}` no `ProtectedRoute` não causará mais retorno indesejado à rota anterior após logout manual (basta o `Sidebar` passar `state: null` no `navigate('/login', { replace: true, state: null })`).

**Comentário para a PR:**
> **Regressão de navegação pós-login (*deep linking*):**
> Remover `state={{ from: location }}` faz com que o coordenador perca a página em que estava trabalhando sempre que a sessão expirar (inclusive quando o container reiniciar por causa do novo `SERVER_BOOT_ID`) ou quando abrir um link direto salvo nos favoritos (ex: `/duplas`).
>
> Como o logout manual no `Sidebar.tsx` já foi ajustado para chamar `navigate('/login', { replace: true })` diretamente, você pode manter `state={{ from: location }}` aqui no `ProtectedRoute` e apenas limpar o state no logout explícito (`navigate('/login', { replace: true, state: null })` no `Sidebar`), preservando o redirecionamento inteligente quando a sessão expirar!

---

## 5. `frontend/src/components/layout/Sidebar.tsx`

### 5.1. Fechamento do drawer mobile no `handleLogout`, limpeza de `state` e atributo `type="button"`
- **Linhas para comentar (lado direito `+`):** `25` a `28` e `116` a `120`
- **Severidade:** Baixa (UX Mobile / Boas Práticas React)
- **Problema:**
  1. Nos itens de navegação (`NavLink`, linha `90`), `onClose` é acionado para fechar o menu lateral em dispositivos móveis, mas `handleLogout` (`linhas 25–28`) não chama `onClose()`.
  2. Passar `state: null` em `navigate('/login', { replace: true, state: null })` garante limpeza explícita de qualquer estado anterior de rota.
  3. O `<button>` de sair (`linha 116`) não especifica `type="button"`.

**Comentário para a PR:**
> **Pequenos ajustes no `handleLogout` e botão de sair:**
> 1. Nas linhas 25–28, vale chamar `onClose()` ao deslogar (consistente com os `NavLink` no mobile) e limpar qualquer estado de rota com `state: null`:
> ```tsx
>   const handleLogout = () => {
>     onClose();
>     logout();
>     navigate('/login', { replace: true, state: null });
>   };
> ```
> 2. Na linha 116, adicione `type="button"` explicitamente ao `<button>` de logout.

---

## 6. `frontend/src/pages/Auth/LoginPage.tsx`

### 6.1. Usuário já autenticado consegue acessar `/login` sem redirecionamento
- **Linhas para comentar (lado direito `+`):** `10` a `19`
- **Severidade:** Média (Bug de Fluxo de Sessão)
- **Problema:** Se o usuário já estiver autenticado (`isAuthenticated === true` no `useAuth()`) e navegar para `/login` pela barra de endereços ou histórico do navegador, o formulário de login é exibido normalmente em vez de redirecionar para `/`.

**Comentário para a PR:**
> **Fluxo de sessão ativa em `/login`:** Se o coordenador já estiver autenticado (`isAuthenticated` verdadeiro e `!isLoading` no `useAuth`) e acessar `/login`, a tela de login continua sendo exibida. Vale redirecionar automaticamente usuários já logados:
> ```tsx
> const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
>
> if (!isAuthLoading && isAuthenticated) {
>   return <Navigate to="/" replace />;
> }
> ```

---

### 6.2. Redirecionamento fixo para `/`, falta de `.trim()` no envio do `email` e uso de `any` no `catch`
- **Linhas para comentar (lado direito `+`):** `30` a `38`
- **Severidade:** Baixa-Média (UX / Validação / Tipagem TypeScript)
- **Problema:**
  1. Na linha `33`, `navigate('/', { replace: true })` ignora rotas internas válidas caso `ProtectedRoute` preserve a página onde a sessão expirou. Validar se `from` começa com `'/'` e é diferente de `'/login'` resolve com segurança (sem risco de *Open Redirect*).
  2. Na linha `31`, `await login(email, senha)` envia `email` sem `.trim()`, apesar de a validação na linha `24` checar `!email.trim()`.
  3. Na linha `34`, `catch (err: any)` pode ser `catch (err: unknown)` (já suportado por `mensagemDeErro`).
  4. *(Observação relacionada a `api.ts`)*: Quando `login(email, senha)` retorna `401` por senha incorreta, o interceptor global em `frontend/src/services/api.ts` (linha 28) dispara `auth:unauthorized` indevidamente — vale ignorar `/auth/login` naquele interceptor para não disparar eventos globais de sessão durante falha comum de credenciais.

**Comentário para a PR:**
> **Melhorias no `handleSubmit` (linhas 30–38):**
> 1. **Normalização no envio (linha 31):** Use `await login(email.trim(), senha);` para manter consistência com o `email.trim()` validado na linha 24 (e na linha 24 prefira `!senha` em vez de `!senha.trim()`).
> 2. **Tipagem segura (linha 34):** Troque `catch (err: any)` por `catch (err: unknown)`, pois `mensagemDeErro` já aceita `unknown`.
> 3. **Rota pós-login segura (linha 33):** Caso restaure o `from` no `ProtectedRoute`, valide apenas caminhos internos (`const target = typeof from === 'string' && from.startsWith('/') && from !== '/login' ? from : '/';`) antes de chamar `navigate(target, { replace: true })`.

---

## Comentário Geral Sugerido (Resumo para o "Review changes" da PR)

> Analisei as alterações da branch `fix/token_bug` e deixei comentários pontuais por arquivo. Principais pontos de atenção antes do merge:
> 1. **`serverInstance.ts` / `authService.ts`:** O `SERVER_BOOT_ID` volátil em memória derruba todas as sessões a cada *hot-reload* do `tsx watch` no Docker em desenvolvimento, invalida tokens de `7d` em qualquer restart/deploy e impede múltiplas instâncias. Além disso, o `jwtid` adicionado no `jwt.sign` não está sendo utilizado em nenhuma validação.
> 2. **`authMiddleware.ts`:** Mover `next()` e as validações de negócio para fora do `try/catch` do `jwt.verify` para evitar que erros síncronos de middlewares seguintes sejam capturados e transformados incorretamente em `401`, além de validar se `decoded` é um objeto antes do cast e não expor `"servidor reiniciado"` na mensagem pública.
> 3. **`ProtectedRoute.tsx` / `LoginPage.tsx` / `Sidebar.tsx`:** A remoção de `state={{ from: location }}` quebra o retorno à página original quando a sessão expira; como o `Sidebar` já navega explicitamente para `/login` no logout, basta passar `state: null` + `onClose()` no `handleLogout` e redirecionar usuários já autenticados que acessarem `/login`.

