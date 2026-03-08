import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { config } from '../config.js';

const laserDist = config.laserDist;
const hasBuild = fs.existsSync(path.join(laserDist, 'index.html'));

export const lasersRouter = Router();

if (hasBuild) {
  lasersRouter.use(express.static(laserDist));
  lasersRouter.get('*', (_req, res) => {
    res.sendFile(path.join(laserDist, 'index.html'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
}

export const hasLaserBuild = hasBuild;
