FROM node:erbium-alpine

RUN apk update
RUN apk add zip

# Get NPM Dependencies (done in tmp directory to improve docker caching performance)
COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

# Build the app
WORKDIR /app
ADD . /app
RUN npm run build

CMD ["npm","run","start"]