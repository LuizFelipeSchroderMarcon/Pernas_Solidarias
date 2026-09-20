import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { wheelchairUserRoutes } from './wheelchairUserRoutes';
import { runnerRoutes } from './runnerRoutes';
import { eventRoutes } from './eventRoutes';
import { pairRoutes } from './pairRoutes';
import { exportRoutes } from './exportRoutes';
import analyticsRoutes from './analyticsRoutes';

const routes = Router();

routes.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
routes.use('/auth', authRoutes);

// Core resource routes (both English & PT-BR path aliases supported)
routes.use('/wheelchair-users', wheelchairUserRoutes);
routes.use('/cadeirantes', wheelchairUserRoutes);

routes.use('/runners', runnerRoutes);
routes.use('/condutores', runnerRoutes);

routes.use('/events', eventRoutes);
routes.use('/eventos', eventRoutes);

routes.use('/pairs', pairRoutes);
routes.use('/duplas', pairRoutes);

routes.use('/export', exportRoutes);
routes.use('/exportar', exportRoutes);

// Analytics / Gráficos routes
routes.use('/analytics', analyticsRoutes);
routes.use('/graficos', analyticsRoutes);

export { routes };
