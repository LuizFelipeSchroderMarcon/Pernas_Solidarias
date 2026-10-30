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

// Create single pair for an event
pairRoutes.post('/event/:eventId', pairController.createPair);

// Save pairs for an event
pairRoutes.post('/event/:eventId/save', pairController.savePairs);

// Manual edit and delete
pairRoutes.put('/:pairId', pairController.editPair);
pairRoutes.delete('/:pairId', pairController.deletePair);

export { pairRoutes, pairRoutes as duplaRoutes };
