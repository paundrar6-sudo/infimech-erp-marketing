const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// Login operator
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const user = rows[0];
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Akun operator ini dinonaktifkan.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
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
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Gagal mengambil data profil.' });
  }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  const { name, phone, password, avatar_url } = req.body;
  const userId = req.user.id;

  try {
    let updateSql = 'UPDATE users SET name = ?, phone = ?, avatar_url = ?';
    let queryParams = [name, phone, avatar_url];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateSql += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateSql += ' WHERE id = ?';
    queryParams.push(userId);

    await pool.query(updateSql, queryParams);

    // Fetch updated user
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, avatar_url FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Profil berhasil diperbarui.', user: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data profil.' });
  }
});

module.exports = router;
