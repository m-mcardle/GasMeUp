# Build the images
build:
	docker build -t gasmeup-server .

# Run the containers
run:
	docker run -d -p 3001:3001 --name gasmeup-server gasmeup-server

# Run the containers in the background
dev:
	nodemon ./src/index.js
