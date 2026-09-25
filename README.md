# CensoZEPA (Backend & Web Frontend)

Sistema de ciencia ciudadana para el registro y visualización de avistamientos de aves en ZEPAs (Zonas de Especial Protección para las Aves).

---

## 🏗 Arquitectura del Sistema

- **Base de Datos:** PostgreSQL 16 con extensión **PostGIS 3.4** (gestión espacial `GEOMETRY(Point, 4326)` e índices GiST).
- **Backend (API REST):** Node.js + **Fastify** + **TypeScript** + **Zod** + JWT.
- **Frontend (Web):** SPA construida con **React** + **Vite** + **TypeScript** + **Leaflet** / **react-leaflet**.
- **Contenedores locales:** Podman (`docker-compose.yml`).

---

## 🚀 Puesta en Marcha en Local

### Opción A: Usando 3 terminales separadas (Recomendado para ver logs en vivo)

- **Ventana 1 (Base de Datos):**
  ```bash
  ./run.sh db
  ```
  *(Si el contenedor ya está corriendo, no lo recrea y se conecta a sus logs en vivo)*

- **Ventana 2 (Backend Fastify API en :3000):**
  ```bash
  ./run.sh backend
  ```

- **Ventana 3 (Frontend React + Vite en :5173):**
  ```bash
  ./run.sh frontend
  ```

### Opción B: Todo en una sola terminal
```bash
./run.sh
# O bien: ./run.sh all
```
*(Pulsa `Ctrl + C` para detener ordenadamente el backend y frontend).*

---

## 📱 Guía de Integración para la App Android (Kotlin)

### 1. Autenticación (`POST /api/auth/login`)
- **URL:** `http://<IP_SERVIDOR>:3000/api/auth/login`
- **Body:**
```json
{
  "email": "voluntario1@censozepa.org",
  "password": "password123"
}
```
- **Respuesta:** Devuelve `token` (JWT). Añadir a la cabecera de las siguientes peticiones:
  `Authorization: Bearer <token>`

### 2. Enviar Avistamiento (`POST /api/sightings`)
Consumido por `WorkManager` al recuperar cobertura.
- **URL:** `http://<IP_SERVIDOR>:3000/api/sightings`
- **Body:**
```json
{
  "speciesName": "Aquila adalberti (Águila imperial ibérica)",
  "count": 2,
  "sightedAt": "2026-09-25T10:00:00.000Z",
  "latitude": 39.8333,
  "longitude": -6.0167,
  "accuracyMeters": 4.8,
  "notes": "Pareja observada sobrevolando la dehesa",
  "clientSyncId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
}
```
> **Nota de Idempotencia:** `clientSyncId` es un UUID generado localmente en SQLite/Room en Android. Si WorkManager reintenta el envío tras un fallo de red, el servidor evita duplicados y devuelve el registro existente de forma segura.

### 3. Enviar Lote de Avistamientos (`POST /api/sightings/batch`)
Para sincronizaciones masivas de registros acumulados offline:
- **URL:** `http://<IP_SERVIDOR>:3000/api/sightings/batch`
- **Body:**
```json
{
  "sightings": [ /* Array de objetos de avistamiento */ ]
}
```

---

## 🗺 Visualización en el Frontend Web

Abre en tu navegador:
👉 **[http://localhost:5173](http://localhost:5173)**

- Mapa interactivo con los avistamientos geolocalizados en España.
- Filtro reactivo en la barra superior (ej. escribe *Águila*, *Grulla*, *Flamenco*, etc.).
- Haz clic en cualquier marcador para ver los detalles del avistamiento (observador, fecha, notas, precisión GPS).
- Botón **Iniciar Sesión** con las credenciales de prueba:
  - **Email:** `voluntario1@censozepa.org`
  - **Contraseña:** `password123`
