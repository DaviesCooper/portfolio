import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { config } from '../config.js';

const vfsDist = config.vfsDist;
const hasVfsBuild = fs.existsSync(path.join(vfsDist, 'index.html'));

function isStaticAsset(p: string): boolean {
  return p.startsWith('/assets/') || /\.(js|mjs|cjs|css|wasm)(\?|$)/i.test(p);
}

export const spaRouter = Router();

if (hasVfsBuild) {
  const vfsStatic = express.static(vfsDist);

  spaRouter.get('*', (req: Request, res: Response, next: () => void) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/lasers')) return next();

    vfsStatic(req, res, () => {
      if (isStaticAsset(req.path)) {
        res.status(404).send('Not found');
        return;
      }
      res.set('Cache-Control', 'no-store');
      res.sendFile(path.join(vfsDist, 'index.html'), (err) => {
        if (err) res.status(404).send('Not found');
      });
    });
  });
}

export const hasSpaBuild = hasVfsBuild;
