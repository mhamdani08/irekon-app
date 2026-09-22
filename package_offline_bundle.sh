#!/bin/bash
set -e

echo "=== Packaging iRekon Full Docker Deployment Bundle ==="
echo "1. Building Docker Images..."
docker compose build

echo "2. Exporting Docker Images to irekon-full-images.tar.gz..."
docker save \
  irekon-app-backend:latest \
  irekon-app-frontend:latest \
  irekon-app-worker:latest \
  postgres:16-alpine \
  redis:7-alpine \
  rabbitmq:3.13-management-alpine \
  minio/minio:RELEASE.2024-03-21T23-13-43Z \
  | gzip > irekon-full-images.tar.gz

echo "3. Creating Deployment Package Archive (irekon-deploy-package.tar.gz)..."
tar -czvf irekon-deploy-package.tar.gz \
  irekon-full-images.tar.gz \
  docker-compose.yml \
  .env

echo "=== SUCCESS! Bundle file 'irekon-deploy-package.tar.gz' ready to be deployed to target server! ==="
