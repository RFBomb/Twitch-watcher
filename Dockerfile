FROM node:13.12.0-alpine3.10
LABEL maintainer="RFBomb <https://github.com/RFBomb/Twitch-watcher>"

RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont

WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV DockerContainer=TRUE
CMD ["npm","start"]
