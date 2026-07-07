const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all projects with client details (mapping Prospect to frontend expected project format)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        no_project as id, 
        no_project, 
        name_project as name, 
        name_project, 
        client_name, 
        contact_name, 
        status, 
        createdAt, 
        updatedAt, 
        \`order\`, 
        last_contact_date
      FROM Prospect
      ORDER BY createdAt DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Gagal mengambil data proyek.' });
  }
});

// Create project / prospect
router.post('/', verifyToken, async (req, res) => {
  const { 
    no_project, 
    id, 
    name_project, 
    name, 
    client_name, 
    client_id, 
    contact_name, 
    status, 
    order, 
    last_contact_date 
  } = req.body;

  const final_no_project = no_project || id || `PRJ-${Date.now()}`;
  const final_name_project = name_project || name;
  const final_client_name = client_name || client_id;

  if (!final_no_project || !final_name_project || !final_client_name) {
    return res.status(400).json({ message: 'No proyek, nama proyek, dan nama client wajib diisi.' });
  }

  try {
    const final_contact_name = contact_name || '';
    const final_status = status || 'LEAD';
    const final_order = order || 0;
    const final_last_contact = last_contact_date || null;

    await pool.query(`
      INSERT INTO Prospect (no_project, name_project, client_name, contact_name, status, createdAt, updatedAt, \`order\`, last_contact_date)
      VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3), ?, ?)
    `, [
      final_no_project,
      final_name_project,
      final_client_name,
      final_contact_name,
      final_status,
      final_order,
      final_last_contact
    ]);

    res.status(201).json({
      message: 'Proyek berhasil dibuat.',
      projectId: final_no_project,
      no_project: final_no_project
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Gagal membuat proyek baru.' });
  }
});

// Update project status, progress or info
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { 
    name_project, 
    name, 
    client_name, 
    contact_name, 
    status, 
    order, 
    last_contact_date 
  } = req.body;

  try {
    // Fetch current record
    const [existing] = await pool.query('SELECT * FROM Prospect WHERE no_project = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Proyek tidak ditemukan.' });
    }

    const current = existing[0];
    const final_name_project = name_project !== undefined ? name_project : (name !== undefined ? name : current.name_project);
    const final_client_name = client_name !== undefined ? client_name : current.client_name;
    const final_contact_name = contact_name !== undefined ? contact_name : current.contact_name;
    const final_status = status !== undefined ? status : current.status;
    const final_order = order !== undefined ? order : current.order;
    const final_last_contact = last_contact_date !== undefined ? last_contact_date : current.last_contact_date;

    await pool.query(`
      UPDATE Prospect 
      SET name_project = ?, client_name = ?, contact_name = ?, status = ?, updatedAt = NOW(3), \`order\` = ?, last_contact_date = ?
      WHERE no_project = ?
    `, [
      final_name_project,
      final_client_name,
      final_contact_name,
      final_status,
      final_order,
      final_last_contact,
      id
    ]);

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
    await pool.query('DELETE FROM Prospect WHERE no_project = ?', [id]);
    res.json({ message: 'Proyek berhasil dihapus.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Gagal menghapus proyek.' });
  }
});

module.exports = router;
