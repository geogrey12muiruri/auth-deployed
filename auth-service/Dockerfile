# Step 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build Prisma client (if using Prisma)
RUN npx prisma generate

# Step 2: Production Stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install only the production dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the rest of the code and Prisma client from the builder stage
COPY --from=builder /app /app

# Expose the server port
EXPOSE 5000

# Start the app
CMD ["node", "src/index.js"]