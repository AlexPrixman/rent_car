FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/web apps/web
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=4000 DATABASE_PATH=/app/data/rentdesk.sqlite
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev && mkdir -p /app/data && chown node:node /app/data
COPY apps/api apps/api
COPY --from=build /app/apps/web/dist apps/web/dist
USER node
EXPOSE 4000
CMD ["node", "apps/api/server.js"]
