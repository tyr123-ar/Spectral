FROM node:20

# Install Docker CLI so the worker can run the sandbox
RUN apt-get update && apt-get install -y docker.io

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000