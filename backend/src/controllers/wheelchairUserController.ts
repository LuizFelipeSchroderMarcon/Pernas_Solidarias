import { Request, Response, NextFunction } from 'express';
import { WheelchairUserService } from '../services/wheelchairUserService';

const wheelchairUserService = new WheelchairUserService();

export class WheelchairUserController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ativo, search, active } = req.query;
      let activeBool: boolean | undefined = undefined;
      const activeParam = active !== undefined ? active : ativo;
      if (activeParam !== undefined) {
        activeBool = activeParam === 'true';
      }
      const data = await wheelchairUserService.listAll(activeBool, (search as string) || undefined);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await wheelchairUserService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await wheelchairUserService.create(req.body);
      res.status(201).json({
        message: 'Cadeirante cadastrado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await wheelchairUserService.update(id, req.body);
      res.status(200).json({
        message: 'Cadeirante atualizado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await wheelchairUserService.toggleStatus(id);
      res.status(200).json({
        message: 'Status do cadeirante alterado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await wheelchairUserService.delete(id);
      res.status(200).json({
        message: 'Cadeirante removido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Alias for backward compatibility
export { WheelchairUserController as CadeiranteController };
