import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode === 429) {
      const remainingSeconds =
        typeof err.details?.remaining_seconds === 'number' && err.details.remaining_seconds > 0
          ? Math.ceil(err.details.remaining_seconds)
          : undefined;
      if (remainingSeconds) {
        res.setHeader('Retry-After', String(remainingSeconds));
      }
    }

    res.status(err.statusCode).json({
      ...(err.details || {}),
      status: 'error',
      message: err.message,
    });
    return;
  }

  if ((err as any).code === 'P0001' || (err as any).code === '23505') {
    res.status(409).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  console.error('Erro não tratado na aplicação:', err);

  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor.',
  });
}
