# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install required dependencies for bcrypt and node-gyp
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

# Rebuild bcrypt to ensure compatibility with the container's architecture
RUN npm rebuild bcrypt --build-from-source

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5001

CMD ["npm", "start"]