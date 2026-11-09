import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, senha, password } = req.body;
      const pass = password || senha;
      const data = await authService.register(email, pass);
      res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, senha, password } = req.body;
      const pass = password || senha;
      const data = await authService.login(email, pass);
      res.status(200).json({
        message: 'Login realizado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ message: 'Não autorizado.' });
        return;
      }
      const data = await authService.getMe(req.user.userId);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }
}
