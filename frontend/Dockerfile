FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Caminho relativo: o nginx faz o proxy para a api, entao o bundle nao carrega
# host nem porta.
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
