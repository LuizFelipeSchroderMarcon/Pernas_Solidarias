import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { SERVER_BOOT_ID } from '../config/serverInstance';

export interface TokenPayload {
  userId: number;
  email: string;
  bootId?: string;
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
  if (!token) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pernas_solidarias_2026';

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  const payload = decoded as TokenPayload;

  if (!payload.bootId || payload.bootId !== SERVER_BOOT_ID) {
    throw new AppError('Sessão expirada ou inválida. Por favor, faça login novamente.', 401);
  }

  req.user = payload;
  next();
}
