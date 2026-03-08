import { Router, Request, Response } from 'express';

/**
 * Dev fallback when no frontend builds exist: show help or 404.
 * Only mounted when hasSpaBuild and hasLaserBuild are both false (see index.ts).
 */
export const devRouter = Router();

devRouter.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) return;

  if (process.env.NODE_ENV !== 'production') {
    res.type('text/html').send(`
      <!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">
        <p>API is running at <a href="/api/health">/api/health</a>.</p>
        <p>Run the frontend: <code>npm run vfs:dev</code> (or use the <code>vfs</code> service), then open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
      </body></html>
    `);
    return;
  }

  res.status(404).send('Not found');
});
