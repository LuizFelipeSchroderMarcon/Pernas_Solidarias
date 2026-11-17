import { Router } from 'express';
import { PairController } from '../controllers/pairController';
import { authMiddleware } from '../middlewares/authMiddleware';

const pairRoutes = Router();
const pairController = new PairController();

pairRoutes.use(authMiddleware);

pairRoutes.get('/history', pairController.history);

pairRoutes.get('/event/:eventId', pairController.listByEvent);
pairRoutes.post('/event/:eventId/generate', pairController.generatePairs);
pairRoutes.delete('/event/:eventId', pairController.clearPairs);

pairRoutes.post('/event/:eventId', pairController.createPair);
pairRoutes.post('/evento/:cd_evento', pairController.createPair);

pairRoutes.post('/event/:eventId/save', pairController.savePairs);
pairRoutes.post('/evento/:cd_evento/salvar', pairController.savePairs);

pairRoutes.put('/:pairId', pairController.editPair);
pairRoutes.delete('/:pairId', pairController.deletePair);

export { pairRoutes, pairRoutes as duplaRoutes };
