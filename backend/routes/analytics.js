const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper to seed initial sample activity logs if table empty
async function seedSampleActivityLogs() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM user_activity_logs');
    if (rows[0].count === 0) {
      console.log('🌱 Seeding initial User Activity Logs for Real-time Analytics...');
      const logs = [
        [1, 'superadmin', 'Super Admin Utama', 'Superadmin', 'Membuka Modul SEO Marketing', 'marketing', '/digital-marketing/seo'],
        [2, 'operator1', 'Budi Santoso', 'Operator', 'Melakukan Akses Katalog Brosur', 'marketing', '/digital-marketing/assets'],
        [2, 'operator1', 'Budi Santoso', 'Operator', 'Membuat Config SEO Produk', 'marketing', '/digital-marketing/seo'],
        [3, 'admin_marketing', 'Siti Rahma', 'Admin', 'Meninjau Analytics Marketing', 'dashboard', '/dashboard'],
        [1, 'superadmin', 'Super Admin Utama', 'Superadmin', 'Membuat Campaign Google Ads', 'marketing', '/digital-marketing/campaigns'],
        [4, 'operator2', 'Deni Wijaya', 'Operator', 'Input Prospect Lead Baru', 'crm', '/operator-crm'],
        [3, 'admin_marketing', 'Siti Rahma', 'Admin', 'Export Laporan SEO Assets', 'marketing', '/digital-marketing/seo']
      ];

      for (const log of logs) {
        await pool.query(
          `INSERT INTO user_activity_logs (user_id, username, name, role, action, module, page_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          log
        );
      }
    }
  } catch (err) {
    console.error('Error seeding activity logs:', err.message);
  }
}

// POST Log Visit / Action (Triggered on client navigation or periodic heartbeat)
router.post('/log-visit', verifyToken, async (req, res) => {
  await seedSampleActivityLogs();
  try {
    const { action, module: modName, page_url } = req.body;
    const userId = req.user ? req.user.id : null;
    const username = req.user ? (req.user.username || req.user.email || 'user') : 'guest';
    const name = req.user ? (req.user.name || username) : 'Tamu';
    const role = req.user ? (req.user.role || 'Operator') : 'Operator';

    await pool.query(
      `INSERT INTO user_activity_logs (user_id, username, name, role, action, module, page_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, name, role, action || 'Membuka Halaman Web Marketing', modName || 'marketing', page_url || '/']
    );

    res.json({ status: 'success', message: 'Activity logged successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET Real-Time Analytics (Usage Percentages, Visit Frequencies, Online Users)
router.get('/realtime-stats', verifyToken, async (req, res) => {
  await seedSampleActivityLogs();
  try {
    // 1. Total Visits Today & Total Logged Activities
    const [todayCount] = await pool.query(
      `SELECT COUNT(*) as count FROM user_activity_logs WHERE DATE(created_at) = CURDATE()`
    );

    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM user_activity_logs`
    );

    // 2. User Visit Frequency (Top active users & frequency count)
    const [userFrequency] = await pool.query(`
      SELECT 
        username,
        name,
        role,
        COUNT(*) as total_visits,
        MAX(created_at) as last_active,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_activity_logs)), 1) as usage_percentage
      FROM user_activity_logs
      GROUP BY username, name, role
      ORDER BY total_visits DESC
    `);

    // 3. Admin vs User Usage Share Breakdown (%)
    const [roleBreakdown] = await pool.query(`
      SELECT 
        role,
        COUNT(*) as total_actions,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_activity_logs)), 1) as percentage
      FROM user_activity_logs
      GROUP BY role
      ORDER BY total_actions DESC
    `);

    // 4. Active Sessions (Users active within the last 15 minutes)
    // FIX: GROUP BY hanya per user (bukan per user+page_url+action),
    // supaya 1 orang yang buka banyak halaman tetap dihitung 1 "online",
    // bukan dianggap beberapa sesi terpisah.
    const [activeUsers] = await pool.query(`
      SELECT 
        user_id, username, name, role, 
        MAX(created_at) as last_seen,
        SUBSTRING_INDEX(GROUP_CONCAT(page_url ORDER BY created_at DESC SEPARATOR '|||'), '|||', 1) as page_url,
        SUBSTRING_INDEX(GROUP_CONCAT(action ORDER BY created_at DESC SEPARATOR '|||'), '|||', 1) as action
      FROM user_activity_logs
      WHERE created_at >= NOW() - INTERVAL 15 MINUTE
      GROUP BY user_id, username, name, role
      ORDER BY last_seen DESC
    `);

    // 5. Recent Live Logs Feed (Last 10 events)
    const [recentLogs] = await pool.query(`
      SELECT id, username, name, role, action, module, page_url, created_at
      FROM user_activity_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      status: 'success',
      data: {
        todayVisits: todayCount[0].count,
        totalVisits: totalCount[0].count,
        userFrequency,
        roleBreakdown,
        activeUsersCount: Math.max(activeUsers.length, 1),
        activeUsers,
        recentLogs
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;