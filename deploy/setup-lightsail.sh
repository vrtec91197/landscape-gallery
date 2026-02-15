#!/bin/bash
#
# AWS Lightsail Instance Setup Script
# Run this on a fresh Ubuntu 22.04 or Amazon Linux 2023 Lightsail instance
#
# Usage:
#   1. Create a Lightsail instance (Ubuntu 22.04, $5-10/mo plan)
#   2. Open ports 80 and 443 in Lightsail networking
#   3. SSH in and run: curl -sSL <this-script-url> | bash
#   OR copy this script and run it directly
#

set -euo pipefail

echo "=== Landscape Gallery - Lightsail Setup ==="

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "Docker installed. You may need to log out and back in for group changes."
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# Install git
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt-get update -y && sudo apt-get install -y git || sudo yum install -y git
fi

# Clone or update repo
APP_DIR="/opt/landscape-gallery"
if [ -d "$APP_DIR" ]; then
    echo "Updating existing installation..."
    cd "$APP_DIR"
    git pull
else
    echo "Enter your git repository URL (or press Enter to skip cloning):"
    read -r REPO_URL
    if [ -n "$REPO_URL" ]; then
        sudo git clone "$REPO_URL" "$APP_DIR"
        sudo chown -R $USER:$USER "$APP_DIR"
    else
        sudo mkdir -p "$APP_DIR"
        sudo chown -R $USER:$USER "$APP_DIR"
        echo "Please copy your project files to $APP_DIR"
    fi
fi

cd "$APP_DIR"

# Create data directories
mkdir -p data photos

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "=== Configuration ==="
    read -p "Domain name (e.g. gallery.example.com): " DOMAIN
    read -p "Admin username [admin]: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}
    read -sp "Admin password: " ADMIN_PASS
    echo ""
    AUTH_SECRET=$(openssl rand -hex 32)

    cat > .env <<EOF
DOMAIN=${DOMAIN}
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASS}
AUTH_SECRET=${AUTH_SECRET}
EOF
    echo "Environment file created."
else
    echo "Using existing .env file."
    source .env
fi

# Export for docker-compose
export $(cat .env | xargs)

echo ""
echo "=== Building and starting services ==="
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Your gallery is now running!"
echo "  - URL: https://${DOMAIN:-localhost}"
echo "  - Admin: Log in via the Login button in the navbar"
echo ""
echo "Useful commands:"
echo "  cd $APP_DIR"
echo "  docker compose -f docker-compose.prod.yml logs -f     # View logs"
echo "  docker compose -f docker-compose.prod.yml restart      # Restart"
echo "  docker compose -f docker-compose.prod.yml down          # Stop"
echo "  docker compose -f docker-compose.prod.yml up -d --build # Rebuild & deploy"
echo ""
echo "To add photos for scanning, place them in: $APP_DIR/photos/"
echo "Then trigger a scan from the Upload dialog in the app."
