import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../src/middlewares/authMiddleware';
import { errorHandler, AppError } from '../../src/middlewares/errorHandler';
import { SERVER_BOOT_ID } from '../../src/config/serverInstance';

describe('Middlewares Unit Tests', () => {
  describe('authMiddleware', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
      req = { headers: {} };
      res = {};
      next = vi.fn();
    });

    it('deve lançar AppError 401 se não houver header authorization', () => {
      expect(() => authMiddleware(req, res, next)).toThrow('Token de autenticação não fornecido.');
    });

    it('deve lançar AppError 401 se formato do token não for Bearer <token>', () => {
      req.headers.authorization = 'Basic 123456';
      expect(() => authMiddleware(req, res, next)).toThrow('Formato de token inválido.');
    });

    it('deve lançar AppError 401 se token for inválido', () => {
      req.headers.authorization = 'Bearer token_invalido';
      expect(() => authMiddleware(req, res, next)).toThrow('Token inválido ou expirado.');
    });

    it('deve lançar AppError 401 se bootId for incompatível', () => {
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026';
      const token = jwt.sign({ userId: 1, email: 'teste@teste.com', bootId: 'outro_boot_id' }, secret);
      req.headers.authorization = `Bearer ${token}`;

      expect(() => authMiddleware(req, res, next)).toThrow('Sessão expirada ou inválida.');
    });

    it('deve autenticar e anexar req.user se token e bootId forem válidos', () => {
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026';
      const token = jwt.sign({ userId: 1, email: 'teste@teste.com', bootId: SERVER_BOOT_ID }, secret);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
      req = {};
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
      };
      next = vi.fn();
    });

    it('deve tratar AppError customizado com status code', () => {
      const error = new AppError('Acesso negado', 403, { code: 'FORBIDDEN' });
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Acesso negado',
          code: 'FORBIDDEN',
        })
      );
    });

    it('deve adicionar header Retry-After em caso de erro 429', () => {
      const error = new AppError('Muitas tentativas', 429, { remaining_seconds: 30 });
      errorHandler(error, req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '30');
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('deve tratar erros de banco de dados com código 23505 (duplicação) com status 409', () => {
      const dbError: any = new Error('Unique constraint violated');
      dbError.code = '23505';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve tratar erros genéricos com status 500', () => {
      const genericError = new Error('Falha catastrófica');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(genericError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro interno do servidor.',
      });

      consoleSpy.mockRestore();
    });
  });
});
