import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { authMiddleware } from '../middlewares/authMiddleware';

const exportRoutes = Router();
const exportController = new ExportController();

exportRoutes.use(authMiddleware);

exportRoutes.get('/event/:eventId', exportController.exportEvent);

export { exportRoutes, exportRoutes as exportacaoRoutes };
