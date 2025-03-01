FROM node:20-alpine
WORKDIR /app
COPY uploadjob/package.json uploadjob/package-lock.json ./
RUN npm install
COPY uploadjob .
RUN apk add --no-cache ffmpeg bash
EXPOSE 3000
CMD [ "npm"  "run" "dev"]