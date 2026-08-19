import { Router } from 'express';
import { EventoController } from '../controllers/eventoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const eventoRoutes = Router();
const eventoController = new EventoController();

eventoRoutes.use(authMiddleware);

eventoRoutes.get('/', eventoController.index);
eventoRoutes.get('/:id', eventoController.show);
eventoRoutes.post('/', eventoController.create);
eventoRoutes.put('/:id', eventoController.update);
eventoRoutes.delete('/:id', eventoController.delete);

export { eventoRoutes };
