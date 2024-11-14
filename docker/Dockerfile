FROM node:latest

WORKDIR /usr/src/app

COPY ./app /usr/src/app

RUN npm install -y

RUN npx prisma db push --accept-data-loss

EXPOSE 3000

CMD ["npm", "start"]