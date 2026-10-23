import { Response } from 'express';
import { db } from '../db/index';
import { AuthRequest } from '../middleware/auth';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { action, role, search, limit = 100 } = req.query;

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (action && action !== 'all') {
      query += ` AND action = ?`;
      params.push(action);
    }

    if (role && role !== 'all') {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      const term = `%${search}%`;
      query += ` AND (user_name LIKE ? OR user_email LIKE ? OR details LIKE ? OR ip_address LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const result = await db.query(query, params);

    const logs = result.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      userName: row.user_name,
      userEmail: row.user_email || 'internal@st-silas.rw',
      role: row.role,
      action: row.action,
      details: row.details,
      ipAddress: row.ip_address || '127.0.0.1',
      device: 'Secure Web Client',
      status: 'Success'
    }));

    return res.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
}
