FROM node:22-alpine
WORKDIR /app
COPY server.cjs /app/server.cjs
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node","/app/server.cjs"]
