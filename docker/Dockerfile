FROM node:latest

WORKDIR /usr/src/app

COPY ./app /usr/src/app

RUN npm install -y

EXPOSE 3000

ARG JWT_SECRET

ENV JWT_SECRET=$JWT_SECRET

CMD npx prisma db push --accept-data-loss && \
    npx prisma migrate deploy && \
    npm start