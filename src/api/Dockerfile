FROM node:20

WORKDIR /usr/src/app/src/api/

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]

