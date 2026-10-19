FROM node:22-alpine
RUN apk upgrade --no-cache
RUN npm install -g npm@latest


WORKDIR /app

COPY package*.json ./
RUN npm install 

COPY server.js ./

EXPOSE 3000

CMD ["npm", "start"]
