# Local container for the GasMeUp API (production runs on App Engine via app.yaml).
# Keep the Node major in sync with app.yaml (nodejs24) and package.json engines.
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /usr/app

# Install exactly what the lockfile pins, without devDependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

USER node
EXPOSE 3001

# Env vars (see .env.sample) are supplied at runtime; .env is not baked into the image.
# Mount it (dotenv reads it): docker run -v "$PWD/.env:/usr/app/.env:ro" -p 3001:3001 gasmeup-server
CMD ["node", "src/index.js"]
