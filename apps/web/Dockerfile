FROM node:20-alpine AS builder

WORKDIR /monorepo

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/web ./apps/web

ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_WEBSITE_DOMAIN=localhost

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_WEBSITE_DOMAIN=$VITE_WEBSITE_DOMAIN
ENV NODE_ENV=production

RUN npm run build --prefix apps/web

FROM nginx:alpine

COPY --from=builder /monorepo/dist/apps/web /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
