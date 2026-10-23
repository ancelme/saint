import { Response } from 'express';
import { db } from '../db/index';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const result = await db.query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user?.id]
    );

    return res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type || 'info',
      isRead: Boolean(Number(row.is_read)),
      createdAt: row.created_at
    })));
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const notification = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [id, req.user?.id]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, req.user?.id]
    );

    return res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
}
