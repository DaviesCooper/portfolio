import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  vfsDist: path.join(rootDir, 'frontends', 'vfs', 'dist'),
  /** Second frontend: lasers app, served at /lasers */
  laserDist: path.join(rootDir, 'frontends', 'lasers', 'dist'),
  /** Root of the sandboxed "OS" filesystem for the terminal (Linux-like layout). */
  osRoot: path.join(rootDir, 'os'),
} as const;
