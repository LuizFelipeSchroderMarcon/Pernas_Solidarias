import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { authMiddleware } from '../middlewares/authMiddleware';

const exportRoutes = Router();
const exportController = new ExportController();

exportRoutes.use(authMiddleware);

// Export pairs by event (/export/event/:eventId or /exportar/evento/:cd_evento)
exportRoutes.get('/event/:eventId', exportController.exportEvent);
exportRoutes.get('/evento/:cd_evento', exportController.exportEvent);

export { exportRoutes, exportRoutes as exportacaoRoutes };
