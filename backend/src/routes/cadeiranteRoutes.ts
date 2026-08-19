import { Router } from 'express';
import { CadeiranteController } from '../controllers/cadeiranteController';
import { authMiddleware } from '../middlewares/authMiddleware';

const cadeiranteRoutes = Router();
const cadeiranteController = new CadeiranteController();

cadeiranteRoutes.use(authMiddleware);

cadeiranteRoutes.get('/', cadeiranteController.index);
cadeiranteRoutes.get('/:id', cadeiranteController.show);
cadeiranteRoutes.post('/', cadeiranteController.create);
cadeiranteRoutes.put('/:id', cadeiranteController.update);
cadeiranteRoutes.patch('/:id/toggle-status', cadeiranteController.toggleStatus);
cadeiranteRoutes.delete('/:id', cadeiranteController.delete);

export { cadeiranteRoutes };
