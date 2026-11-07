import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Mail, Lock, LogIn } from 'lucide-react';
import { mensagemDeErro } from '../../services/apiError';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error } = useToast();

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
    <div className="min-h-screen bg-[#EBEAEA] flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative z-10">
        {/* Login form card matching Figma "Login" frame */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#C5C3C3]">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="/logo_pernas_solidarias.png"
                alt="Logo Pernas Solidárias"
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Pernas Solidárias
            </h1>
            <p className="text-sm text-black mt-1 font-medium">
              Sistema de Gerenciamento
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#F51414]/15 border border-[#F51414] text-black text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Login"
              type="email"
              placeholder="Digite seu login"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              leftIcon={<Mail className="w-4 h-4" />}
              className="bg-[#FFFDFD] border-[#C5C3C3] placeholder-[#9E9D9D]"
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
              className="bg-[#FFFDFD] border-[#C5C3C3] placeholder-[#9E9D9D]"
            />

            <div className="pt-2 flex justify-center">
              <Button
                type="submit"
                variant="success"
                size="lg"
                className="w-full sm:w-72 font-bold text-white bg-[#15803D] hover:bg-[#166534] border-[#166534]"
                isLoading={isLoading}
                rightIcon={<LogIn className="w-4 h-4" />}
              >
                Entrar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
