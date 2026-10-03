import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { RegisterInput } from '../schemas/auth.schema.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'volunteer' | 'admin' | 'researcher';
  is_active: boolean;
  tenant_id?: string | null;
  tenant_name?: string | null;
  tenant_slug?: string | null;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<UserRow, 'password_hash'>;

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [input.email.toLowerCase()]);
  if (existing.rows.length > 0) {
    const error: any = new Error('El correo electrónico ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, role, is_active, created_at, updated_at`,
    [input.email.toLowerCase(), passwordHash, input.fullName, input.role]
  );

  return result.rows[0];
}

export async function validateUserCredentials(email: string, password: string): Promise<SafeUser | null> {
  const result = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.is_active, u.created_at, u.updated_at,
            u.tenant_id, t.name AS tenant_name, t.slug AS tenant_slug
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const result = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, u.updated_at,
            u.tenant_id, t.name AS tenant_name, t.slug AS tenant_slug
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<SafeUser | null> {
  const result = await pool.query<UserRow>(
    `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, u.updated_at,
            u.tenant_id, t.name AS tenant_name, t.slug AS tenant_slug
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

