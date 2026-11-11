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

// Core resource routes (standardized in English)
routes.use('/wheelchair-users', wheelchairUserRoutes);
routes.use('/runners', runnerRoutes);
routes.use('/events', eventRoutes);
routes.use('/pairs', pairRoutes);
routes.use('/export', exportRoutes);
routes.use('/analytics', analyticsRoutes);

export { routes };
