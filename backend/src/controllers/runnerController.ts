import { Request, Response, NextFunction } from 'express';
import { RunnerService } from '../services/runnerService';

const runnerService = new RunnerService();

export class RunnerController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ativo, search, active } = req.query;
      let activeBool: boolean | undefined = undefined;
      const activeParam = active !== undefined ? active : ativo;
      if (activeParam !== undefined) {
        activeBool = activeParam === 'true';
      }
      const data = await runnerService.listAll(activeBool, (search as string) || undefined);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await runnerService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await runnerService.create(req.body);
      res.status(201).json({
        message: 'Condutor cadastrado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await runnerService.update(id, req.body);
      res.status(200).json({
        message: 'Condutor atualizado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await runnerService.toggleStatus(id);
      res.status(200).json({
        message: 'Status do condutor alterado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await runnerService.delete(id);
      res.status(200).json({
        message: 'Condutor removido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Alias for backward compatibility
export { RunnerController as CondutorController };
