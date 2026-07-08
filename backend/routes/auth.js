const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

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

// Login operator (accepts username OR email as identifier)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email/Username dan password wajib diisi.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM User WHERE email = ? OR username = ?', [email, email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Email/Username atau password salah.' });
    }

    const user = rows[0];
    if (user.is_approved !== 1) {
      return res.status(403).json({ message: 'Akun operator ini dinonaktifkan.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email/Username atau password salah.' });
    }

    // Map DB values to frontend expectations
    user.role = roleMap[user.roleId] || 'Operator';
    user.status = 'Active';

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'marketing_erp_secret_key_123!@#',
      { expiresIn: '24h' }
    );

    // Exclude password in response
    const { password: _, ...userData } = user;

    res.json({
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// Get current profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, roleId, is_approved, createdAt FROM User WHERE id = ?', 
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    
    const user = rows[0];
    user.role = roleMap[user.roleId] || 'Operator';
    user.status = user.is_approved ? 'Active' : 'Inactive';
    
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Gagal mengambil data profil.' });
  }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  const { name, username, password } = req.body;
  const userId = req.user.id;

  try {
    let updateSql = 'UPDATE User SET name = ?, username = ?, updatedAt = NOW(3)';
    let queryParams = [name, username || req.user.username];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSql += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateSql += ' WHERE id = ?';
    queryParams.push(userId);

    await pool.query(updateSql, queryParams);

    // Fetch updated user
    const [rows] = await pool.query(
      'SELECT id, name, username, email, roleId, is_approved FROM User WHERE id = ?', 
      [userId]
    );
    
    const user = rows[0];
    user.role = roleMap[user.roleId] || 'Operator';
    user.status = user.is_approved ? 'Active' : 'Inactive';

    res.json({ message: 'Profil berhasil diperbarui.', user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data profil.' });
  }
});

module.exports = router;
