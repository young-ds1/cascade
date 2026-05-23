FROM node:18-alpine

# Create non-root user
RUN addgroup -S cascade && adduser -S cascade -G cascade

WORKDIR /app

# Copy only what's needed
COPY package.json .
COPY packages/ ./packages/
COPY config.example.json ./config.json

# Set ownership
RUN chown -R cascade:cascade /app

USER cascade

EXPOSE 8765

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8765/health || exit 1

CMD ["node", "packages/proxy/cascade.mjs"]
