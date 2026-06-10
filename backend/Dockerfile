FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY routes ./routes
COPY controllers ./controllers
COPY sockets ./sockets
COPY execution ./execution
COPY services ./services
COPY middleware ./middleware
COPY utils ./utils
COPY config ./config
COPY data ./data

EXPOSE 5001

CMD ["npm", "run", "start"]
