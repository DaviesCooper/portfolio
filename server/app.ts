import express, { Express } from 'express';
import cors from 'cors';
import { mountRoutes } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  mountRoutes(app);

  return app;
}
