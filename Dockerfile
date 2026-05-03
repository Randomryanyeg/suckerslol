# Use Node.js for building
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y php-cli php-cgi php-curl php-json php-mbstring openssl

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run Node.js + PHP
FROM node:20-slim
RUN apt-get update && apt-get install -y php-cli php-cgi php-curl php-json php-mbstring openssl
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server ./server
COPY --from=build /app/webroot ./webroot
COPY --from=build /app/server.ts ./server.ts

EXPOSE 3000
CMD ["npm", "start"]
