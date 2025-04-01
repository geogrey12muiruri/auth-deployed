# Step 1: Use a lightweight Node.js image
FROM node:18-alpine

# Step 2: Install OpenSSL and other dependencies
RUN apk update && apk add --no-cache openssl

# Step 3: Set the working directory
WORKDIR /app

# Step 4: Copy package.json and package-lock.json
COPY package.json ./

# Step 5: Install dependencies
RUN npm install

# Step 6: Copy the rest of the application code
COPY . .

# Step 7: Generate Prisma Client
RUN npx prisma generate

# Step 8: Expose the application port
EXPOSE 5002

# Step 9: Start the application
CMD ["node", "src/server.js"]