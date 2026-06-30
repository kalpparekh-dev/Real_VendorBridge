FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]