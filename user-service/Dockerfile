FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run prisma:generate

EXPOSE 5005
CMD ["npm", "start"]