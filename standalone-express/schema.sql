-- ============================================================================
-- Esquema SQL Recomendado de 3 Tablas para CensoZEPA (PostgreSQL / PostGIS o SQLite)
-- ============================================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255),
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Tabla de Sesiones de Muestreo de Campo
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_session_id INTEGER NOT NULL,          -- id_sesion local de la app Android
    zepa_code VARCHAR(50) NOT NULL,              -- id_zepa (ej. ES0000365)
    start_time BIGINT NOT NULL,                  -- fecha_hora_inicio en millis
    end_time BIGINT DEFAULT 0,                   -- fecha_hora_fin en millis
    distance_km REAL DEFAULT 0.0,                -- distancia_recorrida en km
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_client_session UNIQUE (user_id, client_session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_zepa ON sessions(zepa_code);

-- 3. Tabla de Avistamientos Ornitológicos (Sightings)
CREATE TABLE IF NOT EXISTS sightings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    species_code VARCHAR(50),                   -- id_especie (ej. A084)
    common_name VARCHAR(200),                   -- nombre_comun
    scientific_name VARCHAR(200),               -- nombre_cientifico
    sighting_time VARCHAR(20),                  -- hora (ej. "10:15")
    count INTEGER NOT NULL DEFAULT 1,           -- cantidad observada
    phenological_alert BOOLEAN DEFAULT FALSE,   -- alerta_fenologica
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sightings_session_id ON sightings(session_id);
CREATE INDEX IF NOT EXISTS idx_sightings_species_code ON sightings(species_code);
