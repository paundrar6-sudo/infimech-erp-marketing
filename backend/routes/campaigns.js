const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all campaigns
router.get('/', verifyToken, async (req, res) => {
  const { status } = req.query;

  try {
    let sql = 'SELECT * FROM campaigns WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch campaigns error:', err);
    res.status(500).json({ message: 'Gagal mengambil data kampanye.' });
  }
});

// Create campaign
router.post('/', verifyToken, async (req, res) => {
  const { name, channel, budget, spend, conversion, revenue, status, start_date, end_date } = req.body;

  if (!name || !channel) {
    return res.status(400).json({ message: 'Nama kampanye dan channel wajib diisi.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO campaigns 
       (name, channel, budget, spend, conversion, revenue, status, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        channel, 
        budget || 0.00, 
        spend || 0.00, 
        conversion || 0, 
        revenue || 0.00, 
        status || 'Planned', 
        start_date || null, 
        end_date || null
      ]
    );

    res.status(201).json({
      message: 'Kampanye berhasil ditambahkan.',
      campaignId: result.insertId
    });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ message: 'Gagal membuat kampanye baru.' });
  }
});

// Update campaign details
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, channel, budget, spend, conversion, revenue, status, start_date, end_date } = req.body;

  if (!name || !channel) {
    return res.status(400).json({ message: 'Nama kampanye dan channel wajib diisi.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan.' });
    }

    await pool.query(
      `UPDATE campaigns SET 
        name = ?, channel = ?, budget = ?, spend = ?, 
        conversion = ?, revenue = ?, status = ?, 
        start_date = ?, end_date = ? 
       WHERE id = ?`,
      [
        name, channel, budget, spend, conversion, 
        revenue, status, start_date || null, end_date || null, id
      ]
    );

    res.json({ message: 'Data kampanye berhasil diperbarui.' });
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ message: 'Gagal memperbarui kampanye.' });
  }
});

// Delete campaign
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan.' });
    }

    await pool.query('DELETE FROM campaigns WHERE id = ?', [id]);
    res.json({ message: 'Kampanye berhasil dihapus.' });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ message: 'Gagal menghapus kampanye.' });
  }
});

module.exports = router;
