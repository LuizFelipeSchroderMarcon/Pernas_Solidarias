# Revisão de Pull Request — Branch `login_bloq`

- **Repositório:** `Pernas_Solidarias`
- **Comparação analisada:** `origin/dev` (`f9be28b`) ← `login_bloq` (`f05d043`)
- **Escopo da branch:** Bloqueio temporário de escrita/submissão no login após múltiplas tentativas falhas consecutivas e retorno do tempo restante (`remaining_seconds` / `bloqueado_ate`) pelo backend.

---

## Sumário Rápido por Arquivo

| Arquivo | Qtd. de Pontos | Principais Pontos Encontrados |
| :--- | :---: | :--- |
| `backend/src/middlewares/errorHandler.ts` | 2 | Risco de sobrescrita de `status`/`message` no spread de `details`; ausência do header padrão `Retry-After` em `429`. |
| `backend/src/models/types.ts` | 1 | Acoplamento do campo calculado/transiente `remaining_seconds` na interface base da entidade `User`. |
| `backend/src/repositories/userRepository.ts` | 3 | Divergência potencial de fuso horário (`TIMESTAMP` sem timezone vs `NOW()`); busca de e-mail *case-sensitive*; renovação indevida do bloqueio em requisições concorrentes + duplicação de SQL. |
| `backend/src/services/authService.ts` | 4 | Falta de normalização do `email` no `login()`; duplicação de código/números mágicos nos blocos de `429`; possível desalinhamento entre `bloqueado_ate` e `remaining_seconds`; enumeração de usuários. |
| `frontend/src/pages/Auth/LoginPage.tsx` | 6 | Campo de **E-mail** bloqueado globalmente para qualquer conta; leitura duplicada e sem `try/catch` do `localStorage`; remoção do toast de erro; uso de `any`; fallback cego de 15 min para qualquer `429`; acessibilidade/UX do contador de 1s. |

> **Como usar este guia no GitHub:** Abra a aba **Files changed** da Pull Request. Para cada arquivo abaixo, clique no botão `+` nas linhas indicadas (lado direito / verde do diff) e cole o bloco **Comentário para a PR**.

---

## 1. `backend/src/middlewares/errorHandler.ts`

### 1.1. Spread de `err.details` pode sobrescrever `status` e `message` da resposta
- **Linhas para comentar (lado direito `+`):** `21` a `25` (ou diretamente na linha `24`)
- **Severidade:** Média (Confiabilidade de Contrato da API)
- **Problema:** O spread `...(err.details || {})` está posicionado **depois** de `status: 'error'` e `message: err.message` na raiz do objeto JSON. Se qualquer instância futura de `AppError` passar uma chave `message` ou `status` dentro de `details`, ela sobrescreverá silenciosamente os campos obrigatórios do contrato de erro.

**Comentário para a PR:**
> **Sugestão (segurança do contrato de erro):** Como `...(err.details || {})` está sendo espalhado depois de `status` e `message` na raiz do JSON, qualquer chave homônima dentro de `details` sobrescreverá `status: 'error'` ou `message: err.message`.
>
> Para manter compatibilidade com os campos na raiz sem risco de sobrescrita (ou, melhor ainda, isolar em uma chave `details`), inverta a ordem das propriedades:
> ```ts
>     res.status(err.statusCode).json({
>       ...(err.details || {}),
>       status: 'error',
>       message: err.message,
>     });
> ```

---

### 1.2. Inclusão do header HTTP `Retry-After` para respostas `429`
- **Linhas para comentar (lado direito `+`):** `20` a `26`
- **Severidade:** Baixa (Melhoria / Padrão HTTP RFC 9110)
- **Problema:** Quando o backend responde `429 Too Many Requests` informando `remaining_seconds`, não é enviado o cabeçalho HTTP padrão `Retry-After`.

**Comentário para a PR:**
> **Melhoria (Padrão HTTP):** Quando `err.statusCode === 429` e `typeof err.details?.remaining_seconds === 'number'`, vale definir o header padrão `Retry-After`:
> ```ts
>   if (err instanceof AppError) {
>     if (err.statusCode === 429 && typeof err.details?.remaining_seconds === 'number') {
>       res.setHeader('Retry-After', String(Math.ceil(err.details.remaining_seconds)));
>     }
>     res.status(err.statusCode).json({
>       ...(err.details || {}),
>       status: 'error',
>       message: err.message,
>     });
>     return;
>   }
> ```

---

## 2. `backend/src/models/types.ts`

### 2.1. Campo calculado `remaining_seconds` acoplado à entidade de domínio `User`
- **Linhas para comentar (lado direito `+`):** `13` a `17` (linha `16`)
- **Severidade:** Baixa (Arquitetura / Tipagem)
- **Problema:** `remaining_seconds` não existe na tabela `"USER"` (`init-database.sql`) e não é retornado por métodos como `findById` ou `create`, mas apenas como coluna calculada nas queries de autenticação. Mantê-lo na interface global `User` mistura estado persistido com projeção específica de login.

**Comentário para a PR:**
> **Sugestão de tipagem:** `remaining_seconds` não é uma coluna da tabela `"USER"`, mas sim uma projeção calculada apenas em `findByEmail` e `incrementFailedAttempts` (`findById` e `create` não retornam esse valor). Em vez de adicioná-lo na entidade base `User`, seria mais limpo criar um tipo derivado para o fluxo de autenticação, por exemplo:
> ```ts
> export interface UserWithLockout extends User {
>   remaining_seconds: number;
> }
> ```

---

## 3. `backend/src/repositories/userRepository.ts`

### 3.1. Divergência potencial de Timezone (`TIMESTAMP` vs `NOW()`) e duplicação de SQL + `SELECT *`
- **Linhas para comentar (lado direito `+`):** `6` a `16` e `49` a `54`
- **Severidade:** Alta (Bug Potencial de Fuso Horário / Manutenibilidade)
- **Problema:**
  1. Em `init-database.sql` (linha 6), `bloqueado_ate` é `TIMESTAMP` (*without time zone*), enquanto `NOW()` retorna `TIMESTAMPTZ`. Quando o driver `pg` lê `bloqueado_ate` para `Date` no Node.js, ele interpreta o valor no fuso local do processo Node. Se o container do PostgreSQL rodar em `UTC` e o backend em `America/Sao_Paulo` (ou vice-versa), `bloqueado_ate` convertido em ISO no `AuthService` ficará deslocado em **3 horas** em relação a `remaining_seconds`.
  2. A expressão `CASE WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() ... END AS remaining_seconds` está duplicada nos dois métodos.
  3. Na linha `7`, `SELECT *` pode ser substituído pelas colunas explícitas necessárias (`cd_user, email, senha, tentativas_falhas, bloqueado_ate, created_at`).

**Comentário para a PR:**
> **Atenção (Timezone + Duplicação SQL):**
> 1. Na tabela `"USER"`, a coluna `bloqueado_ate` foi criada como `TIMESTAMP` (sem timezone), enquanto `NOW()` usa `TIMESTAMPTZ`. Se o PostgreSQL estiver em `UTC` (comum em Docker) e o processo Node.js em `GMT-3`, `remaining_seconds` virá correto (`900`), mas o `Date` retornado em `bloqueado_ate` será interpretado no fuso local pelo `pg`, gerando diferença de horas ao converter para `.toISOString()` no `AuthService`. O ideal é migrar `bloqueado_ate` para `TIMESTAMPTZ` (ou calcular o ISO a partir de `remaining_seconds`).
> 2. O trecho `CASE WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() ... END AS remaining_seconds` está duplicado em `findByEmail` e `incrementFailedAttempts` — vale extrair para uma constante reutilizável na classe e listar explicitamente as colunas no `SELECT` em vez de `SELECT *`.

---

### 3.2. Busca de e-mail sensível a maiúsculas/minúsculas em `findByEmail`
- **Linhas para comentar (lado direito `+`):** `13` a `15` (linha `14`)
- **Severidade:** Média-Alta (Bug Funcional)
- **Problema:** No cadastro (`authService.register`), o e-mail é salvo com `.trim().toLowerCase()`, mas `findByEmail` faz `WHERE email = $1` sem normalização. Se o usuário digitar `Coordenador@exemplo.com` (comum em teclados mobile), a query retorna `null`.

**Comentário para a PR:**
> **Bug funcional (case-sensitivity):** No `register`, o e-mail é normalizado com `trim().toLowerCase()`, mas aqui a busca `WHERE email = $1` diferencia maiúsculas e minúsculas. Vale normalizar o parâmetro (`email.trim().toLowerCase()`) ou usar `WHERE LOWER(email) = LOWER($1)`.

---

### 3.3. Requisições concorrentes podem renovar repetidamente o tempo de bloqueio
- **Linhas para comentar (lado direito `+`):** `46` a `48` (contexto do segundo hunk de `incrementFailedAttempts`, referente ao `CASE` de `bloqueado_ate` nas linhas `43`–`47`)
- **Severidade:** Média (Concorrência)
- **Problema:** Se duas ou mais tentativas incorretas chegarem em paralelo antes do bloqueio ser lido no início do `login`, a 6ª requisição cai em `WHEN tentativas_falhas + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'`, sobrescrevendo e reiniciando o `bloqueado_ate` que já estava ativo.

**Comentário para a PR:**
> **Concorrência:** Caso cheguem requisições paralelas enquanto `bcrypt.compare` ainda está executando, chamadas subsequentes a `incrementFailedAttempts` cairão novamente em `WHEN tentativas_falhas + 1 >= 5` e sobrescreverão `bloqueado_ate`, estendendo o bloqueio a cada requisição em voo. Vale preservar o bloqueio já ativo adicionando a condição antes:
> ```sql
> bloqueado_ate = CASE
>   WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate <= NOW() THEN NULL
>   WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() THEN bloqueado_ate
>   WHEN tentativas_falhas + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
>   ELSE bloqueado_ate
> END
> ```

---

## 4. `backend/src/services/authService.ts`

### 4.1. Falta de normalização do `email` na entrada do `login()`
- **Linhas para comentar (lado direito `+`):** Linha `43` (início do hunk no diff; refere-se à chamada `findByEmail(email)` logo acima na linha `40`)
- **Severidade:** Média-Alta (Inconsistência com `register`)
- **Problema:** Em `register()` (linha `18`) é feito `const emailNormalizado = email.trim().toLowerCase();`, mas em `login()` (linha `40`) `email` é passado sem `.trim().toLowerCase()`.

**Comentário para a PR:**
> **Inconsistência com `register()`:** Na linha 40 (logo acima deste trecho), `this.userRepository.findByEmail(email)` recebe o `email` sem `.trim().toLowerCase()`, diferente do `register()` (linha 18). Se o usuário digitar letras maiúsculas ou um espaço acidental no fim do e-mail, o login falhará com `401 Credenciais inválidas` mesmo com a senha correta.

---

### 4.2. Duplicação de lógica na construção do erro `429` e números mágicos (`5` e `15 * 60`)
- **Linhas para comentar (lado direito `+`):** `53` a `68` e `75` a `93`
- **Severidade:** Média (Clean Code / Manutenibilidade)
- **Problema:** Os dois blocos que disparam o `AppError` com status `429` (usuário já bloqueado vs. usuário que acabou de atingir 5 falhas) repetem a mesma aritmética de `minutes`, `seconds`, cálculo de `lockUntil` e interpolação da mensagem, além de usar literais mágicos `5` e `15 * 60`.

**Comentário para a PR:**
> **Refatoração (DRY / Constantes):** Os blocos das linhas 53–68 e 75–93 repetem exatamente o mesmo cálculo de `minutes`, `seconds`, `lockUntil` e montagem do `AppError` 429, além dos números mágicos `5` e `15 * 60`.
>
> Sugestão: extrair constantes `MAX_LOGIN_ATTEMPTS = 5` e `LOCKOUT_DURATION_SECONDS = 15 * 60` e criar um método auxiliar privado:
> ```ts
> private createLockoutError(remainingSeconds: number): AppError {
>   const minutes = Math.floor(remainingSeconds / 60);
>   const seconds = remainingSeconds % 60;
>   const lockUntilIso = new Date(Date.now() + remainingSeconds * 1000).toISOString();
>
>   return new AppError(
>     `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${minutes} minuto(s) e ${seconds} segundo(s).`,
>     429,
>     {
>       bloqueado_ate: lockUntilIso,
>       remaining_seconds: remainingSeconds,
>     }
>   );
> }
> ```

---

### 4.3. Possível inconsistência entre `bloqueado_ate` e `remaining_seconds` no payload
- **Linhas para comentar (lado direito `+`):** `56` a `58` e `81` a `83`
- **Severidade:** Média (Confiabilidade de Dados)
- **Problema:** `remaining_seconds` é calculado pelo relógio do banco (`NOW()`), enquanto `new Date(user.bloqueado_ate).toISOString()` depende da interpretação de fuso de uma coluna `TIMESTAMP` sem timezone no Node.js. Se houver diferença de fuso ou *clock skew* entre banco e aplicação, os dois campos enviados no mesmo JSON representarão instantes diferentes.

**Comentário para a PR:**
> **Consistência dos campos de retorno:** Como `remaining_seconds` já vem calculado pelo PostgreSQL em relação ao `NOW()` do banco, derivar `lockUntilIso` diretamente de `new Date(Date.now() + activeRemainingSeconds * 1000).toISOString()` (ou migrar `bloqueado_ate` para `TIMESTAMPTZ`) evita que `bloqueado_ate` e `remaining_seconds` fiquem desalinhados caso o container do banco e o servidor Node estejam em timezones diferentes.

---

### 4.4. Enumeração de usuários através das mensagens de erro (`401` vs `429`)
- **Linhas para comentar (lado direito `+`):** `60` a `67` e `85` a `97`
- **Severidade:** Média (Segurança / OWASP)
- **Problema:** E-mails não cadastrados recebem sempre `401 "Credenciais inválidas."` (sem `bcrypt.compare` e sem bloqueio `429`), enquanto e-mails válidos recebem `"Credenciais inválidas. Tentativa X de 5..."` e depois `429`. Isso permite descobrir facilmente quais e-mails estão cadastrados e não limita tentativas de força bruta com e-mails variados.

**Comentário para a PR:**
> **Observação de Segurança (Enumeração de Usuários):** E-mails inexistentes retornam `"Credenciais inválidas."` imediatamente e nunca sofrem `429`, enquanto e-mails existentes expõem `"Tentativa X de 5"` e entram em bloqueio. Isso permite enumerar contas válidas no sistema. Caso o requisito da RFC exija exibir a contagem de tentativas, vale ao menos adicionar um *rate limit* por IP na rota `/auth/login` para mitigar varredura automatizada de e-mails.

---

## 5. `frontend/src/pages/Auth/LoginPage.tsx`

### 5.1. Bloqueio desabilita até o campo de E-mail e trava qualquer outra conta no navegador
- **Linhas para comentar (lado direito `+`):** `11`, `110` a `113` e `168`
- **Severidade:** **Alta (Bug de Regra de Negócio / UX)**
- **Problema:** No backend, o bloqueio de 15 minutos é aplicado **por usuário (`cd_user`)**. No frontend, porém, o estado usa uma chave global única (`@PernasSolidarias:loginBlockedUntil`) e desabilita **inclusive o `<Input label="E-mail" />` na linha `168` (`disabled={isLoading || isBlocked}`)**.
  - Se o coordenador errar 5 vezes porque digitou uma letra errada no próprio e-mail (ex.: e-mail de outro usuário) ou se dois coordenadores compartilharem o mesmo computador, **fica impossível corrigir ou trocar o e-mail na tela durante 15 minutos**.

**Comentário para a PR:**
> **Problema de UX / Regra de Negócio:** No backend o bloqueio é por conta (`cd_user`), mas aqui a chave `@PernasSolidarias:loginBlockedUntil` é global e a linha 168 desabilita inclusive o campo **E-mail** (`disabled={isLoading || isBlocked}`).
>
> Se o usuário digitar um e-mail errado por engano ou se outro coordenador tentar logar no mesmo navegador/computador, ele fica 15 minutos impedido até de corrigir o e-mail!
>
> **Sugestão:**
> 1. No `<Input label="E-mail" />` (linha 168), manter apenas `disabled={isLoading}` para permitir corrigir/trocar o e-mail.
> 2. Salvar no `localStorage` um mapa `{ [emailNormalizado]: unlockTime }` (ou `{ email, unlockTime }`) para que `isBlocked` só bloqueie a senha e o botão quando o `email.trim().toLowerCase()` atual corresponder à conta bloqueada.

---

### 5.2. Leitura duplicada do `localStorage` nos inicializadores de estado e risco de exceção sem `try/catch`
- **Linhas para comentar (lado direito `+`):** `29` a `47`
- **Severidade:** Média (Confiabilidade / Qualidade de Código)
- **Problema:**
  1. Os dois `useState` (`blockedUntil` e `remainingSeconds`) leem e validam `localStorage.getItem(LOGIN_BLOCK_UNTIL_KEY)` de forma duplicada (e chamam `Date.now()` em momentos distintos).
  2. Em navegadores com políticas restritas de privacidade/cookies bloqueados ou WebViews restritas, acessar `localStorage.getItem` / `setItem` / `removeItem` sem `try/catch` lança `SecurityError` e **quebra a renderização da tela de login inteira**.

**Comentário para a PR:**
> **Refatoração e segurança contra `SecurityError`:** A leitura e validação de `LOGIN_BLOCK_UNTIL_KEY` estão duplicadas nos dois `useState` iniciais, além de acessarem `localStorage` sem `try/catch` (o que pode quebrar a página em contextos onde o armazenamento local está bloqueado pelo navegador).
>
> Sugestão: extrair funções utilitárias seguras (`getSavedBlockTimestamp`, `saveBlockTimestamp`, `clearBlockTimestamp` com `try/catch`) e derivar o estado inicial de `remainingSeconds` a partir de uma única leitura.

---

### 5.3. Remoção do Toast de erro em todas as falhas de login
- **Linhas para comentar (lado direito `+`):** `24` e `94` a `116`
- **Severidade:** Baixa-Média (Consistência de UX)
- **Problema:** O hook `error` de `useToast()` foi removido e nenhuma falha de login (nem `401`, nem a entrada em `429`, nem erros `500`/offline) exibe mais notificação toast, divergindo do restante do sistema.

**Comentário para a PR:**
> **Consistência de UX:** A chamada `error('Falha na autenticação', msg)` do `useToast` foi removida para todos os cenários de erro (incluindo falha de conexão/servidor 500 e o momento em que o bloqueio 429 é acionado). Se a intenção era apenas evitar toasts repetidos enquanto bloqueado, vale manter o toast para erros inesperados/401 e dispará-lo uma única vez ao entrar no bloqueio `429`.

---

### 5.4. Uso de `any` no `catch` e no payload da resposta `429`
- **Linhas para comentar (lado direito `+`):** `94` a `108` (especificamente linhas `94` e `98`)
- **Severidade:** Baixa (Tipagem TypeScript)
- **Problema:** `catch (err: any)` e `const data = err.response.data as any` desabilitam a checagem de tipos desnecessariamente, já que `mensagemDeErro` e `axios.isAxiosError` aceitam `unknown`.

**Comentário para a PR:**
> **Tipagem TypeScript:** Evite `any` no `catch` e no cast de `err.response.data`. Como `mensagemDeErro` e `axios.isAxiosError` já aceitam `unknown`, podemos tipar de forma segura:
> ```ts
> interface LockoutErrorPayload {
>   message?: string;
>   remaining_seconds?: number;
>   bloqueado_ate?: string;
> }
> ```
> E usar `catch (err: unknown)` com `const data = err.response?.data as LockoutErrorPayload | undefined;`.

---

### 5.5. Fallback fixo de `15 * 60` para qualquer erro HTTP `429`
- **Linhas para comentar (lado direito `+`):** `97` a `114`
- **Severidade:** Média (Tratamento de Erros)
- **Problema:** Se um proxy reverso, CDN ou rate-limiter global responder `429` sem `remaining_seconds` nem `bloqueado_ate`, o código assume `let secondsLeft = 15 * 60;` (linha `99`), ignora `msg` e trava o formulário por 15 minutos no `localStorage`. Além disso, na linha `90`, `login(email, senha)` envia o `email` sem `.trim()`, apesar de validar `email.trim()` na linha `83`.

**Comentário para a PR:**
> **Tratamento de `429` e envio do e-mail:**
> 1. Caso ocorra um `429` vindo de infraestrutura/proxy (sem `remaining_seconds` nem `bloqueado_ate`), o código cai no fallback fixo `15 * 60` (linha 99), bloqueia o `localStorage` por 15 minutos e descarta a mensagem original (`msg`). Vale considerar primeiro o header `err.response.headers?.['retry-after']` ou só ativar o bloqueio de 15 minutos quando os campos de lockout vierem no payload.
> 2. Na linha 90, vale passar `await login(email.trim(), senha)` para alinhar com a validação `email.trim()` feita na linha 83 (e na linha 83 usar `!senha` em vez de `!senha.trim()`, pois senhas podem conter espaços significativos).

---

### 5.6. Acessibilidade (WCAG) e formatação visual do contador regressivo de 1 segundo
- **Linhas para comentar (lado direito `+`):** `13` a `18` e `153` a `157`
- **Severidade:** Baixa-Média (Acessibilidade / UI)
- **Problema:**
  1. Na caixa de erro (`linhas 153–157`), falta semântica de alerta (`role="alert"`), porém colocar `role="alert"` diretamente sobre um texto que re-renderiza **a cada 1 segundo** faria leitores de tela lerem a frase inteira repetidamente a cada segundo.
  2. Em `formatBlockMessage` (`linhas 13–18`), quando falta menos de 1 minuto aparece `"0 minuto(s) e 45 segundo(s)"`, e sem `tabular-nums` / zero à esquerda o texto sofre pequenos deslocamentos visuais quando os segundos mudam de 2 para 1 dígito.

**Comentário para a PR:**
> **Acessibilidade (a11y) e UI no cronômetro:**
> 1. A caixa de erro (`linhas 153–157`) não possui `role="alert"` para erros comuns, mas atenção: se `role="alert"` envolver diretamente o texto do cronômetro que atualiza a cada 1s, leitores de tela vão interromper o usuário repetindo a frase inteira 900 vezes. O ideal é usar `role="alert"` apenas na mensagem estática e envolver o tempo dinâmico em um `<span aria-live="off" className="tabular-nums">`.
> 2. Em `formatBlockMessage` (`linhas 13–18`), vale ocultar `0 minuto(s)` quando `minutes === 0` (ou formatar como `MM:SS` com `padStart(2, '0')` + classe `tabular-nums`) para evitar saltos de layout a cada segundo.

---

## Comentário Geral Sugerido (Resumo para o "Review changes" da PR)

> Boa implementação do fluxo de bloqueio temporário com retorno do tempo restante (`remaining_seconds`)! Deixei comentários pontuais nos arquivos alterados. Os principais pontos para ajustar antes do merge são:
> 1. **`LoginPage.tsx`:** Não desabilitar o campo de **E-mail** durante o bloqueio e vincular o bloqueio no `localStorage` ao e-mail tentado (hoje uma conta bloqueada impede corrigir um e-mail digitado errado ou logar com outra conta no mesmo navegador), além de proteger os acessos ao `localStorage` com `try/catch`.
> 2. **`userRepository.ts` / `authService.ts`:** Normalizar o e-mail (`trim().toLowerCase()`) no `login()`/`findByEmail` (igual ao `register()`), evitar que requisições paralelas renovem o `bloqueado_ate` já ativo e alinhar o fuso horário de `bloqueado_ate` (`TIMESTAMP` vs `TIMESTAMPTZ`) com `remaining_seconds`.
> 3. **`errorHandler.ts`:** Posicionar `...(err.details || {})` antes de `status` e `message` para evitar sobrescrita acidental do contrato padrão de erro.