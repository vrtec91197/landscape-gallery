#!/bin/bash
#
# Backup script - backs up SQLite DB and photos
# Run via cron: 0 3 * * * /opt/landscape-gallery/deploy/backup.sh
#

set -euo pipefail

APP_DIR="/opt/landscape-gallery"
BACKUP_DIR="/opt/backups/landscape-gallery"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup SQLite (safe hot copy)
echo "Backing up database..."
sqlite3 "$APP_DIR/data/gallery.db" ".backup '$BACKUP_DIR/gallery_${DATE}.db'"

# Backup photos
echo "Backing up photos..."
tar -czf "$BACKUP_DIR/photos_${DATE}.tar.gz" -C "$APP_DIR" photos/

# Keep only last 7 backups
echo "Cleaning old backups..."
ls -t "$BACKUP_DIR"/gallery_*.db 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
ls -t "$BACKUP_DIR"/photos_*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null

echo "Backup complete: $BACKUP_DIR"
