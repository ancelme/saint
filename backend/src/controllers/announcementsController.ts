import { Response } from 'express';
import { db } from '../db/index';
import { AuthRequest, recordAuditLog } from '../middleware/auth';

export async function getAnnouncements(req: AuthRequest, res: Response) {
  try {
    const result = await db.query(`SELECT * FROM announcements ORDER BY created_at DESC`);

    const announcements = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      targetAudience: row.target_audience || 'All',
      category: row.category || 'General',
      date: (row.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
      author: 'Office of Head Teacher - Emmanuel Twahirwa',
      priority: 'Normal'
    }));

    return res.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch announcements' });
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { title, content, targetAudience, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = `ann-${Date.now()}`;
    await db.query(
      `INSERT INTO announcements (id, author_id, title, content, target_audience, category, is_published)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        req.user?.id || 'sys',
        title.trim(),
        content.trim(),
        targetAudience || 'All',
        category || 'Academic'
      ]
    );

    await recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      role: req.user?.role || 'admin',
      action: 'ANNOUNCEMENT_CREATE',
      details: `Published official announcement: "${title}" to audience: ${targetAudience || 'All'}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Announcement published successfully',
      announcement: {
        id,
        title,
        content,
        targetAudience: targetAudience || 'All',
        category: category || 'Academic',
        date: new Date().toISOString().split('T')[0],
        author: req.user?.fullName || 'School Administration'
      }
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ error: error.message || 'Failed to create announcement' });
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, targetAudience, category } = req.body;

    await db.query(
      `UPDATE announcements
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           target_audience = COALESCE(?, target_audience),
           category = COALESCE(?, category)
       WHERE id = ?`,
      [title ? title.trim() : null, content ? content.trim() : null, targetAudience || null, category || null, id]
    );

    await recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      role: req.user?.role || 'admin',
      action: 'ANNOUNCEMENT_UPDATE',
      details: `Updated announcement ${id}`,
      ipAddress: req.ip
    });

    return res.json({ message: 'Announcement updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update announcement' });
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM announcements WHERE id = ?`, [id]);

    await recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      role: req.user?.role || 'admin',
      action: 'ANNOUNCEMENT_DELETE',
      details: `Deleted announcement ${id}`,
      ipAddress: req.ip
    });

    return res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete announcement' });
  }
}
