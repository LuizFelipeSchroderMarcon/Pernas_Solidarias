import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { HeartHandshake, Mail, Lock, LogIn } from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

const LOGIN_BLOCK_UNTIL_KEY = '@PernasSolidarias:loginBlockedUntil';

function formatBlockMessage(remainingSeconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${minutes} minuto(s) e ${seconds} segundo(s).`;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem(LOGIN_BLOCK_UNTIL_KEY);
    if (!saved) return null;
    const timestamp = Number(saved);
    if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
      localStorage.removeItem(LOGIN_BLOCK_UNTIL_KEY);
      return null;
    }
    return timestamp;
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(LOGIN_BLOCK_UNTIL_KEY);
    if (!saved) return 0;
    const timestamp = Number(saved);
    if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
      return 0;
    }
    return Math.ceil((timestamp - Date.now()) / 1000);
  });
  const [errorMessage, setErrorMessage] = useState('');

  const isBlocked = blockedUntil !== null && remainingSeconds > 0;
  const from = (location.state as any)?.from?.pathname || '/';

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
        localStorage.removeItem(LOGIN_BLOCK_UNTIL_KEY);
      } else {
        setRemainingSeconds(diffSeconds);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    setErrorMessage('');

    if (!email.trim() || !senha.trim()) {
      setErrorMessage('Por favor, informe seu email e senha.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, senha);
      localStorage.removeItem(LOGIN_BLOCK_UNTIL_KEY);
      success('Bem-vindo!', 'Login realizado com sucesso.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Erro ao realizar login. Verifique suas credenciais.');

      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const data = err.response.data as any;
        let secondsLeft = 15 * 60;

        if (typeof data?.remaining_seconds === 'number' && data.remaining_seconds > 0) {
          secondsLeft = Math.ceil(data.remaining_seconds);
        } else if (data?.bloqueado_ate) {
          const parsed = new Date(data.bloqueado_ate).getTime();
          if (!Number.isNaN(parsed) && parsed > Date.now()) {
            secondsLeft = Math.ceil((parsed - Date.now()) / 1000);
          }
        }

        const unlockTime = Date.now() + secondsLeft * 1000;
        setBlockedUntil(unlockTime);
        setRemainingSeconds(secondsLeft);
        localStorage.setItem(LOGIN_BLOCK_UNTIL_KEY, String(unlockTime));
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayedError = isBlocked ? formatBlockMessage(remainingSeconds) : errorMessage;

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

          {displayedError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
              {displayedError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="coordenador@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading || isBlocked}
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
              disabled={isBlocked}
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
