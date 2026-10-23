import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? ''
    : 'st_silas_primary_school_jwt_secret_key_2026_rwanda'
);

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV is production.');
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
  status?: string;
  mustChangePassword?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(payload: {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
  mustChangePassword?: boolean;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateSocketToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const userResult = await db.query(
      `SELECT id, username, email, full_name, role, status, is_active, must_change_password FROM users WHERE id = ?`,
      [decoded.id],
    );
    const user = userResult.rows[0];
    if (!user || user.is_active === 0 || user.status === 'Inactive') return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      status: user.status,
      mustChangePassword: Number(user.must_change_password) === 1,
    };
  } catch {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Check if user still exists and is active in database
    const userResult = await db.query(
      `SELECT id, username, email, full_name, role, status, is_active, must_change_password FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }

    const dbUser = userResult.rows[0];
    if (dbUser.is_active === 0 || dbUser.status === 'Inactive') {
      return res.status(403).json({ error: 'This account has been deactivated by the School Owner.' });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      fullName: dbUser.full_name,
      status: dbUser.status,
      mustChangePassword: Number(dbUser.must_change_password) === 1,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication session' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Super Admin / Owner has sovereign access to all modules
    if (req.user.role === 'owner' || req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Authorized roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

export function requireOwnerOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  if (req.user.role !== 'owner' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden: Super Admin / School Owner authorization strictly required for this operation.'
    });
  }

  next();
}

export async function recordAuditLog(params: {
  userId?: string;
  userName: string;
  userEmail?: string;
  role: string;
  action: string;
  details: string;
  ipAddress?: string;
}) {
  try {
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await db.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_email, role, action, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId || null,
        params.userName,
        params.userEmail || null,
        params.role,
        params.action,
        params.details,
        params.ipAddress || '127.0.0.1',
        now
      ]
    );
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}
