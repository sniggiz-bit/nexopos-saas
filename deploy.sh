#!/bin/bash

# Configuration
# Replace these with your actual server details or set them as environment variables
SERVER_IP="${SERVER_IP:-1.2.3.4}"
SERVER_USER="${SERVER_USER:-tecnomedia}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/tecnomedia/apps/nexopos}"
SSH_PORT="${SSH_PORT:-22}"

echo "========================================"
echo "Deploying NexoPOS to $SERVER_IP..."
echo "========================================"

# 1. Upload Source Code using Rsync
# Excludes node_modules, .git, dist, and other non-essential files
echo "--> Syncing files..."
rsync -avz --delete -e "ssh -p $SSH_PORT" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'pgdata' \
    --exclude '.env' \
    ./ "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH"

# 2. Execute Remote Commands
echo "--> Connecting to server to build and launch..."
ssh -p "$SSH_PORT" "$SERVER_USER@$SERVER_IP" <<EOF
    cd "$DEPLOY_PATH"

    # Ensure .env.prod exists (You should manually create this on the server one time)
    if [ ! -f .env.prod ]; then
        echo "WARNING: .env.prod not found! Please create it."
        exit 1
    fi

    echo "--> Building and starting Docker containers..."
    docker compose -f docker-compose.prod.yml up -d --build

    echo "--> Waiting for API to initialize..."
    sleep 10

    echo "--> Running Database Migrations..."
    # Using service name 'api' as defined in docker-compose.prod.yml
    docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

    echo "--> Cleaning up unused images..."
    docker image prune -f

    echo "========================================"
    echo "Deployment Complete!"
    echo "========================================"
EOF
