import { Router } from 'express';
import { PairController } from '../controllers/pairController';
import { authMiddleware } from '../middlewares/authMiddleware';

const pairRoutes = Router();
const pairController = new PairController();

pairRoutes.use(authMiddleware);

// History
pairRoutes.get('/history', pairController.history);

// Event pairs management
pairRoutes.get('/event/:eventId', pairController.listByEvent);
pairRoutes.post('/event/:eventId/generate', pairController.generatePairs);
pairRoutes.delete('/event/:eventId', pairController.clearPairs);

// Manual edit
pairRoutes.put('/:pairId', pairController.editPair);

export { pairRoutes, pairRoutes as duplaRoutes };
