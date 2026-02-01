# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (better cache)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --production

# Copy application source
COPY . .

# Expose app port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
