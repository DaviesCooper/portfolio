import { Express } from 'express';
import { Router } from 'express';
import { healthRouter } from './health.js';
import { lasersRouter, hasLaserBuild } from './lasers.js';
import { contentRouter } from './content.js';
import { spaRouter, hasSpaBuild } from './spa.js';
import { devRouter } from './dev.js';

const apiRouter = Router();
apiRouter.use('/health', healthRouter);

export function mountRoutes(app: Express): void {
  app.use('/api', apiRouter);

  if (hasLaserBuild) {
    app.use('/lasers', lasersRouter);
  }

  app.use(contentRouter);
  app.use(spaRouter);

  if (!hasSpaBuild && !hasLaserBuild) {
    app.use(devRouter);
  }
}
