const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all leads with filtering & searching
router.get('/', verifyToken, async (req, res) => {
  const { status, industry, search, source } = req.query;

  try {
    let sql = `
      SELECT 
        c.id,
        c.name as company,
        c.name,
        c.contact_pic as name,
        c.contact_pic,
        c.contact_phone as phone,
        c.contact_phone,
        c.contact_email,
        c.industry,
        c.link,
        c.logo as logo_url,
        c.logo,
        c.lead_source as source,
        c.lead_source,
        CASE 
          WHEN UPPER(c.status) = 'LEAD' OR UPPER(c.status) = 'ACTIVE' THEN 'Lead'
          WHEN UPPER(c.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(c.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(c.status) = 'LOSS' OR UPPER(c.status) = 'LOSE' OR UPPER(c.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(c.status) = 'WON' THEN 'Won'
          WHEN UPPER(c.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        c.createdAt as created_at,
        c.createdAt,
        c.updatedAt,
        c.last_contact_date as last_contact,
        c.last_contact_date,
        c.is_verified as verified,
        c.is_verified,
        0 as value,
        100 as lead_score,
        NULL as owner_id,
        NULL as owner_name,
        NULL as owner_avatar,
        NULL as deadline,
        NULL as notes,
        li.notes as last_contact_notes,
        li.created_by_name as last_contact_name,
        NULL as last_contact_phone
      FROM Client c 
      LEFT JOIN (
        SELECT li2.lead_id, li2.notes, li2.created_at, u2.name as created_by_name
        FROM lead_interactions li2
        LEFT JOIN users u2 ON li2.created_by = u2.id
        WHERE li2.id = (
          SELECT MAX(li3.id) FROM lead_interactions li3 WHERE li3.lead_id = li2.lead_id
        )
      ) li ON li.lead_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      if (status === 'Lead') {
        sql += " AND (UPPER(c.status) = 'LEAD' OR UPPER(c.status) = 'ACTIVE')";
      } else if (status === 'Proposal') {
        sql += " AND UPPER(c.status) = 'PROPOSAL'";
      } else if (status === 'Hold') {
        sql += " AND UPPER(c.status) = 'HOLD'";
      } else if (status === 'Lose' || status === 'Loss') {
        sql += " AND (UPPER(c.status) = 'LOSS' OR UPPER(c.status) = 'LOSE' OR UPPER(c.status) = 'REAL_LOSS')";
      } else if (status === 'Won') {
        sql += " AND UPPER(c.status) = 'WON'";
      } else if (status === 'Done') {
        sql += " AND UPPER(c.status) = 'DONE'";
      } else {
        sql += ' AND c.status = ?';
        params.push(status);
      }
    }
    if (industry) {
      sql += ' AND c.industry = ?';
      params.push(industry);
    }
    if (source) {
      sql += ' AND c.lead_source = ?';
      params.push(source);
    }
    if (search) {
      sql += ' AND (c.name LIKE ? OR c.contact_pic LIKE ? OR c.industry LIKE ? OR c.contact_phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY c.createdAt DESC, c.name ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch leads error:', err);
    res.status(500).json({ message: 'Gagal mengambil data leads.' });
  }
});

// Get customer segmentation counts & details
router.get('/segments', verifyToken, async (req, res) => {
  try {
    const [highScore] = await pool.query('SELECT COUNT(*) as count FROM Client WHERE is_verified = 1');
    const [enterprise] = await pool.query('SELECT COUNT(*) as count FROM Client WHERE 1=0');
    const [digital] = await pool.query("SELECT COUNT(*) as count FROM Client WHERE lead_source IN ('Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads')");
    const [inactive] = await pool.query("SELECT COUNT(*) as count FROM Client WHERE last_contact_date < NOW() - INTERVAL 7 DAY OR last_contact_date IS NULL");
    const [ptAccounts] = await pool.query("SELECT COUNT(*) as count FROM Client WHERE name LIKE 'PT%' OR name LIKE '% PT %'");
    const [proposalStage] = await pool.query("SELECT COUNT(*) as count FROM Client WHERE UPPER(status) = 'PROPOSAL'");

    res.json([
      {
        id: 'high-score',
        title: 'High Score Hot Leads',
        criteria: 'Lead Terverifikasi',
        count: highScore[0].count,
        color: 'var(--primary-glow)'
      },
      {
        id: 'enterprise-tier',
        title: 'Enterprise Accounts',
        criteria: 'Estimasi Nilai >= Rp 200jt',
        count: enterprise[0].count,
        color: 'var(--accent-cyan)'
      },
      {
        id: 'digital-ads',
        title: 'Digital Ads Traffic',
        criteria: 'Source via Facebook/Google/TikTok/IG Ads',
        count: digital[0].count,
        color: 'var(--accent-purple)'
      },
      {
        id: 'dormant-leads',
        title: 'Dormant Leads (Need Follow-up)',
        criteria: 'Belum kontak > 7 hari',
        count: inactive[0].count,
        color: 'var(--accent-orange)'
      },
      {
        id: 'pt-accounts',
        title: 'PT / Corporate Accounts',
        criteria: 'Nama Perusahaan mengandung "PT"',
        count: ptAccounts[0].count,
        color: 'var(--accent-green)'
      },
      {
        id: 'proposal-stage',
        title: 'Proposal Stage Accounts',
        criteria: 'Status Lead adalah "Proposal"',
        count: proposalStage[0].count,
        color: 'var(--accent-cyan)'
      }
    ]);
  } catch (err) {
    console.error('Get segments error:', err);
    res.status(500).json({ message: 'Gagal mengambil data segmentasi.' });
  }
});

// Get dynamic list of industries and sources for filter dropdowns
router.get('/meta', verifyToken, async (req, res) => {
  try {
    const [industries] = await pool.query('SELECT DISTINCT industry FROM Client WHERE industry IS NOT NULL AND industry != ""');
    const [sources] = await pool.query('SELECT DISTINCT lead_source as source FROM Client WHERE lead_source IS NOT NULL AND lead_source != ""');
    
    res.json({
      industries: industries.map(row => row.industry),
      sources: sources.map(row => row.source)
    });
  } catch (err) {
    console.error('Fetch leads metadata error:', err);
    res.status(500).json({ message: 'Gagal mengambil dropdown metadata.' });
  }
});

// Get details and interaction history for a specific lead
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [leads] = await pool.query(
      `SELECT 
        c.id,
        c.name as company,
        c.name,
        c.contact_pic as name,
        c.contact_pic,
        c.contact_phone as phone,
        c.contact_phone,
        c.contact_email,
        c.industry,
        c.link,
        c.logo as logo_url,
        c.logo,
        c.lead_source as source,
        c.lead_source,
        CASE 
          WHEN UPPER(c.status) = 'LEAD' OR UPPER(c.status) = 'ACTIVE' THEN 'Lead'
          WHEN UPPER(c.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(c.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(c.status) = 'LOSS' OR UPPER(c.status) = 'LOSE' OR UPPER(c.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(c.status) = 'WON' THEN 'Won'
          WHEN UPPER(c.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        c.createdAt as created_at,
        c.createdAt,
        c.updatedAt,
        c.last_contact_date as last_contact,
        c.last_contact_date,
        c.is_verified as verified,
        c.is_verified,
        0 as value,
        100 as lead_score,
        NULL as owner_id,
        NULL as owner_name,
        NULL as owner_email,
        NULL as owner_avatar,
        NULL as deadline,
        NULL as notes
       FROM Client c 
       WHERE c.id = ?`, 
      [id]
    );

    if (leads.length === 0) {
      return res.status(404).json({ message: 'Lead tidak ditemukan.' });
    }

    const [interactions] = await pool.query(
      `SELECT i.*, u.name as creator_name, u.avatar_url as creator_avatar 
       FROM lead_interactions i 
       LEFT JOIN users u ON i.created_by = u.id 
       WHERE i.lead_id = ? 
       ORDER BY i.created_at DESC`,
      [id]
    );

    const [contacts] = await pool.query(
      `SELECT 
        id, 
        clientId as client_id, 
        clientId, 
        name, 
        email, 
        phone, 
        position, 
        isPrimary 
       FROM ClientContact 
       WHERE clientId = ? 
       ORDER BY isPrimary DESC, id ASC`,
      [id]
    );

    res.json({
      lead: leads[0],
      interactions,
      contacts
    });
  } catch (err) {
    console.error('Fetch lead details error:', err);
    res.status(500).json({ message: 'Gagal mengambil detail lead.' });
  }
});

// Add contact to a lead
router.post('/:id/contacts', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, position, isPrimary } = req.body;
  if (!name) return res.status(400).json({ message: 'Nama kontak wajib diisi.' });

  try {
    await pool.query(
      'INSERT INTO ClientContact (clientId, name, phone, email, position, isPrimary) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, phone || '', email || '', position || null, isPrimary ? 1 : 0]
    );
    res.status(201).json({ message: 'Kontak berhasil ditambahkan.' });
  } catch (err) {
    console.error('Create contact error:', err);
    res.status(500).json({ message: 'Gagal menambahkan kontak.' });
  }
});

// Delete contact
router.delete('/contacts/:contactId', verifyToken, async (req, res) => {
  const { contactId } = req.params;
  try {
    await pool.query('DELETE FROM ClientContact WHERE id = ?', [contactId]);
    res.json({ message: 'Kontak berhasil dihapus.' });
  } catch (err) {
    console.error('Delete contact error:', err);
    res.status(500).json({ message: 'Gagal menghapus kontak.' });
  }
});

// Create new lead
router.post('/', verifyToken, async (req, res) => {
  const { 
    name, company, industry, source, lead_score, status, value, owner_id, verified, phone, logo_url, deadline, notes,
    contact1_name, contact1_phone, contact2_name, contact2_phone
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama klien wajib diisi.' });
  }

  if (!contact1_name || !contact1_name.trim() || !contact1_phone || !contact1_phone.trim()) {
    return res.status(400).json({ message: 'Kontak utama (Nama & No. Telepon) wajib diisi.' });
  }

  try {
    const defaultLogo = logo_url || `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const clientPhone = phone || contact1_phone || '';
    
    // c.name is the company name, c.contact_pic is the contact person name.
    const final_name = company || name || '';
    const contactPic = name || '';

    const [result] = await pool.query(
      `INSERT INTO Client 
       (name, contact_pic, contact_phone, contact_email, industry, link, logo, lead_source, status, last_contact_date, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        final_name, 
        contactPic,
        clientPhone,
        '', 
        industry || 'Other', 
        '', 
        defaultLogo,
        source || 'Organic', 
        status || 'Lead', 
        verified ? 1 : 0
      ]
    );

    const client_id = result.insertId;

    // Automatically save contact 1 as primary (mandatory)
    await pool.query(
      'INSERT INTO ClientContact (clientId, name, phone, email, isPrimary) VALUES (?, ?, ?, "", 1)',
      [client_id, contact1_name, contact1_phone]
    );

    // Save contact 2 as secondary (optional, if name is provided)
    if (contact2_name && contact2_name.trim() !== '') {
      await pool.query(
        'INSERT INTO ClientContact (clientId, name, phone, email, isPrimary) VALUES (?, ?, ?, "", 0)',
        [client_id, contact2_name, contact2_phone || '']
      );
    }

    // Automatically create an initial interaction log
    await pool.query(
      'INSERT INTO lead_interactions (lead_id, type, notes, created_by) VALUES (?, "Note", "Lead baru ditambahkan ke sistem.", ?)',
      [client_id, req.user.id]
    );

    res.status(201).json({
      message: 'Lead berhasil ditambahkan.',
      leadId: client_id
    });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ message: 'Gagal menambahkan lead baru.' });
  }
});

// Update lead status (specifically for Kanban updates)
router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Lead', 'Proposal', 'Hold', 'Loss', 'Lose', 'Won', 'Done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  try {
    const [oldRows] = await pool.query('SELECT status FROM Client WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ message: 'Lead tidak ditemukan.' });
    }
    const oldStatus = oldRows[0].status;

    await pool.query(
      'UPDATE Client SET status = ?, last_contact_date = NOW() WHERE id = ?',
      [status, id]
    );

    // Insert interaction logs for history trail
    await pool.query(
      'INSERT INTO lead_interactions (lead_id, type, notes, created_by) VALUES (?, "Note", ?, ?)',
      [id, `Status diubah dari [${oldStatus}] menjadi [${status}].`, req.user.id]
    );

    res.json({ message: 'Status lead berhasil diperbarui.' });
  } catch (err) {
    console.error('Update lead status error:', err);
    res.status(500).json({ message: 'Gagal mengubah status lead.' });
  }
});

// Update full lead details
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { 
    name, company, industry, source, lead_score, status, value, owner_id, verified, phone, logo_url, deadline, notes,
    contact1_name, contact1_phone, contact2_name, contact2_phone
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama klien wajib diisi.' });
  }

  if (!contact1_name || !contact1_name.trim() || !contact1_phone || !contact1_phone.trim()) {
    return res.status(400).json({ message: 'Kontak utama (Nama & No. Telepon) wajib diisi.' });
  }

  try {
    const [oldRows] = await pool.query('SELECT status FROM Client WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ message: 'Lead tidak ditemukan.' });
    }

    const defaultLogo = logo_url || `https://logo.clearbit.com/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const clientPhone = phone || contact1_phone || '';
    
    // c.name is the company name, c.contact_pic is the contact person name.
    const final_name = company || name || '';
    const contactPic = name || '';

    await pool.query(
      `UPDATE Client SET 
        name = ?, contact_pic = ?, contact_phone = ?, industry = ?, lead_source = ?, 
        logo = ?, status = ?, is_verified = ?, last_contact_date = NOW()
       WHERE id = ?`,
      [
        final_name, contactPic, clientPhone, industry, source, 
        defaultLogo, status, verified ? 1 : 0, id
      ]
    );

    // Sync client contacts
    const [existingContacts] = await pool.query(
      'SELECT id FROM ClientContact WHERE clientId = ? ORDER BY isPrimary DESC, id ASC',
      [id]
    );

    // 1. Update/Insert contact 1 (primary)
    if (existingContacts.length > 0) {
      const contact1_id = existingContacts[0].id;
      await pool.query(
        'UPDATE ClientContact SET name = ?, phone = ?, isPrimary = 1 WHERE id = ?',
        [contact1_name, contact1_phone, contact1_id]
      );
    } else {
      await pool.query(
        'INSERT INTO ClientContact (clientId, name, phone, email, isPrimary) VALUES (?, ?, ?, "", 1)',
        [id, contact1_name, contact1_phone]
      );
    }

    // 2. Update/Insert/Delete contact 2 (secondary)
    if (existingContacts.length > 1) {
      const contact2_id = existingContacts[1].id;
      if (contact2_name && contact2_name.trim() !== '') {
        await pool.query(
          'UPDATE ClientContact SET name = ?, phone = ?, isPrimary = 0 WHERE id = ?',
          [contact2_name, contact2_phone || '', contact2_id]
        );
      } else {
        await pool.query('DELETE FROM ClientContact WHERE id = ?', [contact2_id]);
      }
    } else {
      if (contact2_name && contact2_name.trim() !== '') {
        await pool.query(
          'INSERT INTO ClientContact (clientId, name, phone, email, isPrimary) VALUES (?, ?, ?, "", 0)',
          [id, contact2_name, contact2_phone || '']
        );
      }
    }

    res.json({ message: 'Data lead berhasil diperbarui.' });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data lead.' });
  }
});

// Delete lead
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM Client WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead tidak ditemukan.' });
    }

    await pool.query('DELETE FROM Client WHERE id = ?', [id]);
    res.json({ message: 'Lead berhasil dihapus.' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ message: 'Gagal menghapus lead.' });
  }
});

// Add interaction note to a lead
router.post('/:id/interactions', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { type, notes } = req.body;

  if (!type || !notes) {
    return res.status(400).json({ message: 'Tipe dan isi catatan wajib diisi.' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM Client WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead tidak ditemukan.' });
    }

    await pool.query(
      'INSERT INTO lead_interactions (lead_id, type, notes, created_by) VALUES (?, ?, ?, ?)',
      [id, type, notes, req.user.id]
    );

    // Update last_contact on lead
    await pool.query('UPDATE Client SET last_contact_date = NOW() WHERE id = ?', [id]);

    res.status(201).json({ message: 'Catatan interaksi berhasil ditambahkan.' });
  } catch (err) {
    console.error('Create interaction note error:', err);
    res.status(500).json({ message: 'Gagal menambahkan catatan interaksi.' });
  }
});

// ========================================
// Prospect Subtasks CRUD
// ========================================

// Get subtasks for a lead
router.get('/:id/subtasks', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [subtasks] = await pool.query(
      `SELECT s.*, u1.name as assigned_name, u2.name as creator_name
       FROM prospect_subtasks s
       LEFT JOIN users u1 ON s.assigned_to = u1.id
       LEFT JOIN users u2 ON s.created_by = u2.id
       WHERE s.lead_id = ?
       ORDER BY s.created_at DESC`,
      [id]
    );
    res.json(subtasks);
  } catch (err) {
    console.error('Fetch subtasks error:', err);
    res.status(500).json({ message: 'Gagal mengambil subtasks.' });
  }
});

// Create subtask
router.post('/:id/subtasks', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, resource_link, deadline, assigned_to } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama subtask wajib diisi.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO prospect_subtasks (lead_id, name, description, resource_link, deadline, assigned_to, status, progress, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'MT', 0, ?)`,
      [id, name, description || null, resource_link || null, deadline || null, assigned_to || null, req.user.id]
    );
    res.status(201).json({ message: 'Subtask berhasil ditambahkan.', subtaskId: result.insertId });
  } catch (err) {
    console.error('Create subtask error:', err);
    res.status(500).json({ message: 'Gagal menambahkan subtask.' });
  }
});

// Update subtask
router.put('/subtasks/:subtaskId', verifyToken, async (req, res) => {
  const { subtaskId } = req.params;
  const { name, description, resource_link, deadline, assigned_to, status, progress } = req.body;

  try {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (resource_link !== undefined) { fields.push('resource_link = ?'); params.push(resource_link); }
    if (deadline !== undefined) { fields.push('deadline = ?'); params.push(deadline || null); }
    if (assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(assigned_to || null); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (progress !== undefined) { fields.push('progress = ?'); params.push(progress); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data untuk diperbarui.' });
    }

    params.push(subtaskId);
    await pool.query(`UPDATE prospect_subtasks SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Subtask berhasil diperbarui.' });
  } catch (err) {
    console.error('Update subtask error:', err);
    res.status(500).json({ message: 'Gagal memperbarui subtask.' });
  }
});

// Delete subtask
router.delete('/subtasks/:subtaskId', verifyToken, async (req, res) => {
  const { subtaskId } = req.params;
  try {
    await pool.query('DELETE FROM prospect_subtasks WHERE id = ?', [subtaskId]);
    res.json({ message: 'Subtask berhasil dihapus.' });
  } catch (err) {
    console.error('Delete subtask error:', err);
    res.status(500).json({ message: 'Gagal menghapus subtask.' });
  }
});

module.exports = router;
