# Dockerfile for the Vite frontend client
FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite development server port
EXPOSE 3000

# Run Vite dev server bound to all network interfaces (0.0.0.0)
# so it can be accessed from the host machine.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
