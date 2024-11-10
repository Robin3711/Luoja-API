FROM node:latest

WORKDIR /usr/src/app

COPY ./app /usr/src/app

RUN npm install -y

RUN npx prisma db push --accept-data-loss

CMD ["npm", "start"]