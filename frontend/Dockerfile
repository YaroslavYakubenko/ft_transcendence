# Use official Node image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite in Docker-friendly mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
