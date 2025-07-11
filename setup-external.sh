#!/bin/bash
# Deploy script for Delta Chat

echo "🚀 Setting up Delta Chat for external access..."

# Install tunnel service (using ngrok as example)
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    # For Ubuntu/Debian
    if command -v apt &> /dev/null; then
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    # For macOS
    elif command -v brew &> /dev/null; then
        brew install ngrok/ngrok/ngrok
    else
        echo "❌ Please install ngrok manually from https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ Ready! Now run these commands:"
echo ""
echo "1. Start the app:"
echo "   npm run devserver"
echo ""
echo "2. In another terminal, expose to internet:"
echo "   ngrok http 5000"
echo ""
echo "3. Share the ngrok URL with your friends!"
echo ""
echo "Alternative free tunneling services:"
echo "- LocalTunnel: npx localtunnel --port 5000"
echo "- Serveo: ssh -R 80:localhost:5000 serveo.net"
echo "- Cloudflare Tunnel: cloudflared tunnel --url http://localhost:5000"
