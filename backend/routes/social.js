const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all social media posts
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_media_posts ORDER BY schedule_time ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch social posts error:', err);
    res.status(500).json({ message: 'Gagal mengambil jadwal postingan.' });
  }
});

// Create/Schedule social media post
router.post('/', verifyToken, async (req, res) => {
  const { platform, content, media_url, schedule_time, status } = req.body;

  if (!platform || !content || !schedule_time) {
    return res.status(400).json({ message: 'Platform, konten caption, dan waktu rilis wajib diisi.' });
  }

  try {
    // Generate some randomized initial mockup stats if published immediately, or keep as 0
    const isPublished = status === 'Published';
    const likes = isPublished ? Math.floor(Math.random() * 200) + 10 : 0;
    const comments = isPublished ? Math.floor(Math.random() * 30) + 2 : 0;
    const leads = isPublished ? Math.floor(Math.random() * 15) : 0;

    const [result] = await pool.query(
      `INSERT INTO social_media_posts 
       (platform, content, media_url, schedule_time, status, engagement_likes, engagement_comments, leads_generated) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        platform, 
        content, 
        media_url || null, 
        schedule_time, 
        status || 'Draft', 
        likes, 
        comments, 
        leads
      ]
    );

    res.status(201).json({
      message: 'Postingan berhasil dijadwalkan.',
      postId: result.insertId
    });
  } catch (err) {
    console.error('Create social post error:', err);
    res.status(500).json({ message: 'Gagal menjadwalkan postingan.' });
  }
});

// Update social media post
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { platform, content, media_url, schedule_time, status, engagement_likes, engagement_comments, leads_generated } = req.body;

  if (!platform || !content || !schedule_time) {
    return res.status(400).json({ message: 'Platform, konten caption, dan waktu rilis wajib diisi.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM social_media_posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
    }

    await pool.query(
      `UPDATE social_media_posts SET 
        platform = ?, content = ?, media_url = ?, schedule_time = ?, 
        status = ?, engagement_likes = ?, engagement_comments = ?, leads_generated = ? 
       WHERE id = ?`,
      [
        platform, content, media_url, schedule_time, 
        status, engagement_likes || 0, engagement_comments || 0, leads_generated || 0, id
      ]
    );

    res.json({ message: 'Jadwal postingan berhasil diperbarui.' });
  } catch (err) {
    console.error('Update social post error:', err);
    res.status(500).json({ message: 'Gagal memperbarui jadwal postingan.' });
  }
});

// Delete scheduled post
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT id FROM social_media_posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
    }

    await pool.query('DELETE FROM social_media_posts WHERE id = ?', [id]);
    res.json({ message: 'Postingan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete social post error:', err);
    res.status(500).json({ message: 'Gagal menghapus postingan.' });
  }
});

module.exports = router;
