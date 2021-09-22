FROM node:16.9.1-alpine3.11

WORKDIR /ReciclameWeb

COPY . .
RUN npm install