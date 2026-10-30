import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authMiddleware } from '../middlewares/authMiddleware';

const eventRoutes = Router();
const eventController = new EventController();

eventRoutes.use(authMiddleware);

eventRoutes.get('/', eventController.index);
eventRoutes.get('/:id', eventController.show);
eventRoutes.post('/', eventController.create);
eventRoutes.put('/:id', eventController.update);
eventRoutes.delete('/:id', eventController.delete);

export { eventRoutes, eventRoutes as eventoRoutes };
