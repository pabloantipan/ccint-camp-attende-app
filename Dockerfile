# Dockerfile for CCINT Camp Attendee App (Angular Frontend)
# Stage 1: Build the Angular SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for environment-specific builds
ARG BUILD_ENV=production
ENV BUILD_ENV=${BUILD_ENV}

# Build the Angular app
RUN if [ "$BUILD_ENV" = "production" ]; then \
        npm run build:prod; \
    else \
        npm run build:dev; \
    fi

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from builder stage
# Angular outputs to dist/ccint-camp-attendee-app/browser
COPY --from=builder /app/dist/ccint-camp-attendee-app/browser /usr/share/nginx/html

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
