# Step 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Next.js application
RUN npm run build

# Step 2: Production Stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install only the production dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next

# Copy the static files
COPY --from=builder /app/public /public

# Expose the Next.js app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]