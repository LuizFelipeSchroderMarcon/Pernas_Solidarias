import { Request, Response, NextFunction } from 'express';
import { EventoService } from '../services/eventoService';

const eventoService = new EventoService();

export class EventoController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query;
      const data = await eventoService.listAll(
        status as 'futuros' | 'passados' | 'todos' | undefined,
        search as string | undefined
      );
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await eventoService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await eventoService.create(req.body);
      res.status(201).json({
        message: 'Evento cadastrado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const data = await eventoService.update(id, req.body);
      res.status(200).json({
        message: 'Evento atualizado com sucesso!',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await eventoService.delete(id);
      res.status(200).json({
        message: 'Evento excluído com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}
