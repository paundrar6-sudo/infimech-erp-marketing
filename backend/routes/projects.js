const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all projects with client details (mapping Prospect to frontend expected project format)
router.get('/', verifyToken, async (req, res) => {
  const { status, search } = req.query;

  try {
    let sql = `
      SELECT 
        p.no_project as id, 
        p.no_project, 
        p.name_project as name, 
        p.name_project, 
        p.client_name as company,
        p.client_name, 
        COALESCE(NULLIF(p.contact_name, ''), c.contact_pic) as contact_name, 
        CASE 
          WHEN UPPER(p.status) = 'LEAD' THEN 'Lead'
          WHEN UPPER(p.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(p.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(p.status) = 'WON' THEN 'Won'
          WHEN UPPER(p.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        p.createdAt as created_at,
        p.createdAt, 
        p.updatedAt, 
        p.\`order\`, 
        p.last_contact_date as last_contact,
        p.last_contact_date,
        c.contact_phone as phone,
        c.contact_email as email,
        c.lead_source as source,
        c.industry,
        c.logo as logo_url,
        c.is_verified as verified,
        0 as value,
        100 as lead_score
      FROM Prospect p
      LEFT JOIN Client c ON p.client_name = c.name
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      if (status === 'Lead') {
        sql += " AND UPPER(p.status) = 'LEAD'";
      } else if (status === 'Proposal') {
        sql += " AND UPPER(p.status) = 'PROPOSAL'";
      } else if (status === 'Hold') {
        sql += " AND UPPER(p.status) = 'HOLD'";
      } else if (status === 'Lose' || status === 'Loss') {
        sql += " AND (UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS')";
      } else if (status === 'Won') {
        sql += " AND UPPER(p.status) = 'WON'";
      } else if (status === 'Done') {
        sql += " AND UPPER(p.status) = 'DONE'";
      } else {
        sql += ' AND p.status = ?';
        params.push(status);
      }
    }

    if (search) {
      sql += ' AND (p.name_project LIKE ? OR p.client_name LIKE ? OR p.contact_name LIKE ? OR p.no_project LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY p.createdAt DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Gagal mengambil data proyek.' });
  }
});

// Get single project details (mapping Prospect to frontend details format)
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.no_project as id, 
        p.no_project, 
        p.name_project as name, 
        p.name_project, 
        p.client_name as company,
        p.client_name, 
        COALESCE(NULLIF(p.contact_name, ''), c.contact_pic) as contact_name, 
        CASE 
          WHEN UPPER(p.status) = 'LEAD' THEN 'Lead'
          WHEN UPPER(p.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(p.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(p.status) = 'WON' THEN 'Won'
          WHEN UPPER(p.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        p.createdAt as created_at,
        p.createdAt, 
        p.updatedAt, 
        p.\`order\`, 
        p.last_contact_date as last_contact,
        p.last_contact_date,
        c.contact_phone as phone,
        c.contact_email as email,
        c.lead_source as source,
        c.industry,
        c.logo as logo_url,
        c.is_verified as verified,
        0 as value,
        100 as lead_score,
        c.id as client_real_id
      FROM Prospect p
      LEFT JOIN Client c ON p.client_name = c.name
      WHERE p.no_project = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Prospek tidak ditemukan.' });
    }

    const lead = rows[0];

    let interactions = [];
    if (lead.client_real_id) {
      const [interactRows] = await pool.query(
        `SELECT i.*, u.name as creator_name, CONCAT('https://api.dicebear.com/7.x/adventurer/svg?seed=', COALESCE(u.name, u.username, 'Admin')) as creator_avatar 
          FROM lead_interactions i 
          LEFT JOIN User u ON i.created_by = u.id 
          WHERE i.lead_id = ? 
          ORDER BY i.created_at DESC`,
         [lead.client_real_id]
      );
      interactions = interactRows;
    }

    res.json({
      lead,
      interactions,
      contacts: []
    });
  } catch (err) {
    console.error('Fetch project details error:', err);
    res.status(500).json({ message: 'Gagal mengambil detail prospek.' });
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

  const final_no_project = no_project || id || `imx-${Date.now()}`;
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

    const [result] = await pool.query(`
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

    const newId = result.insertId;
    let computed_no_project = final_no_project;
    if (!computed_no_project || computed_no_project.startsWith('PRJ-') || computed_no_project.startsWith('imx-') || computed_no_project.startsWith('IMX-')) {
      computed_no_project = `${newId}.imx-${Date.now().toString().substr(-4)}`;
      await pool.query('UPDATE Prospect SET no_project = ? WHERE id = ?', [computed_no_project, newId]);
    }

    res.status(201).json({
      message: 'Proyek berhasil dibuat.',
      projectId: computed_no_project,
      no_project: computed_no_project
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
