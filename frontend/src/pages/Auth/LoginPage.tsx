import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { HeartHandshake, Mail, Lock, LogIn, Sun, Moon } from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !senha.trim()) {
      setErrorMessage('Por favor, informe seu email e senha.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, senha);
      success('Bem-vindo!', 'Login realizado com sucesso.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = mensagemDeErro(err, 'Erro ao realizar login. Verifique suas credenciais.');
      setErrorMessage(msg);
      error('Falha na autenticação', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme toggle button */}
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="fixed top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all duration-200 cursor-pointer"
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Modo Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold">Modo Escuro</span>
          </>
        )}
      </button>

      {/* Decorative background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <HeartHandshake className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pernas Solidárias
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
            Painel do Coordenador de Corridas
          </p>
        </div>

        {/* Login form card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Entrar no Sistema
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Acesse para gerenciar eventos, participantes e duplas
          </p>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
              {errorMessage}
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
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-lg shadow-blue-600/25"
              isLoading={isLoading}
              rightIcon={<LogIn className="w-4 h-4" />}
            >
              Acessar Painel
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Pernas Solidárias • Inclusão e Solidariedade
          </p>
        </div>
      </div>
    </div>
  );
};
