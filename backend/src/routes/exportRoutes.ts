import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { authMiddleware } from '../middlewares/authMiddleware';

const exportRoutes = Router();
const exportController = new ExportController();

exportRoutes.use(authMiddleware);

// Export pairs by event (/export/event/:eventId or /exportar/evento/:cd_evento)
exportRoutes.get('/event/:eventId', exportController.exportEvent);
exportRoutes.get('/evento/:cd_evento', exportController.exportEvent);

// Export consolidated history (/export/history or /exportar/historico) (RF10)
exportRoutes.get('/history', exportController.exportHistory);
exportRoutes.get('/historico', exportController.exportHistory);

export { exportRoutes, exportRoutes as exportacaoRoutes };
