FROM node:latest

WORKDIR /usr/src/app

COPY ./app /usr/src/app

RUN npm install -y

RUN npx prisma db push --accept-data-loss

EXPOSE 3000

ARG JWT_SECRET

ENV JWT_SECRET=$JWT_SECRET

CMD ["npm", "start"]