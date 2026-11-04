import { Router } from 'express';
import { RunnerController } from '../controllers/runnerController';
import { authMiddleware } from '../middlewares/authMiddleware';

const runnerRoutes = Router();
const runnerController = new RunnerController();

runnerRoutes.use(authMiddleware);

runnerRoutes.get('/', runnerController.index);
runnerRoutes.get('/:id', runnerController.show);
runnerRoutes.post('/', runnerController.create);
runnerRoutes.put('/:id', runnerController.update);
runnerRoutes.patch('/:id/toggle-status', runnerController.toggleStatus);
runnerRoutes.delete('/:id', runnerController.delete);

export { runnerRoutes, runnerRoutes as condutorRoutes };
