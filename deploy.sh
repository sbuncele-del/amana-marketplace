#!/bin/bash
# ============================================
# Amana Marketplace — Vultr Deployment Script
# ============================================
# Run this on a fresh Ubuntu 22.04+ Vultr VPS
# Usage: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================

set -e

echo "🌍 Amana Marketplace — Vultr Deployment"
echo "========================================"

# 1. System update
echo "📦 Updating system..."
apt update && apt upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 3. Install Docker Compose
if ! command -v docker compose &> /dev/null; then
    apt install -y docker-compose-plugin
fi

# 4. Install Nginx (reverse proxy)
echo "🌐 Installing Nginx..."
apt install -y nginx certbot python3-certbot-nginx

# 5. Create app directory
APP_DIR="/opt/amana"
mkdir -p $APP_DIR
echo "📁 App directory: $APP_DIR"

# 6. Create .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚙️  Creating .env file..."
    cat > $APP_DIR/.env << 'ENVFILE'
# Database
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32

# Vesicash
VESICASH_API_URL=https://api.vesicash.com
VESICASH_PRIVATE_KEY=your_vesicash_private_key
VESICASH_PUBLIC_KEY=your_vesicash_public_key

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_HASH=your_webhook_hash

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
ENVFILE
    echo "⚠️  IMPORTANT: Edit $APP_DIR/.env with your actual credentials!"
fi

# 7. Nginx config
DOMAIN=${1:-"localhost"}
cat > /etc/nginx/sites-available/amana << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/amana /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env with your credentials"
echo "  2. Clone your repo to $APP_DIR"
echo "  3. Run: cd $APP_DIR && docker compose up -d"
echo "  4. Run migrations: docker compose exec app npx prisma migrate deploy"
echo "  5. For SSL: certbot --nginx -d $DOMAIN"
echo ""
echo "🌍 Amana will be running at http://$DOMAIN"
