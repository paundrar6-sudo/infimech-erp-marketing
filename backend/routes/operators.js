const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all operators and summaries
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users ORDER BY role ASC, name ASC'
    );
    
    // Calculate simple stats: active counts and allocation
    const stats = {
      total: rows.length,
      active: rows.filter(u => u.status === 'Active').length,
      inactive: rows.filter(u => u.status !== 'Active').length,
      admin: rows.filter(u => u.role === 'Admin').length,
      marketing: rows.filter(u => u.role === 'Digital Marketing').length,
      operator: rows.filter(u => u.role === 'Operator').length
    };

    res.json({
      operators: rows,
      stats
    });
  } catch (err) {
    console.error('Fetch operators error:', err);
    res.status(500).json({ message: 'Gagal mengambil daftar operator.' });
  }
});

// Add operator (Admin only)
router.post('/', verifyToken, requireRole(['Admin']), async (req, res) => {
  const { name, email, password, phone, role, avatar_url } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Nama, email, password, dan role wajib diisi.' });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role, status, avatar_url) VALUES (?, ?, ?, ?, ?, "Active", ?)',
      [name, email, hashedPassword, phone || '', role, avatar]
    );

    res.status(201).json({
      message: 'Operator berhasil ditambahkan.',
      operatorId: result.insertId
    });
  } catch (err) {
    console.error('Create operator error:', err);
    res.status(500).json({ message: 'Gagal menambahkan operator baru.' });
  }
});

// Update operator status/details (Admin only)
router.put('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, status, password, avatar_url } = req.body;

  if (!name || !email || !role || !status) {
    return res.status(400).json({ message: 'Nama, email, role, dan status wajib diisi.' });
  }

  try {
    // Check email uniqueness for other users
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar pada user lain.' });
    }

    let updateSql = 'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, avatar_url = ?';
    let queryParams = [name, email, phone || '', role, status, avatar_url];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSql += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateSql += ' WHERE id = ?';
    queryParams.push(id);

    await pool.query(updateSql, queryParams);

    res.json({ message: 'Data operator berhasil diperbarui.' });
  } catch (err) {
    console.error('Update operator error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data operator.' });
  }
});

// Delete operator (Admin only)
router.delete('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Operator berhasil dihapus.' });
  } catch (err) {
    console.error('Delete operator error:', err);
    res.status(500).json({ message: 'Gagal menghapus operator.' });
  }
});

module.exports = router;
