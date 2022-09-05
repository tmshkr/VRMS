FROM node:16-alpine

WORKDIR '/app'
COPY package*.json .
COPY apps apps
COPY packages packages
RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
RUN find apps \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

FROM node:16-alpine
WORKDIR /app
# Copy files from the first build stage.
COPY --from=0 /app .
RUN PUPPETEER_SKIP_DOWNLOAD=true npm install

COPY . .

RUN DISABLE_ERD=true npx prisma generate
RUN npm run build:web

CMD ["npm", "run", "start:web"]