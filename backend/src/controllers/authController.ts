import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, senha } = req.body;
      const user = await authService.register(email, senha);
      res.status(201).json({
        message: 'Usuário registrado com sucesso!',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, senha } = req.body;
      const result = await authService.login(email, senha);
      res.status(200).json({
        message: 'Login realizado com sucesso!',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Não autorizado' });
        return;
      }
      const user = await authService.getMe(userId);
      res.status(200).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
