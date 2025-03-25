FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package*.json ./
RUN npm install

# Copy the Prisma folder
COPY prisma ./prisma

# Copy the src directory and any other necessary files
COPY src ./src

# Generate Prisma client
RUN npx prisma generate --schema prisma/schema.prisma

EXPOSE 5005
CMD ["npm", "start"]