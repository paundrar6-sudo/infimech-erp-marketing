const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
  });
}

// GET /api/notifications/deadlines
router.get('/deadlines', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.company, c.phone, c.deadline, c.status, c.source,
             u.name as owner_name, u.email as owner_email
      FROM clients c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.deadline IS NOT NULL
        AND c.status NOT IN ('Done', 'Won', 'Lose', 'Loss')
        AND DATE(c.deadline) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      ORDER BY c.deadline ASC
    `);

    if (rows.length > 0 && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = createTransporter();
        const byOwner = {};
        rows.forEach(lead => {
          const email = lead.owner_email || process.env.SMTP_USER;
          if (!byOwner[email]) byOwner[email] = { name: lead.owner_name, leads: [] };
          byOwner[email].leads.push(lead);
        });

        for (const [ownerEmail, data] of Object.entries(byOwner)) {
          const today = new Date().toISOString().split('T')[0];
          const rows_html = data.leads.map(l => {
            const dd = new Date(l.deadline).toISOString().split('T')[0];
            const isToday = dd === today;
            return `<tr>
              <td style="padding:8px;border-bottom:1px solid #333">${l.name}</td>
              <td style="padding:8px;border-bottom:1px solid #333">${l.company || '-'}</td>
              <td style="padding:8px;border-bottom:1px solid #333">${l.status}</td>
              <td style="padding:8px;border-bottom:1px solid #333;color:${isToday?'#ef4444':'#f59e0b'};font-weight:bold">${isToday ? 'HARI INI' : 'BESOK (H-1)'}</td>
              <td style="padding:8px;border-bottom:1px solid #333">${new Date(l.deadline).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</td>
            </tr>`;
          }).join('');

          await transporter.sendMail({
            from: `"ERP Marketing" <${process.env.SMTP_USER}>`,
            to: ownerEmail,
            subject: `Deadline Alert: ${data.leads.length} Prospek Memerlukan Perhatian`,
            html: `<div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:8px;max-width:600px">
              <div style="background:linear-gradient(135deg,#06b6d4,#3b82f6);padding:16px;border-radius:8px;margin-bottom:24px">
                <h2 style="margin:0;color:#fff">Deadline Alert</h2>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.8)">${data.leads.length} prospek deadline mendekati</p>
              </div>
              <p>Halo <b>${data.name || 'Tim Marketing'}</b>,</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead><tr style="background:rgba(255,255,255,0.05)">
                  <th style="padding:8px;text-align:left">Nama</th>
                  <th style="padding:8px;text-align:left">Perusahaan</th>
                  <th style="padding:8px;text-align:left">Stage</th>
                  <th style="padding:8px;text-align:left">Urgensi</th>
                  <th style="padding:8px;text-align:left">Deadline</th>
                </tr></thead>
                <tbody>${rows_html}</tbody>
              </table>
              <p style="margin-top:24px;font-size:12px;color:#64748b">ERP Marketing System</p>
            </div>`
          });
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }

    res.json({ alerts: rows, count: rows.length });
  } catch (err) {
    console.error('Deadline check error:', err);
    res.status(500).json({ message: 'Gagal mengecek deadline.' });
  }
});

module.exports = router;
