# Write a Dockerfile for a Node.jk server

# Specify a base image
FROM node:alpine

# Specify a working directory
WORKDIR /usr/app

# Install some dependencies
COPY ./package.json ./
RUN npm install
COPY ./ ./

# Default command
CMD ["npm", "start"]
