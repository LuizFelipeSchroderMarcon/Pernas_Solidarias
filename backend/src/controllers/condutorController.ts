import { Request, Response, NextFunction } from 'express';
import { CondutorService } from '../services/condutorService';

const condutorService = new CondutorService();

export class CondutorController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ativo, search } = req.query;
      let ativoBool: boolean | undefined = undefined;
      if (ativo !== undefined) {
        ativoBool = ativo === 'true';
      }
      const data = await condutorService.listAll(ativoBool, search as string | undefined);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await condutorService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await condutorService.create(req.body);
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
      const data = await condutorService.update(id, req.body);
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
      const data = await condutorService.toggleStatus(id);
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
      await condutorService.delete(id);
      res.status(200).json({
        message: 'Condutor removido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}
