import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authMiddleware);

router.get('/rankings', analyticsController.getRankings.bind(analyticsController));

export default router;
