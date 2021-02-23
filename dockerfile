FROM node:15.8-alpine3.10 AS builder

WORKDIR /opt/app

COPY package*.json ./

RUN npm install && npm install -g typescript

COPY tsconfig.json ./

# Copy the rest of the files except the ones specified in .dockerignore
COPY ./src ./src/

RUN tsc

# cleanup
RUN rm -rf package-lock.json package.json src/ tsconfig.json

FROM node:15.8-alpine3.10 AS runner

WORKDIR /opt/app

COPY --from=builder /opt/app/ ./

ENV NODE_ENV production

CMD [ "node", "dist/app.js" ]