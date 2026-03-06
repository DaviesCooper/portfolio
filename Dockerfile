# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY frontends/vfs/ frontends/vfs/
RUN npm run vfs:install

COPY frontends/lasers/ frontends/lasers/
RUN npm run lasers:install

# ---- VFS build ----
FROM node:22-alpine AS vfs-build
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/frontends/vfs/node_modules /app/frontends/vfs/node_modules
COPY frontends/vfs/package.json frontends/vfs/
COPY frontends/vfs/ frontends/vfs/

RUN npm run build

# ---- Lasers build ----
FROM node:22-alpine AS lasers-build
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/frontends/lasers/node_modules /app/frontends/lasers/node_modules
COPY frontends/lasers/package.json frontends/lasers/
COPY frontends/lasers/ frontends/lasers/

RUN npm run lasers:build

# ---- Server build ----
FROM node:22-alpine AS server-build
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json ./
COPY server/ server/
RUN npm run server:build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package.json ./
RUN npm install --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=vfs-build /app/frontends/vfs/dist ./server/frontends/vfs/dist
COPY --from=lasers-build /app/frontends/lasers/dist ./server/frontends/lasers/dist

USER nodejs
EXPOSE 8080

CMD ["node", "server/dist/index.js"]

# ---- Dev: full source + watchers for live reload (no image rebuild) ----
FROM node:22-alpine AS dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY frontends/vfs/ frontends/vfs/
RUN npm run vfs:install && npm run build

COPY frontends/lasers/ frontends/lasers/
RUN npm run lasers:install && npm run lasers:build

COPY server/ server/
# So the server can serve static assets
RUN mkdir -p server/frontends/vfs/dist && cp -r frontends/vfs/dist/. server/frontends/vfs/dist/
RUN mkdir -p server/frontends/lasers/dist && cp -r frontends/lasers/dist/. server/frontends/lasers/dist/

EXPOSE 3000
# Override in compose: mount ./server and run nodemon
CMD ["npx", "nodemon", "--exec", "tsx server/index.ts", "-w", "server", "-e", "ts"]
