# CensoZEPA - Standalone Express Backend

Servidor backend ligero en Node.js + Express para sincronización con la aplicación Android **CensoZEPA**.

## Requisitos
- Node.js 18+
- PostgreSQL (opcionalmente con el contenedor existente `censozepa_postgres`)

## Instalación y Ejecución

```bash
cd standalone-express
npm install
npm start # o node server.js
```

Por defecto escucha en `0.0.0.0:3000`.

## Endpoints Disponibles

### 1. `POST /createuser`
Registra o verifica un usuario de la aplicación Android.

**Request:**
```json
{
  "email": "usuario@gmail.com",
  "google_id": "google_auth_usuario@gmail.com",
  "name": "usuario"
}
```

**Response (HTTP 200 / 201):**
```json
{
  "status": "success",
  "message": "Usuario registrado o verificado con éxito",
  "user": {
    "email": "usuario@gmail.com",
    "name": "usuario"
  }
}
```

### 2. `POST /addregistry`
Recibe los muestreos de campo y avistamientos desde la app Android.

**Request:**
```json
{
  "email": "usuario@gmail.com",
  "total_sesiones": 1,
  "registros": [
    {
      "id_sesion": 1,
      "id_zepa": "ES0000365",
      "fecha_hora_inicio": 1740000000000,
      "fecha_hora_fin": 1740003600000,
      "distancia_recorrida": 2.5,
      "avistamientos": [
        {
          "id_especie": "A084",
          "nombre_comun": "Aguilucho cenizo",
          "nombre_cientifico": "Circus pygargus",
          "hora": "10:15",
          "cantidad": 3,
          "alerta_fenologica": true
        }
      ]
    }
  ]
}
```

**Response (HTTP 200):**
```json
{
  "status": "success",
  "message": "Registros de avistamientos guardados con éxito",
  "sesiones_procesadas": 1
}
```
