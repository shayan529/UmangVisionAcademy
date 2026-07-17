FROM node:20-alpine

# Set the working directory to the workspace root
WORKDIR /app

# Copy the entire workspace to ensure relative imports of server schemas and utils are available
COPY . .

# Change working directory to the worker service
WORKDIR /app/worker

# Install dependencies (production only)
RUN npm install --omit=dev

# Default environment variables
ENV NODE_ENV=production
ENV IS_WORKER=true
ENV PORT=3001

# Expose dashboard port
EXPOSE 3001

# Run the worker
CMD ["npm", "start"]
