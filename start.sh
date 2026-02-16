#!/bin/sh

# Ensure persistent storage directories exist and are writable
mkdir -p /data/photos_public /data/thumbnails
chown nextjs:nodejs /data/photos_public /data/thumbnails

# Replace ephemeral dirs with symlinks to persistent volume
rm -rf /app/public/photos /app/public/thumbnails
ln -sf /data/photos_public /app/public/photos
ln -sf /data/thumbnails /app/public/thumbnails

exec su-exec nextjs node server.js
