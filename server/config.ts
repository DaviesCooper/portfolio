import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  clientDist: path.join(rootDir, 'client', 'dist'),
  /** Root of the sandboxed "OS" filesystem for the terminal (Linux-like layout). */
  osRoot: path.join(rootDir, 'os'),
} as const;
