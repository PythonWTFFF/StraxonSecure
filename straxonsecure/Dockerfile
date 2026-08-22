FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose the preview port
EXPOSE 4173

# Run the preview server (suitable for this architecture)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
