import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback local para pruebas si no hay .env
    DATABASE_URL = "postgresql+psycopg2://admin:admin123@localhost:5432/postgres"

# Fix para Render
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)


sql_commands = """
-- ======================
-- 1. Tabla de Usuarios
-- ======================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('vendedor', 'contratador')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ======================
-- 2. Habilidades
-- ======================
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- ======================
-- 3. Relación Usuario-Habilidad
-- ======================
CREATE TABLE IF NOT EXISTS user_skills (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- ======================
-- 4. Servicios
-- ======================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ======================
-- 5. Trabajos
-- ======================
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    contractor_id INT REFERENCES users(id) ON DELETE CASCADE,
    vendor_id INT REFERENCES users(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id),
    status VARCHAR(20) DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_progreso', 'completado', 'cancelado')),
    start_date DATE,
    end_date DATE,
    total_amount NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ======================
-- 6. Reseñas
-- ======================
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ======================
-- 7. Pagos
-- ======================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'pagado', 'fallido')),
    created_at TIMESTAMP DEFAULT NOW()
);


ALTER TABLE services ADD COLUMN IF NOT EXISTS skill_id INT REFERENCES skills(id);

-- Full Text Search Configuration

ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE services
SET search_vector = to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,''));

CREATE INDEX IF NOT EXISTS idx_services_search_vector ON services USING GIN (search_vector);

CREATE OR REPLACE FUNCTION tsvector_update_trigger_func() RETURNS trigger AS $$
BEGIN
  new.search_vector := to_tsvector('spanish', coalesce(new.title,'') || ' ' || coalesce(new.description,''));
  return new;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON services;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON services FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger_func();

-- Add profile_picture_url column (stores URL or path to image)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add location column
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(200);

-- Add bio column if not exists (for profile description)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for faster location searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);

ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vendor_confirmed BOOLEAN DEFAULT FALSE;
"""

def init_db():
    print("Iniciando creación de tablas...")
    with engine.connect() as conn:
        # Ejecutar el script completo
        conn.execute(text(sql_commands))
        conn.commit()
    print("Tablas creadas exitosamente.")

if __name__ == "__main__":
    init_db()
