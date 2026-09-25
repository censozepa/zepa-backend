-- ============================================================================
-- CensoZEPA - Script de Inicialización de Base de Datos
-- PostgreSQL 16 con extensión PostGIS
-- ============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumeración para roles de usuario
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('volunteer', 'admin', 'researcher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'volunteer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Tabla de Zonas ZEPA (polígonos de referencia espacial)
CREATE TABLE IF NOT EXISTS zepa_zones (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,      -- Código oficial ZEPA (ej. ES0000001)
    name VARCHAR(255) NOT NULL,            -- Nombre de la zona
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zepa_zones_geom ON zepa_zones USING GIST (geometry);

-- 5. Tabla de Avistamientos (Sightings)
CREATE TABLE IF NOT EXISTS sightings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Datos de la observación
    species_name VARCHAR(200) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    sighted_at TIMESTAMPTZ NOT NULL,       -- Fecha/hora real en el campo
    
    -- Localización espacial (SRID 4326: WGS 84 estándar GPS)
    location GEOMETRY(Point, 4326) NOT NULL,
    accuracy_meters DOUBLE PRECISION,     -- Precisión del sensor GPS del móvil
    
    -- Datos adicionales
    notes TEXT,
    
    -- Idempotencia para sincronizaciones offline (WorkManager en Android)
    client_sync_id UUID UNIQUE,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Índices de rendimiento
-- Índice espacial GiST: fundamental para consultas geográficas eficientes
CREATE INDEX IF NOT EXISTS idx_sightings_location ON sightings USING GIST (location);

-- Índices B-Tree para filtros habituales
CREATE INDEX IF NOT EXISTS idx_sightings_user_id ON sightings(user_id);
CREATE INDEX IF NOT EXISTS idx_sightings_sighted_at ON sightings(sighted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_species_name ON sightings(species_name);

-- 7. Trigger para actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sightings_updated_at
    BEFORE UPDATE ON sightings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
