import { Response } from 'express';
import { db } from '../db/index';
import { AuthRequest, recordAuditLog } from '../middleware/auth';

export async function getGrades(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let query = `
      SELECT m.*, s.first_name, s.last_name, s.grade as student_grade, sub.name as subject_name
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
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

    query += ` ORDER BY s.last_name ASC, sub.name ASC`;

    const result = await db.query(query, params);

    const grades = result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: `${row.first_name} ${row.last_name}`,
      subject: row.subject_name,
      term: 'Term 2',
      academicYear: '2026',
      marks: Number(row.score),
      grade: row.grade,
      remarks: row.remarks || 'Satisfactory'
    }));

    return res.json(grades);
  } catch (error: any) {
    console.error('Error fetching grades:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch grades' });
  }
}

export async function updateGrade(req: AuthRequest, res: Response) {
  try {
    const { studentId, subject, marks, remarks } = req.body;

    if (!studentId || !subject || marks === undefined) {
      return res.status(400).json({ error: 'Student ID, subject, and marks are required' });
    }

    const numMarks = Number(marks);
    let letterGrade = 'F';
    if (numMarks >= 85) letterGrade = 'A';
    else if (numMarks >= 70) letterGrade = 'B';
    else if (numMarks >= 60) letterGrade = 'C';
    else if (numMarks >= 50) letterGrade = 'D';

    // Find or create subject
    let subRes = await db.query(`SELECT id FROM subjects WHERE name LIKE ? LIMIT 1`, [`%${subject}%`]);
    let subjectId = subRes.rows[0]?.id;
    if (!subjectId) {
      subjectId = `sub-${Date.now()}`;
      await db.query(`INSERT INTO subjects (id, code, name, category, grade_level) VALUES (?, ?, ?, 'Core', 'All')`,
        [subjectId, subject.slice(0, 3).toUpperCase(), subject]
      );
    }

    const examRes = await db.query(`SELECT id FROM exams LIMIT 1`);
    let examId = examRes.rows[0]?.id;
    if (!examId) {
      examId = 'exam-2026-term2';
      await db.query(`INSERT INTO exams (id, term_id, title, exam_type) VALUES (?, 'term-2026-2', 'Term 2 Mid-Term Evaluation', 'Mid-Term')`,
        [examId]
      );
    }

    const markId = `mrk-${studentId}-${subjectId}`;
    await db.query(
      `INSERT OR REPLACE INTO marks (id, exam_id, student_id, subject_id, score, max_score, grade, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, 100.0, ?, ?, ?)`,
      [markId, examId, studentId, subjectId, numMarks, letterGrade, remarks || 'Evaluated', req.user?.id || 'sys']
    );

    // Recalculate overall GPA for student
    const allMarks = await db.query(`SELECT score FROM marks WHERE student_id = ?`, [studentId]);
    if (allMarks.rows.length > 0) {
      const avg = allMarks.rows.reduce((sum: number, r: any) => sum + Number(r.score), 0) / allMarks.rows.length;
      await db.query(`UPDATE students SET overall_gpa = ? WHERE id = ?`, [Math.round(avg * 10) / 10, studentId]);
    }

    await recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Educator',
      role: req.user?.role || 'teacher',
      action: 'GRADE_UPDATE',
      details: `Recorded mark of ${numMarks}% (${letterGrade}) in ${subject} for student ${studentId}`,
      ipAddress: req.ip
    });

    return res.json({
      message: 'Grade recorded successfully',
      grade: {
        id: markId,
        studentId,
        subject,
        marks: numMarks,
        grade: letterGrade,
        remarks: remarks || 'Evaluated'
      }
    });
  } catch (error: any) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ error: error.message || 'Failed to update grade' });
  }
}
