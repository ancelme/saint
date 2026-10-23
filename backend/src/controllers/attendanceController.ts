import { Response } from 'express';
import { db } from '../db/index';
import { AuthRequest, recordAuditLog } from '../middleware/auth';

export async function getAttendance(req: AuthRequest, res: Response) {
  try {
    const { date, classId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let query = `
      SELECT a.*, s.first_name, s.last_name, s.grade, s.admission_number, p.user_id as parent_user_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userRole === 'parent') {
      query += ` AND (p.user_id = ? OR EXISTS (
        SELECT 1 FROM parent_students ps
        JOIN parents linked_parent ON linked_parent.id = ps.parent_id
        WHERE ps.student_id = s.id AND linked_parent.user_id = ?
      ))`;
      params.push(userId, userId);
    } else if (userRole === 'student') {
      query += ` AND (LOWER(s.first_name) = LOWER(?) OR LOWER(s.admission_number) = LOWER(?))`;
      params.push(req.user?.username || '', req.user?.username || '');
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (classId) {
      query += ` AND a.class_id = ?`;
      params.push(classId);
    }

    query += ` ORDER BY a.date DESC, s.last_name ASC`;

    const result = await db.query(query, params);

    const records = result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: `${row.first_name} ${row.last_name}`,
      grade: row.grade,
      date: row.date,
      status: row.status,
      remarks: row.remarks || undefined
    }));

    return res.json(records);
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch attendance' });
  }
}

export async function saveAttendance(req: AuthRequest, res: Response) {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Array of attendance records is required' });
    }

    for (const item of records) {
      const { studentId, date, status, remarks } = item;
      const classRes = await db.query(`SELECT class_id FROM students WHERE id = ?`, [studentId]);
      const classId = classRes.rows[0]?.class_id || 'cls-p5-a';
      const recordId = `att-${studentId}-${date}`;

      // Insert or replace attendance
      await db.query(
        `INSERT OR REPLACE INTO attendance (id, student_id, class_id, date, status, remarks, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recordId, studentId, classId, date, status, remarks || '', req.user?.id || 'sys']
      );

      // Recalculate attendance rate for student
      const stats = await db.query(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
         FROM attendance WHERE student_id = ?`,
        [studentId]
      );
      const totalDays = Number(stats.rows[0]?.total || 1);
      const presentDays = Number(stats.rows[0]?.present || 1);
      const rate = Math.round((presentDays / totalDays) * 100);

      await db.query(`UPDATE students SET attendance_rate = ? WHERE id = ?`, [rate, studentId]);
    }

    await recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Educator',
      role: req.user?.role || 'teacher',
      action: 'ATTENDANCE_RECORD',
      details: `Submitted roll-call attendance for ${records.length} pupils on ${records[0]?.date}`,
      ipAddress: req.ip
    });

    return res.json({ message: 'Attendance records saved successfully' });
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    return res.status(500).json({ error: error.message || 'Failed to save attendance' });
  }
}
