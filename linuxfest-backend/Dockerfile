FROM node:16.10.0-alpine

WORKDIR /app
COPY package.json .

ARG NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; \
        then npm install --only=production; \
        else npm install; \
        fi

COPY . ./


ENV PORT 5000
EXPOSE $PORT
