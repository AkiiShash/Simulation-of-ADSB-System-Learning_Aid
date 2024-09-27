# Use the official Node.js image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package.json ./

# Install dependencies
RUN npm install
RUN npm -g install next

# Expose the port the frontend app runs on
EXPOSE 3000

# Command to run the frontend server
CMD ["npm", "run", "dev"]
