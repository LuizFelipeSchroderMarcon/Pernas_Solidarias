import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { HeartHandshake, Mail, Lock, LogIn } from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

const LOGIN_BLOCKED_MAP_KEY = '@PernasSolidarias:loginBlockedMap';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

interface RateLimitErrorData {
  remaining_seconds?: number;
  bloqueado_ate?: string;
  message?: string;
}

function readBlockedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOGIN_BLOCKED_MAP_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const now = Date.now();
    const cleaned: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && !Number.isNaN(value) && value > now) {
        cleaned[key] = value;
      }
    }
    if (Object.keys(cleaned).length !== Object.keys(parsed as object).length) {
      localStorage.setItem(LOGIN_BLOCKED_MAP_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return {};
  }
}

function writeBlockedMap(map: Record<string, number>): void {
  try {
    if (Object.keys(map).length === 0) {
      localStorage.removeItem(LOGIN_BLOCKED_MAP_KEY);
    } else {
      localStorage.setItem(LOGIN_BLOCKED_MAP_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignorar falhas de armazenamento (ex.: navegação privada / quota)
  }
}

function getBlockedUntilForEmail(email: string): number | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const map = readBlockedMap();
  const timestamp = map[normalized];
  return typeof timestamp === 'number' && timestamp > Date.now() ? timestamp : null;
}

function setBlockedUntilForEmail(email: string, unlockTime: number): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const map = readBlockedMap();
  map[normalized] = unlockTime;
  writeBlockedMap(map);
}

function clearBlockedForEmail(email: string): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const map = readBlockedMap();
  if (normalized in map) {
    delete map[normalized];
    writeBlockedMap(map);
  }
}

function extractRetrySeconds(err: unknown): number | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 429) {
    return null;
  }

  const data = err.response.data as RateLimitErrorData | undefined;
  if (typeof data?.remaining_seconds === 'number' && data.remaining_seconds > 0) {
    return Math.ceil(data.remaining_seconds);
  }

  if (data?.bloqueado_ate) {
    const parsed = new Date(data.bloqueado_ate).getTime();
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      return Math.ceil((parsed - Date.now()) / 1000);
    }
  }

  const retryAfterHeader = err.response.headers?.['retry-after'];
  if (retryAfterHeader) {
    const numericRetry = Number(retryAfterHeader);
    if (!Number.isNaN(numericRetry) && numericRetry > 0) {
      return Math.ceil(numericRetry);
    }
    const dateRetry = new Date(String(retryAfterHeader)).getTime();
    if (!Number.isNaN(dateRetry) && dateRetry > Date.now()) {
      return Math.ceil((dateRetry - Date.now()) / 1000);
    }
  }

  return null;
}

function formatCountdown(remainingSeconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minuto(s) e ${String(seconds).padStart(2, '0')} segundo(s)`;
}

function formatBlockMessage(remainingSeconds: number): string {
  return `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${formatCountdown(remainingSeconds)}.`;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  const isBlocked = blockedUntil !== null && remainingSeconds > 0;
  const rawFrom = (location.state as LocationState | null)?.from?.pathname;
  const destination =
    rawFrom &&
    typeof rawFrom === 'string' &&
    rawFrom.startsWith('/') &&
    !rawFrom.startsWith('//') &&
    rawFrom !== '/login'
      ? rawFrom
      : '/';

  useEffect(() => {
    const activeBlock = getBlockedUntilForEmail(email);
    setBlockedUntil(activeBlock);
    if (activeBlock) {
      setRemainingSeconds(Math.max(0, Math.ceil((activeBlock - Date.now()) / 1000)));
    } else {
      setRemainingSeconds(0);
    }
  }, [email]);

  useEffect(() => {
    if (!blockedUntil) {
      setRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const diffSeconds = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (diffSeconds <= 0) {
        setBlockedUntil(null);
        setRemainingSeconds(0);
        setErrorMessage('');
        clearBlockedForEmail(email);
      } else {
        setRemainingSeconds(diffSeconds);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [blockedUntil, email]);

  if (!authLoading && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    const trimmedEmail = email.trim();
    setErrorMessage('');

    if (!trimmedEmail || !senha.trim()) {
      setErrorMessage('Por favor, informe seu email e senha.');
      return;
    }

    try {
      setIsLoading(true);
      await login(trimmedEmail, senha);
      clearBlockedForEmail(trimmedEmail);
      success('Bem-vindo!', 'Login realizado com sucesso.');
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const msg = mensagemDeErro(err, 'Erro ao realizar login. Verifique suas credenciais.');
      const retrySeconds = extractRetrySeconds(err);

      if (retrySeconds !== null) {
        const unlockTime = Date.now() + retrySeconds * 1000;
        setBlockedUntil(unlockTime);
        setRemainingSeconds(retrySeconds);
        setBlockedUntilForEmail(trimmedEmail, unlockTime);
        error('Acesso bloqueado', formatBlockMessage(retrySeconds));
      } else {
        setErrorMessage(msg);
        error('Falha na autenticação', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <HeartHandshake className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pernas Solidárias
          </h1>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Painel do Coordenador de Corridas
          </p>
        </div>

        {/* Login form card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Entrar no Sistema
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Acesse para gerenciar eventos, participantes e duplas
          </p>

          {isBlocked ? (
            <div
              role="status"
              aria-live="off"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
            >
              <span>Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em </span>
              <span className="font-bold tabular-nums">
                {formatCountdown(remainingSeconds)}
              </span>
              <span>.</span>
            </div>
          ) : errorMessage ? (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
            >
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="coordenador@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={isLoading || isBlocked}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-lg shadow-blue-600/25"
              isLoading={isLoading}
              disabled={isLoading || isBlocked}
              rightIcon={<LogIn className="w-4 h-4" />}
            >
              Acessar Painel
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400 font-medium">
            Pernas Solidárias • Inclusão e Solidariedade
          </p>
        </div>
      </div>
    </div>
  );
};
