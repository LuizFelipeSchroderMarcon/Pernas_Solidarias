import { Router } from 'express';
import { CondutorController } from '../controllers/condutorController';
import { authMiddleware } from '../middlewares/authMiddleware';

const condutorRoutes = Router();
const condutorController = new CondutorController();

condutorRoutes.use(authMiddleware);

condutorRoutes.get('/', condutorController.index);
condutorRoutes.get('/:id', condutorController.show);
condutorRoutes.post('/', condutorController.create);
condutorRoutes.put('/:id', condutorController.update);
condutorRoutes.patch('/:id/toggle-status', condutorController.toggleStatus);
condutorRoutes.delete('/:id', condutorController.delete);

export { condutorRoutes };
