FROM node:16-alpine3.16 As development

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm i --location=global npm@latest

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:16-alpine3.16 As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev

RUN npx prisma generate

COPY . .

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3003

CMD ["node", "dist/apps/reimbursement-app-api/main"]
