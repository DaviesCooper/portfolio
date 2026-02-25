# Portfolio — Terminal UI

Personal portfolio with a Node.js backend and a React frontend that looks like an Ubuntu-style terminal. "Apps" open as windows; routing is handled by React Router. **TypeScript** throughout (server and client).

## Stack

- **Backend:** Node.js, Express, TypeScript in `server/` (API + serves built frontend; structured for growth)
- **Frontend:** React 18, Vite, React Router 6, TypeScript in `client/`

## Commands

```bash
# Install root and client dependencies
npm install
npm run client:install

# Development: run backend (tsx runs TypeScript directly)
npm run dev

# Development: run frontend (Vite, with API proxy to backend)
npm run client:dev

# Production: build server TS, build client, then run
npm run server:build && npm run build && npm start
```

For local development, run both in separate terminals:

- `npm run dev` — backend on http://localhost:3000 (uses `tsx`, no server compile needed)
- `npm run client:dev` — Vite on http://localhost:5173 (proxies `/api` to 3000)

For production, `npm start` runs the compiled server (`server/dist/`); run `npm run server:build` first.

## Routing

- `/` — Terminal only
- `/about`, `/projects`, `/contact` — Terminal + app window (open via `open about`, etc., or by visiting the URL)

## Server layout

- `server/index.ts` — entry point, starts the app
- `server/app.ts` — Express app creation, middleware, static + SPA fallback
- `server/config.ts` — port, paths, env
- `server/routes/` — API route modules; add new files here and mount them in `routes/index.ts`

## Docker

**Production (single image):**

```bash
docker compose up --build
# Or: docker build -t portfolio . && docker run -p 3000:3000 portfolio
```

**Development (live code updates, no image rebuild):**

```bash
# One-time: install client deps so the client container can run Vite
npm run client:install

# Start server + client; edit server/ or client/ and see changes immediately
docker compose -f docker-compose.dev.yml up --build
```

- **Server:** `./server` is mounted; [nodemon](https://nodemon.io/) restarts the process when you change any `.ts` file.
- **Client:** `./client` is mounted; Vite runs in the container with HMR. Use **http://localhost:5173** for the app (API is proxied to the server container).
- **API only:** http://localhost:3000 (e.g. `/api/health`). If no client build is present, the server serves a short dev message for non-API routes.

You can attach to logs with `docker compose -f docker-compose.dev.yml logs -f server` (or `client`).

## Adding pages

1. Add a component under `client/src/pages/`.
2. Register route and component in `client/src/App.tsx` in `ROUTE_APPS`.
3. Add the command in `client/src/components/Terminal.tsx` (open-command routes and help text).
