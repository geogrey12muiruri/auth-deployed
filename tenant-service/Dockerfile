# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5001

CMD ["npm", "start"]