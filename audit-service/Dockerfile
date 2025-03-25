FROM node:18-alpine
WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies, including Prisma
RUN npm install

# Ensure Prisma CLI is installed globally (optional, but ensures availability)
RUN npm install -g prisma

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Start the application without running migrations
CMD ["node", "src/index.js"]