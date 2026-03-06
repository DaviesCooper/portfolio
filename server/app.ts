import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { mountRoutes } from './routes/index.js';
import { config } from './config.js';

const hasVfsBuild = fs.existsSync(path.join(config.vfsDist, 'index.html'));
const hasLaserBuild = fs.existsSync(path.join(config.laserDist, 'index.html'));

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  mountRoutes(app);

  // Lasers app at /lasers (must be before the root catch-all)
  if (hasLaserBuild) {
    app.use('/lasers', express.static(config.laserDist));
    app.get('/lasers/*', (req, res, next) => {
      res.sendFile(path.join(config.laserDist, 'index.html'), (err) => {
        if (err) res.status(404).send('Not found');
      });
    });
  }

  if (hasVfsBuild) {
    app.use(express.static(config.vfsDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(config.vfsDist, 'index.html'), (err) => {
        if (err) res.status(404).send('Not found');
      });
    });
  }
  
  if (!hasVfsBuild && !hasLaserBuild && process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.type('text/html').send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
          <p>API is running at <a href="/api/health">/api/health</a>.</p>
          <p>Run the frontend: <code>npm run vfs:dev</code> (or use the <code>vfs</code> service), then open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
        </body></html>
      `);
    });
  }
  
  if (!hasVfsBuild && !hasLaserBuild && process.env.NODE_ENV === 'production') {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.status(404).send('Not found');
    });
  }

  return app;
}
