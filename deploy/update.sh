#!/bin/bash
#
# Quick update script - pull latest code and redeploy
# Run from the project directory on your Lightsail instance
#

set -euo pipefail

APP_DIR="/opt/landscape-gallery"
cd "$APP_DIR"

echo "Pulling latest changes..."
git pull

echo "Rebuilding and restarting..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Cleaning up old images..."
docker image prune -f

echo "Done! Gallery updated."
