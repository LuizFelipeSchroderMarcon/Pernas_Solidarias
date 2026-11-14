import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from '../../src/services/authService';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  describe('login', () => {
    it('deve exigir email e senha', async () => {
      await expect(service.login('', '123')).rejects.toThrow('E-mail e senha são obrigatórios.');
      await expect(service.login('admin@test.com', '')).rejects.toThrow('E-mail e senha são obrigatórios.');
    });

    it('deve rejeitar com 401 se usuário não existir', async () => {
      vi.spyOn((service as any).userRepository, 'findByEmail').mockResolvedValue(null);

      await expect(service.login('naoexiste@ong.org', 'senha123')).rejects.toThrow(
        expect.objectContaining({
          message: 'Credenciais inválidas.',
          statusCode: 401,
        })
      );
    });

    it('deve bloquear com 429 se usuário já estiver bloqueado (FA01 / RNF04)', async () => {
      vi.spyOn((service as any).userRepository, 'findByEmail').mockResolvedValue({
        cd_user: 1,
        email: 'admin@ong.org',
        senha: 'hash',
        remaining_seconds: 300,
        bloqueado_ate: new Date(Date.now() + 300000),
      });

      await expect(service.login('admin@ong.org', 'qualquer')).rejects.toThrow(
        expect.objectContaining({
          statusCode: 429,
        })
      );
    });

    it('deve incrementar falhas ao errar senha e bloquear na 5ª tentativa (FA01)', async () => {
      vi.spyOn((service as any).userRepository, 'findByEmail').mockResolvedValue({
        cd_user: 1,
        email: 'admin@ong.org',
        senha: await bcrypt.hash('correta', 10),
        remaining_seconds: 0,
      });

      // 4ª tentativa falha -> retorna 401
      vi.spyOn((service as any).userRepository, 'incrementFailedAttempts').mockResolvedValue({
        cd_user: 1,
        tentativas_falhas: 4,
        remaining_seconds: 0,
      });

      await expect(service.login('admin@ong.org', 'errada')).rejects.toThrow(
        expect.objectContaining({ statusCode: 401 })
      );

      // 5ª tentativa falha -> bloqueia com 429
      vi.spyOn((service as any).userRepository, 'incrementFailedAttempts').mockResolvedValue({
        cd_user: 1,
        tentativas_falhas: 5,
        remaining_seconds: 900,
      });

      await expect(service.login('admin@ong.org', 'errada')).rejects.toThrow(
        expect.objectContaining({ statusCode: 429 })
      );
    });

    it('deve logar com sucesso, resetar falhas e retornar token JWT', async () => {
      const senhaHash = await bcrypt.hash('segredo123', 10);
      vi.spyOn((service as any).userRepository, 'findByEmail').mockResolvedValue({
        cd_user: 1,
        email: 'admin@ong.org',
        senha: senhaHash,
        remaining_seconds: 0,
        created_at: new Date(),
      });

      const resetSpy = vi.spyOn((service as any).userRepository, 'resetFailedAttempts').mockResolvedValue(undefined);

      const result = await service.login('admin@ong.org', 'segredo123');

      expect(resetSpy).toHaveBeenCalledWith(1);
      expect(result.user.email).toBe('admin@ong.org');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(20);
    });
  });
});

