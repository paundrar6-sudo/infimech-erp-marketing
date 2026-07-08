const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const roleMap = {
  1: 'Superadmin',
  2: 'Admin',
  3: 'Digital Marketing',
  4: 'Operator'
};

const roleIdMap = {
  'Superadmin': 1,
  'Admin': 2,
  'Digital Marketing': 3,
  'Operator': 4
};

// Get all operators and summaries
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, name, email, roleId, is_approved, createdAt FROM User ORDER BY roleId ASC, name ASC'
    );
    
    // Map roleId and is_approved to strings for frontend compatibility
    const mappedOperators = rows.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name || u.username,
      email: u.email,
      phone: '', // Placeholder to prevent frontend reference errors
      role: roleMap[u.roleId] || 'Operator',
      status: u.is_approved ? 'Active' : 'Inactive',
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.name || u.username)}`,
      created_at: u.createdAt
    }));

    // Calculate simple stats
    const stats = {
      total: mappedOperators.length,
      active: mappedOperators.filter(u => u.status === 'Active').length,
      inactive: mappedOperators.filter(u => u.status !== 'Active').length,
      superadmin: mappedOperators.filter(u => u.role === 'Superadmin').length,
      admin: mappedOperators.filter(u => u.role === 'Admin').length,
      marketing: mappedOperators.filter(u => u.role === 'Digital Marketing').length,
      operator: mappedOperators.filter(u => u.role === 'Operator').length
    };

    res.json({
      operators: mappedOperators,
      stats
    });
  } catch (err) {
    console.error('Fetch operators error:', err);
    res.status(500).json({ message: 'Gagal mengambil daftar operator.' });
  }
});

// Add operator (Admin only)
router.post('/', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
  const { name, username, email, password, role } = req.body;

  const finalUsername = username || email?.split('@')[0] || '';
  if (!name || !finalUsername || !password || !role) {
    return res.status(400).json({ message: 'Nama, username, password, dan role wajib diisi.' });
  }

  try {
    // Check if email or username already exists
    const [existing] = await pool.query(
      'SELECT id FROM User WHERE email = ? OR username = ?', 
      [email || null, finalUsername]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email atau Username sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = roleIdMap[role] || 4;

    const [result] = await pool.query(
      'INSERT INTO User (username, name, email, password, roleId, is_approved, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW(3), NOW(3))',
      [finalUsername, name, email || null, hashedPassword, roleId]
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
router.put('/:id', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
  const { id } = req.params;
  const { name, username, email, role, status, password } = req.body;

  const finalUsername = username || email?.split('@')[0] || '';
  if (!name || !finalUsername || !role || !status) {
    return res.status(400).json({ message: 'Nama, username, role, dan status wajib diisi.' });
  }

  try {
    // Check uniqueness for other users
    const [existing] = await pool.query(
      'SELECT id FROM User WHERE (email = ? OR username = ?) AND id != ?', 
      [email || null, finalUsername, id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email atau Username sudah terdaftar pada user lain.' });
    }

    const roleId = roleIdMap[role] || 4;
    const isApproved = (status === 'Active') ? 1 : 0;

    let updateSql = 'UPDATE User SET name = ?, username = ?, email = ?, roleId = ?, is_approved = ?, updatedAt = NOW(3)';
    let queryParams = [name, finalUsername, email || null, roleId, isApproved];

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
router.delete('/:id', verifyToken, requireRole(['Superadmin', 'Admin']), async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  try {
    await pool.query('DELETE FROM User WHERE id = ?', [id]);
    res.json({ message: 'Operator berhasil dihapus.' });
  } catch (err) {
    console.error('Delete operator error:', err);
    res.status(500).json({ message: 'Gagal menghapus operator.' });
  }
});

module.exports = router;
