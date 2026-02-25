# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY client/ client/
RUN npm run client:install

# ---- Client build ----
FROM node:22-alpine AS client-build
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/client/node_modules /app/client/node_modules
COPY client/package.json client/
COPY client/ client/

RUN npm run build

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
COPY --from=client-build /app/client/dist ./server/client/dist

USER nodejs
EXPOSE 8080

CMD ["node", "server/dist/index.js"]

# ---- Dev: full source + watchers for live reload (no image rebuild) ----
FROM node:22-alpine AS dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY client/ client/
RUN npm run client:install && npm run build

COPY server/ server/
# So the server can serve static assets; path is server/client/dist in config
RUN mkdir -p server/client/dist && cp -r client/dist/. server/client/dist/

EXPOSE 3000
# Override in compose: mount ./server and run nodemon
CMD ["npx", "nodemon", "--exec", "tsx server/index.ts", "-w", "server", "-e", "ts"]
