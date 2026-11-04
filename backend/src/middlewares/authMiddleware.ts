import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { SERVER_BOOT_ID } from '../config/serverInstance';

export interface TokenPayload {
  userId: number;
  email: string;
  bootId?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Formato de token inválido.', 401);
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026';

  try {
    if (!token) {
      throw new AppError('Token inválido.', 401);
    }
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Se o token não tiver bootId ou pertencer a uma instância anterior do servidor (ex: após reiniciar containers)
    if (!decoded.bootId || decoded.bootId !== SERVER_BOOT_ID) {
      throw new AppError('Sessão expirada ou servidor reiniciado. Por favor, faça login novamente.', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Token inválido ou expirado.', 401);
  }
}
