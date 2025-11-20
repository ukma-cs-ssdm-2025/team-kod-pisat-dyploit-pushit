FROM node:20

WORKDIR /usr/src/app

COPY src/api/package*.json ./
RUN npm install

COPY src/api/. .

EXPOSE 3000

CMD ["npm", "run", "start"]
