# Wildrose Plains — Portfolio

Personal portfolio for **Cooper Davies** (PhD, Calgary). Node.js backend and a React frontend that looks like a mint-style terminal. "Apps" open as windows, and you can explore projects and run commands from the shell. **TypeScript** throughout (server and vfs).

## Stack

- **Backend:** Node.js, Express, TypeScript in `server/` (API + serves built frontend)
- **Frontend:** React 18, Vite, React Router 6, TypeScript in `frontends/vfs/`

## Commands

```bash
# Install root and vfs dependencies
npm install
npm run vfs:install

# Development: run backend (tsx runs TypeScript directly)
npm run dev

# Development: run frontend (Vite, with API proxy to backend)
npm run vfs:dev

# Production: build server TS, build vfs, then run
npm run server:build && npm run build && npm start
```

For local development, run both in separate terminals:

- `npm run dev` — backend on http://localhost:3000 (uses `tsx`, no server compile needed)
- `npm run vfs:dev` — Vite on http://localhost:5173 (proxies `/api` to 3000)

For production, `npm start` runs the compiled server (`server/dist/`); run `npm run server:build` first.

## Docker

**Production (single image):**

```bash
docker compose up --build
# Or: docker build -t portfolio . && docker run -p 3000:3000 portfolio
```

**Development (live code updates, no image rebuild):**

I've setup a dev docker with hot-reloads and which watches source code changes. I personally debug by simply running the docker-compose.dev.yml file.

```bash
# One-time: install vfs deps so the vfs container can run Vite
npm run vfs:install

# Start server + vfs; edit server/ or frontends/vfs/ and see changes immediately
docker compose -f docker-compose.dev.yml up --build
```