#!/bin/bash

# ================================================
# Update Frontend Configuration for Production
# ================================================
# Met à jour la configuration du frontend pour pointer vers le serveur en production

SERVER_IP="${1:-172.27.28.14}"
VITE_CONFIG="/opt/sfiDashMonitoring/vite.config.js"

echo "Mise à jour de la configuration frontend..."
echo "IP du serveur: $SERVER_IP"

# Check if file exists
if [ ! -f "$VITE_CONFIG" ]; then
    echo "Erreur: $VITE_CONFIG non trouvé"
    exit 1
fi

# Update vite.config.js with production settings
cat > "$VITE_CONFIG" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
EOF

echo "Configuration frontend mise à jour"
echo ""
echo "Prochaines étapes:"
echo "1. Rebuilder le frontend: cd /opt/sfiDashMonitoring && npm run build"
echo "2. Copier les fichiers build: sudo cp -r dist/* /usr/share/nginx/html/"
echo "3. Redémarrer Nginx: sudo systemctl restart nginx"
