import { Router } from 'express';
import { WheelchairUserController } from '../controllers/wheelchairUserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const wheelchairUserRoutes = Router();
const wheelchairUserController = new WheelchairUserController();

wheelchairUserRoutes.use(authMiddleware);

wheelchairUserRoutes.get('/', wheelchairUserController.index);
wheelchairUserRoutes.get('/:id', wheelchairUserController.show);
wheelchairUserRoutes.post('/', wheelchairUserController.create);
wheelchairUserRoutes.put('/:id', wheelchairUserController.update);
wheelchairUserRoutes.patch('/:id/toggle-status', wheelchairUserController.toggleStatus);
wheelchairUserRoutes.delete('/:id', wheelchairUserController.delete);

export { wheelchairUserRoutes, wheelchairUserRoutes as cadeiranteRoutes };
