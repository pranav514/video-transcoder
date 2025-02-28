FROM node:20-alpine
WORKDIR /app
COPY transcoding-service/package.json transcoding-service/package-lock.json ./
RUN npm install
COPY transcoding-service .
RUN apk add --no-cache ffmpeg bash
RUN npm run build
CMD ["node", "dist/index.js"]