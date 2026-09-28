#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODE="${1:-all}"

start_db() {
    echo "📦 [PostgreSQL + PostGIS] Comprobando contenedor en Podman..."
    if podman ps --format "{{.Names}}" | grep -q "^censozepa_postgres$"; then
        echo "✅ El contenedor 'censozepa_postgres' ya está en ejecución en el puerto 5432."
    else
        echo "🚀 Levantando servicio 'postgres' con podman compose..."
        podman compose up -d postgres
    fi

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
}

start_backend() {
    echo "⚙️  [Backend Fastify] Comprobando dependencias..."
    if [ ! -d "backend/node_modules" ]; then
        echo "📥 Instalando dependencias de backend..."
        (cd backend && npm install)
    fi

    echo "🚀 Arrancando servidor Backend (Fastify API en http://localhost:3000)..."
    cd backend && exec npm run dev
}

start_frontend() {
    echo "🎨 [Frontend React + Vite] Comprobando dependencias..."
    if [ ! -d "frontend/node_modules" ]; then
        echo "📥 Instalando dependencias de frontend..."
        (cd frontend && npm install)
    fi

    echo "🚀 Arrancando servidor Frontend (React + Leaflet en http://localhost:5173)..."
    cd frontend && exec npm run dev
}

run_import() {
    echo "🦅 [Importador CSV] Ingestando datos de 10 usuarios y ZEPAs a PostGIS..."
    cd backend && npx tsx src/scripts/importCsvData.ts
}

case "$MODE" in
    db|postgres|postgresql)
        start_db
        ;;
    backend|api|server)
        start_backend
        ;;
    frontend|front|web)
        start_frontend
        ;;
    import|seed|import-csv)
        run_import
        ;;
    all)
        echo "=================================================="
        echo "  🚀 Levantando entorno completo de CensoZEPA"
        echo "=================================================="

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
            exit 0
        }
        trap cleanup SIGINT SIGTERM

        start_db

        if [ ! -d "backend/node_modules" ]; then
            (cd backend && npm install)
        fi
        if [ ! -d "frontend/node_modules" ]; then
            (cd frontend && npm install)
        fi

        echo "⚙️  Arrancando Backend en segundo plano (:3000)..."
        (cd backend && npm run dev) &
        BACKEND_PID=$!

        COUNT=0
        until curl -s http://localhost:3000/health >/dev/null 2>&1 || [ $COUNT -eq 15 ]; do
            sleep 1
            COUNT=$((COUNT + 1))
        done

        echo "🎨 Arrancando Frontend en segundo plano (:5173)..."
        (cd frontend && npm run dev) &
        FRONTEND_PID=$!

        echo ""
        echo "=================================================="
        echo "  🎉 Todo listo para probar en tu navegador:"
        echo ""
        echo "  👉 Frontend Web: http://localhost:5173"
        echo "  👉 Backend API:  http://localhost:3000"
        echo "  👉 Healthcheck:  http://localhost:3000/health"
        echo ""
        echo "  👥 10 Usuarios ornitólogos disponibles en el login:"
        echo "     - laura.ornito@gmail.com    (Páramo Leonés)"
        echo "     - marcos.birds@gmail.com    (Doñana)"
        echo "     - elena.campo@gmail.com     (Monfragüe)"
        echo "     - javier.zepa@gmail.com     (Hoces del Duratón)"
        echo "     - lucia.natura@gmail.com    (Tablas de Daimiel)"
        echo "     - carlos.esteparias@gmail.com (Laguna de Gallocanta)"
        echo "     - pablo.rapaces@gmail.com   (Delta del Ebro)"
        echo "     - marta.fauna@gmail.com     (Cabo de Gata-Níjar)"
        echo "     - sergio.silvestre@gmail.com (Somiedo)"
        echo "     - beatriz.vuelo@gmail.com   (Sierra de Guadarrama)"
        echo "     Contraseña para todos: password123"
        echo "     Admin Global: jroman.espinar@gmail.com (password123)"
        echo "=================================================="
        echo "  Pulsa [Ctrl + C] en cualquier momento para parar."
        echo "=================================================="
        wait
        ;;
    *)
        echo "Uso: $0 [db | backend | frontend | import | all]"
        echo ""
        echo "Opciones:"
        echo "  db        -> Levanta / verifica el contenedor PostgreSQL + PostGIS (Podman)"
        echo "  backend   -> Levanta el servidor Node Fastify en primer plano (puerto 3000)"
        echo "  frontend  -> Levanta la app React + Vite en primer plano (puerto 5173)"
        echo "  import    -> Re-ejecuta la ingesta de los 10 CSVs a la base de datos"
        echo "  all       -> Levanta todo conjuntamente (por defecto)"
        exit 1
        ;;
esac
