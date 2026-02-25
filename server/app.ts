import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { mountRoutes } from './routes/index.js';
import { config } from './config.js';

const hasClientBuild = fs.existsSync(path.join(config.clientDist, 'index.html'));

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  mountRoutes(app);

  if (hasClientBuild) {
    app.use(express.static(config.clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(config.clientDist, 'index.html'), (err) => {
        if (err) res.status(404).send('Not found');
      });
    });
  } else if (process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.type('text/html').send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
          <p>API is running at <a href="/api/health">/api/health</a>.</p>
          <p>Run the frontend: <code>npm run client:dev</code> (or use the <code>client</code> service), then open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
        </body></html>
      `);
    });
  } else {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.status(404).send('Not found');
    });
  }

  return app;
}
