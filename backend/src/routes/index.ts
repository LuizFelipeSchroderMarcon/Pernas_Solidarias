import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { cadeiranteRoutes } from './cadeiranteRoutes';
import { condutorRoutes } from './condutorRoutes';
import { eventoRoutes } from './eventoRoutes';

const routes = Router();

routes.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/cadeirantes', cadeiranteRoutes);
routes.use('/condutores', condutorRoutes);
routes.use('/eventos', eventoRoutes);

export { routes };
