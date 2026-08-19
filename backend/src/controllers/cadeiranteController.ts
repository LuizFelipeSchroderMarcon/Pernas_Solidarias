import { Request, Response, NextFunction } from 'express';
import { CadeiranteService } from '../services/cadeiranteService';

const cadeiranteService = new CadeiranteService();

export class CadeiranteController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ativo, search } = req.query;
      let ativoBool: boolean | undefined = undefined;
      if (ativo !== undefined) {
        ativoBool = ativo === 'true';
      }
      const data = await cadeiranteService.listAll(ativoBool, search as string | undefined);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await cadeiranteService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cadeiranteService.create(req.body);
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
      const data = await cadeiranteService.update(id, req.body);
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
      const data = await cadeiranteService.toggleStatus(id);
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
      await cadeiranteService.delete(id);
      res.status(200).json({
        message: 'Cadeirante removido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}
