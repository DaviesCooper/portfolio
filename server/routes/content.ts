import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { config } from '../config.js';

const vfsDist = config.vfsDist;
const hasVfsBuild = fs.existsSync(path.join(vfsDist, 'index.html'));

const CONTENT_PREFIXES = [
  '/about',
  '/resume',
  '/genetic-stippling',
  '/auto-steamworks',
  '/hvvoculus',
];

export const contentRouter = Router();

if (hasVfsBuild) {
  for (const prefix of CONTENT_PREFIXES) {
    contentRouter.use(prefix, express.static(vfsDist));
  }
  contentRouter.get('/logo.svg', (_req, res) => {
    res.sendFile(path.join(vfsDist, 'logo.svg'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
}

export const hasContentBuild = hasVfsBuild;
