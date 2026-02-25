import { Express } from 'express';
import { Router } from 'express';
import { healthRouter } from './health.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);

export function mountRoutes(app: Express): void {
  app.use('/api', apiRouter);
}
