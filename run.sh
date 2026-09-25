#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=================================================="
echo "  🚀 Levantando entorno completo de CensoZEPA"
echo "=================================================="

# Manejo de parada limpia con Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores de desarrollo..."
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "ℹ️  Servidores Frontend y Backend detenidos."
    echo "ℹ️  El contenedor PostGIS sigue disponible en Podman."
    echo "    (Para apagar también la base de datos: podman compose down)"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Base de datos con Podman
echo "📦 [1/3] Verificando / Levantando PostgreSQL + PostGIS (Podman)..."
podman compose up -d postgres >/dev/null

echo "⏳ Esperando a que PostGIS acepte conexiones..."
MAX_RETRIES=20
COUNT=0
until podman exec censozepa_postgres pg_isready -U censozepa -d censozepa >/dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
    sleep 1
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Error: Tiempo de espera agotado conectando con PostgreSQL."
    exit 1
fi
echo "✅ Base de datos PostGIS lista en localhost:5432"

# 2. Comprobar dependencias si no estuviesen instaladas
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Instalando dependencias del Backend..."
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Instalando dependencias del Frontend..."
    (cd frontend && npm install)
fi

# 3. Arrancar Backend en segundo plano
echo "⚙️  [2/3] Arrancando Backend (Fastify API en :3000)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Esperar a que el backend responda en /health
COUNT=0
until curl -s http://localhost:3000/health >/dev/null 2>&1 || [ $COUNT -eq 15 ]; do
    sleep 1
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq 15 ]; then
    echo "⚠️  El backend está tardando en iniciar, continuando..."
else
    echo "✅ Backend Fastify activo y conectado a PostGIS"
fi

# 4. Arrancar Frontend
echo "🎨 [3/3] Arrancando Frontend (React + Vite en :5173)..."
echo ""
echo "=================================================="
echo "  🎉 Todo listo para probar en tu navegador:"
echo ""
echo "  👉 Frontend Web: http://localhost:5173"
echo "  👉 Backend API:  http://localhost:3000"
echo "  👉 Healthcheck:  http://localhost:3000/health"
echo ""
echo "  👤 Usuario de prueba para Login:"
echo "     Email:    voluntario1@censozepa.org"
echo "     Password: password123"
echo "=================================================="
echo "  Pulsa [Ctrl + C] en cualquier momento para parar."
echo "=================================================="
echo ""

(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Mantener script activo hasta recibir Ctrl+C
wait
