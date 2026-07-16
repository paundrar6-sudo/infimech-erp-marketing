const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Seed helper for Content & Digital Asset Management
async function checkAndSeedAssets() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM assets');
    // If empty or only has the old 3 seed files, seed the new CFD/FEA assets
    const [cfdCheck] = await pool.query('SELECT COUNT(*) as count FROM assets WHERE name LIKE "%CFD%" OR name LIKE "%FEA%"');
    
    if (cfdCheck[0].count === 0) {
      console.log('🌱 Seeding CFD/FEA marketing assets into Content & Digital Asset Management...');
      
      // Clear old generic assets to prevent clutter
      await pool.query('DELETE FROM assets');
      
      const newAssets = [
        ['Brosur Jasa Simulasi CFD (Fluids)', 'PDF', 'CFD/FEA', 'brosur, cfd, fluids, sales', '/assets/files/brosur_cfd.pdf', 85, '1.2', 'Shared', '4.2 MB', 2],
        ['Brosur Analisis Struktur FEA (Solid)', 'PDF', 'CFD/FEA', 'fea, struktur, solid, sales', '/assets/files/brosur_fea.pdf', 72, '1.0', 'Shared', '3.8 MB', 2],
        ['Case Study: Optimasi Turbin Angin B2B', 'PDF', 'Case Study', 'case study, turbine, wind', '/assets/files/cs_turbine.pdf', 124, '2.0', 'Shared', '5.1 MB', 2],
        ['Case Study: Thermal Comfort Gedung Hijau', 'PDF', 'Case Study', 'case study, hvac, green building', '/assets/files/cs_hvac.pdf', 96, '1.1', 'Shared', '6.2 MB', 2],
        ['Template Proposal Jasa Konsultasi CAE', 'Template', 'Proposal Template', 'proposal, template, docx', '/assets/files/proposal_template_cae.docx', 230, '3.2', 'Shared', '1.8 MB', 2],
        ['Galeri Foto Hasil Render CFD Aerodinamika', 'Image', 'Foto Proyek', 'foto, render, cfd, aerodinamika', '/assets/images/cfd_aero.png', 342, '1.0', 'Shared', '12.4 MB', 2],
        ['Whitepaper: Peran CAE pada Industri Manufaktur', 'PDF', 'Whitepaper', 'whitepaper, cae, manufaktur', '/assets/files/whitepaper_cae.pdf', 145, '1.0', 'Shared', '2.9 MB', 2],
      ];

      for (const asset of newAssets) {
        await pool.query(
          `INSERT INTO assets (name, file_type, category, tags, file_url, download_count, version, sharing_status, size, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          asset
        );
      }
    }
  } catch (err) {
    console.error('Failed to seed assets:', err.message);
  }
}

async function checkAndSeedFolders() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'CFD/FEA',
        description TEXT NULL,
        share_token VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (err) {
    console.error('Create asset_folders table error:', err.message);
  }

  try {
    await pool.query('ALTER TABLE assets ADD COLUMN folder_id INT NULL');
  } catch (err) {
    // Column already exists
  }

  try {
    const [folders] = await pool.query('SELECT COUNT(*) as count FROM asset_folders');
    if (folders[0].count === 0) {
      console.log('🌱 Seeding interactive asset folders...');
      const defaultFolders = [
        ['Brosur & Katalog Jasa CFD/FEA', 'CFD/FEA', 'Kumpulan brosur resmi layanan simulasi fluida & analisis struktur solid untuk klien industri.', 'cfd-catalog-2026'],
        ['Studi Kasus & Proyek Unggulan (Case Studies)', 'Case Study', 'Bukti keberhasilan proyek optimasi turbin angin & efisiensi HVAC gedung hijau.', 'case-studies-b2b'],
        ['Template Proposal & Penawaran Komersial', 'Proposal Template', 'Format standar penawaran jasa konsultasi CAE & simulasi teknik.', 'cae-proposals'],
        ['Galeri Hasil Render & Aerodinamika', 'Foto Proyek', 'Dokumentasi visual streamline & analisis kontur tekanan aerodinamika CFD.', 'cfd-gallery-aero'],
        ['Whitepaper & Riset CAE Manufaktur', 'Whitepaper', 'Kajian teknis mendalam penerapan CAE pada industri manufaktur modern.', 'cae-whitepapers']
      ];

      for (const f of defaultFolders) {
        await pool.query(
          'INSERT INTO asset_folders (name, category, description, share_token) VALUES (?, ?, ?, ?)',
          f
        );
      }
    }

    // Link existing assets to their corresponding folders if folder_id is null
    const [allFolders] = await pool.query('SELECT id, category FROM asset_folders');
    for (const folder of allFolders) {
      await pool.query('UPDATE assets SET folder_id = ? WHERE category = ? AND folder_id IS NULL', [folder.id, folder.category]);
    }
  } catch (err) {
    console.error('Seed asset folders error:', err.message);
  }
}

// GET public shared folder portal (No auth required)
router.get('/folders/share/:token', async (req, res) => {
  const { token } = req.params;
  await checkAndSeedAssets();
  await checkAndSeedFolders();

  try {
    const [folders] = await pool.query('SELECT * FROM asset_folders WHERE share_token = ? OR id = ?', [token, token]);
    if (folders.length === 0) {
      return res.status(404).json({ message: 'Folder tidak ditemukan atau tautan tidak berlaku.' });
    }
    const folder = folders[0];
    const [assets] = await pool.query('SELECT * FROM assets WHERE folder_id = ? OR category = ? ORDER BY created_at DESC', [folder.id, folder.category]);
    folder.assets = assets;
    res.json(folder);
  } catch (err) {
    console.error('Fetch public shared folder error:', err);
    res.status(500).json({ message: 'Gagal mengambil data folder yang dibagikan.' });
  }
});

// GET all asset folders with file items
router.get('/folders', verifyToken, async (req, res) => {
  await checkAndSeedAssets();
  await checkAndSeedFolders();

  try {
    const [folders] = await pool.query('SELECT * FROM asset_folders ORDER BY id ASC');
    const [assets] = await pool.query('SELECT * FROM assets ORDER BY created_at DESC');
    for (const folder of folders) {
      folder.assets = assets.filter(a => a.folder_id === folder.id || (!a.folder_id && a.category === folder.category));
      folder.item_count = folder.assets.length;
    }
    res.json(folders);
  } catch (err) {
    console.error('Fetch folders error:', err);
    res.status(500).json({ message: 'Gagal mengambil data folder aset.' });
  }
});

// POST create new folder (optionally with initial uploaded files)
router.post('/folders', verifyToken, async (req, res) => {
  const { name, category, description, files } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama folder wajib diisi.' });
  }

  try {
    try { await pool.query('SET SESSION max_allowed_packet = 104857600'); } catch (e) {}

    const shareToken = `fld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const [result] = await pool.query(
      'INSERT INTO asset_folders (name, category, description, share_token) VALUES (?, ?, ?, ?)',
      [name, category || 'CFD/FEA', description || '', shareToken]
    );
    const folderId = result.insertId;

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        try {
          await pool.query(
            `INSERT INTO assets (name, file_type, category, tags, file_url, download_count, version, sharing_status, size, created_by, folder_id) 
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [
              file.name || 'Dokumen',
              file.file_type || 'PDF',
              category || 'CFD/FEA',
              file.tags || '',
              file.file_url || '',
              file.version || '1.0',
              'Shared',
              file.size || '1.5 MB',
              req.user?.id || 1,
              folderId
            ]
          );
        } catch (fileErr) {
          console.error(`Insert initial file ${file.name} to folder ${folderId} error:`, fileErr.message);
        }
      }
    }

    res.status(201).json({ message: 'Folder berhasil dibuat.', folderId, shareToken });
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ message: 'Gagal membuat folder.' });
  }
});

// POST upload files into existing folder
router.post('/folders/:folderId/files', verifyToken, async (req, res) => {
  const { folderId } = req.params;
  const { files } = req.body;

  try {
    try { await pool.query('SET SESSION max_allowed_packet = 104857600'); } catch (e) {}

    const [folders] = await pool.query('SELECT * FROM asset_folders WHERE id = ?', [folderId]);
    const folderCat = folders[0]?.category || 'CFD/FEA';

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        try {
          await pool.query(
            `INSERT INTO assets (name, file_type, category, tags, file_url, download_count, version, sharing_status, size, created_by, folder_id) 
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [
              file.name || 'Dokumen',
              file.file_type || 'PDF',
              folderCat,
              file.tags || '',
              file.file_url || '',
              file.version || '1.0',
              'Shared',
              file.size || '1.5 MB',
              req.user?.id || 1,
              folderId
            ]
          );
        } catch (fileErr) {
          console.error(`Insert file ${file.name} to folder ${folderId} error:`, fileErr.message);
        }
      }
    }

    res.status(201).json({ message: 'File berhasil ditambahkan ke folder.' });
  } catch (err) {
    console.error('Add files to folder error:', err);
    res.status(500).json({ message: 'Gagal menambahkan file ke folder.' });
  }
});

// DELETE folder
router.delete('/folders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM assets WHERE folder_id = ?', [id]);
    await pool.query('DELETE FROM asset_folders WHERE id = ?', [id]);
    res.json({ message: 'Folder berhasil dihapus.' });
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ message: 'Gagal menghapus folder.' });
  }
});

// Get all assets with filter
router.get('/', verifyToken, async (req, res) => {
  const { search, file_type, category } = req.query;

  await checkAndSeedAssets();
  await checkAndSeedFolders();

  try {
    let sql = `
      SELECT a.*, u.name as creator_name 
      FROM assets a 
      LEFT JOIN User u ON a.created_by = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (file_type) {
      sql += ' AND a.file_type = ?';
      params.push(file_type);
    }
    if (category) {
      sql += ' AND a.category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (a.name LIKE ? OR a.tags LIKE ? OR a.category LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY a.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch assets error:', err);
    res.status(500).json({ message: 'Gagal mengambil data aset.' });
  }
});

// Create new asset
router.post('/', verifyToken, async (req, res) => {
  const { name, file_type, category, tags, file_url, version, sharing_status, size } = req.body;

  if (!name || !file_type) {
    return res.status(400).json({ message: 'Nama aset dan tipe file wajib diisi.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO assets (name, file_type, category, tags, file_url, download_count, version, sharing_status, size, created_by) 
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        name, 
        file_type, 
        category || 'Brosur', 
        tags || '', 
        file_url || '/assets/files/placeholder.pdf',
        version || '1.0',
        sharing_status || 'Private',
        size || '1.5 MB',
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Aset berhasil ditambahkan.',
      assetId: result.insertId
    });
  } catch (err) {
    console.error('Create asset error:', err);
    res.status(500).json({ message: 'Gagal mengupload/menambahkan aset.' });
  }
});

function incrementVersion(currentVersion) {
  if (!currentVersion) return '1.1';
  const match = currentVersion.match(/^(v?)(\d+)\.(\d+)(.*)$/i);
  if (match) {
    const prefix = match[1];
    const major = parseInt(match[2], 10);
    const minor = parseInt(match[3], 10) + 1;
    const suffix = match[4];
    return `${prefix}${major}.${minor}${suffix}`;
  }
  const singleNumMatch = currentVersion.match(/^(v?)(\d+)(.*)$/i);
  if (singleNumMatch) {
    const prefix = singleNumMatch[1];
    const num = parseInt(singleNumMatch[2], 10) + 1;
    const suffix = singleNumMatch[3];
    return `${prefix}${num}${suffix}`;
  }
  return currentVersion + '.1';
}

// Update asset
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, file_type, category, tags, file_url, version, sharing_status, size } = req.body;

  if (!name || !file_type) {
    return res.status(400).json({ message: 'Nama aset dan tipe file wajib diisi.' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }

    const oldAsset = existing[0];
    let newVersion = version || oldAsset.version || '1.0';
    let historyJson = oldAsset.version_history || '[]';

    // If file_url changed, automatically push old version into history and increment version!
    if (file_url && oldAsset.file_url && file_url !== oldAsset.file_url) {
      let history = [];
      try {
        history = JSON.parse(historyJson);
        if (!Array.isArray(history)) history = [];
      } catch (e) {
        history = [];
      }

      history.push({
        version: oldAsset.version || '1.0',
        file_url: oldAsset.file_url,
        size: oldAsset.size || '1.5 MB',
        uploaded_at: oldAsset.updated_at || oldAsset.created_at || new Date()
      });

      historyJson = JSON.stringify(history);
      
      // Auto-increment version if it wasn't explicitly changed to something new in req.body
      if (!version || version === oldAsset.version) {
        newVersion = incrementVersion(oldAsset.version || '1.0');
      }
    }

    await pool.query(
      `UPDATE assets 
       SET name = ?, file_type = ?, category = ?, tags = ?, file_url = ?, version = ?, sharing_status = ?, size = ?, version_history = ? 
       WHERE id = ?`,
      [name, file_type, category || 'Brosur', tags, file_url, newVersion, sharing_status || 'Private', size || '1.5 MB', historyJson, id]
    );

    res.json({ message: 'Aset berhasil diperbarui.', version: newVersion });
  } catch (err) {
    console.error('Update asset error:', err);
    res.status(500).json({ message: 'Gagal memperbarui aset.' });
  }
});

// Trigger download/share increment
router.post('/:id/download', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT id FROM assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }

    await pool.query('UPDATE assets SET download_count = download_count + 1 WHERE id = ?', [id]);
    
    // Fetch updated count
    const [rows] = await pool.query('SELECT download_count FROM assets WHERE id = ?', [id]);
    res.json({ message: 'Download/Share tercatat.', download_count: rows[0].download_count });
  } catch (err) {
    console.error('Increment download count error:', err);
    res.status(500).json({ message: 'Gagal mencatat statistik unduh.' });
  }
});

// Delete asset
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT id FROM assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }

    await pool.query('DELETE FROM assets WHERE id = ?', [id]);
    res.json({ message: 'Aset berhasil dihapus.' });
  } catch (err) {
    console.error('Delete asset error:', err);
    res.status(500).json({ message: 'Gagal menghapus aset.' });
  }
});

// Public GET asset details for secure sharing (NO verifyToken required)
router.get('/public/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name as creator_name 
       FROM assets a
       LEFT JOIN User u ON a.created_by = u.id
       WHERE a.id = ? AND a.sharing_status = 'Shared'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan atau status berbagi dinonaktifkan.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch public asset error:', err);
    res.status(500).json({ message: 'Gagal mengambil data aset publik.' });
  }
});

// Public POST download increment (NO verifyToken required)
router.post('/public/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT id FROM assets WHERE id = ? AND sharing_status = "Shared"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan atau status berbagi dinonaktifkan.' });
    }

    await pool.query('UPDATE assets SET download_count = download_count + 1 WHERE id = ?', [id]);
    const [rows] = await pool.query('SELECT download_count FROM assets WHERE id = ?', [id]);
    res.json({ message: 'Download tercatat.', download_count: rows[0].download_count });
  } catch (err) {
    console.error('Increment public download count error:', err);
    res.status(500).json({ message: 'Gagal mencatat statistik unduh.' });
  }
});

module.exports = router;

