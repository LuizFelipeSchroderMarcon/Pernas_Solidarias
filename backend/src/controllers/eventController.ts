import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';

const eventService = new EventService();

export class EventController {
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query;
      const data = await eventService.listAll(
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
      const data = await eventService.getById(id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await eventService.create(req.body);
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
      const data = await eventService.update(id, req.body);
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
      await eventService.delete(id);
      res.status(200).json({
        message: 'Evento removido com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Alias for backward compatibility
export { EventController as EventoController };
