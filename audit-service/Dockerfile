FROM node:18-alpine
WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]