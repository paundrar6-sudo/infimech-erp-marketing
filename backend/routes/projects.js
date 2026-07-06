const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all projects with client details
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as client_name, c.company as client_company, c.industry as client_industry, c.phone as client_phone
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Gagal mengambil data proyek.' });
  }
});

// Create project from client
router.post('/', verifyToken, async (req, res) => {
  const { client_id, name, description, budget, status, progress, deadline } = req.body;

  if (!client_id || !name) {
    return res.status(400).json({ message: 'Client ID dan nama proyek wajib diisi.' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO projects (client_id, name, description, budget, status, progress, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      client_id,
      name,
      description || '',
      budget || 0.00,
      status || 'Planning',
      progress || 0,
      deadline || null
    ]);

    // Also auto-update client status to 'Won' or 'Done' if it is not already
    await pool.query("UPDATE clients SET status = IF(status IN ('Won', 'Done'), status, 'Won') WHERE id = ?", [client_id]);

    res.status(201).json({
      message: 'Proyek berhasil dibuat.',
      projectId: result.insertId
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Gagal membuat proyek baru.' });
  }
});

// Update project status, progress or info
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, budget, status, progress, deadline } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama proyek wajib diisi.' });
  }

  try {
    await pool.query(`
      UPDATE projects 
      SET name = ?, description = ?, budget = ?, status = ?, progress = ?, deadline = ?
      WHERE id = ?
    `, [
      name,
      description || '',
      budget || 0.00,
      status || 'Planning',
      progress || 0,
      deadline || null,
      id
    ]);

    // If status is Completed, auto-update the client status to 'Done' if not already
    if (status === 'Completed') {
      const [projectRows] = await pool.query('SELECT client_id FROM projects WHERE id = ?', [id]);
      if (projectRows.length > 0) {
        await pool.query("UPDATE clients SET status = 'Done' WHERE id = ?", [projectRows[0].client_id]);
      }
    }

    res.json({ message: 'Proyek berhasil diperbarui.' });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data proyek.' });
  }
});

// Delete project
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Proyek berhasil dihapus.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Gagal menghapus proyek.' });
  }
});

module.exports = router;
