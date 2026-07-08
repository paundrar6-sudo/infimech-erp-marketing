const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv2092.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u533684840_erpinf',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'Infimech.web123',
  database: process.env.DB_NAME || 'u533684840_erpinfimech',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Allow multi-statement execution for setup
});

async function initializeDatabase() {
  let tempConn;
  try {
    const targetDb = process.env.DB_NAME || 'u533684840_erpinfimech';
    // 1. Connect directly to target database to avoid restricted creation permission errors on shared hosting
    tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'srv2092.hstgr.io',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'u533684840_erpinf',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'Infimech.web123',
      database: targetDb
    });
    
    console.log('✓ Connected to database: ' + targetDb);
    await tempConn.end();

    // 2. Test main connection pool
    const conn = await pool.getConnection();
    console.log('✓ MySQL connection pool established.');

    // 3. Read and run schema sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Clean and split SQL commands by semicolon
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing SQL: ${statement.substring(0, 50)}...`);
          await conn.query(statement);
        }
      }
      console.log('✓ SQL schemas initialized successfully.');
    } else {
      console.log('⚠️ schema.sql not found at ' + schemaPath + ', skipping direct execution.');
    }

    // 3b. Ensure new columns exist on already-created databases (idempotent ALTER)
    const alterStatements = [
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL AFTER name",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS deadline DATE NULL",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT NULL",
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Brosur'",
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS version VARCHAR(50) NOT NULL DEFAULT '1.0'",
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS sharing_status VARCHAR(50) NOT NULL DEFAULT 'Private'",
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS size VARCHAR(50) NOT NULL DEFAULT '2.4 MB'",
      "ALTER TABLE users MODIFY COLUMN role ENUM('Superadmin', 'Admin', 'Digital Marketing', 'Operator') NOT NULL DEFAULT 'Operator'",
      "ALTER TABLE client_contacts CHANGE COLUMN lead_id client_id INT NOT NULL",
      "ALTER TABLE clients MODIFY COLUMN logo_url MEDIUMTEXT NULL",
      "ALTER TABLE assets ADD COLUMN IF NOT EXISTS version_history LONGTEXT NULL",
      "ALTER TABLE assets MODIFY COLUMN file_url LONGTEXT NULL"
    ];
    for (const alt of alterStatements) {
      try { await conn.query(alt); } catch (e) { /* column may already exist */ }
    }

    // 3c. Query and update foreign keys pointing to old 'clients' table to point to 'Client'
    const tablesToMigrate = ['lead_interactions', 'prospect_subtasks', 'projects', 'ClientContact', 'client_contacts'];
    for (const tbl of tablesToMigrate) {
      try {
        const [constraints] = await conn.query(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME = 'clients'
        `, [tbl]);

        for (const row of constraints) {
          const fkName = row.CONSTRAINT_NAME;
          try {
            await conn.query(`ALTER TABLE ${tbl} DROP FOREIGN KEY ${fkName}`);
            console.log(`✓ Dropped foreign key ${fkName} on table ${tbl}`);
          } catch (dropErr) {
            console.log(`⚠️ Failed to drop foreign key ${fkName} on table ${tbl}: ${dropErr.message}`);
          }
        }

        // Add the new constraint pointing to Client table
        const colName = (tbl === 'projects' || tbl === 'client_contacts') ? 'client_id' : (tbl === 'ClientContact' ? 'clientId' : 'lead_id');
        const newFkName = `fk_${tbl}_Client`;
        try {
          await conn.query(`
            ALTER TABLE ${tbl} 
            ADD CONSTRAINT ${newFkName} 
            FOREIGN KEY (${colName}) REFERENCES Client(id) ON DELETE CASCADE
          `);
          console.log(`✓ Created constraint ${newFkName} referencing Client(id) on ${tbl}`);
        } catch (addErr) {
          // It might already exist
          console.log(`ℹ️ Constraint ${newFkName} check on ${tbl}: ${addErr.message}`);
        }
      } catch (err) {
        console.log(`⚠️ Failed to migrate foreign keys for table ${tbl}: ${err.message}`);
      }
    }

    // 4. Seed default data if users table is empty
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      console.log('🌱 Database is empty. Seeding default operators, leads, and marketing campaigns...');
      
      const adminPass = await bcrypt.hash('admin123', 10);
      const barunaPass = await bcrypt.hash('baruna123', 10);
      const marketerPass = await bcrypt.hash('marketing123', 10);
      const operatorPass = await bcrypt.hash('operator123', 10);

      // Seed Users/Operators
      const insertUserSql = `
        INSERT INTO users (name, email, password, phone, role, status, avatar_url) VALUES 
        ('Super Admin', 'admin.@gmail.com', ?, '+6281122334455', 'Superadmin', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SuperAdmin'),
        ('Baruna', 'baruna.work@gmail.com', ?, '+6289988776655', 'Admin', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Baruna'),
        ('Siti Sarah', 'marketing@erp.com', ?, '+6289988776655', 'Digital Marketing', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah'),
        ('Budi Santoso', 'operator@erp.com', ?, '+6287766554433', 'Operator', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Budi')
      `;
      await conn.query(insertUserSql, [adminPass, barunaPass, marketerPass, operatorPass]);

      // Seed Clients/Leads with deadline, notes, and company
      const insertLeadsSql = `
        INSERT INTO clients (name, company, industry, source, last_contact, lead_score, status, value, owner_id, verified, phone, logo_url, location, company_size, deadline, notes) VALUES 
        ('Ahmad Fauzi', 'PT Maju Bersama', 'Technology', 'Instagram Ads', NOW() - INTERVAL 0 DAY, 78, 'Lead', 25000000.00, 3, 1, '+6281122334455', '', 'Jakarta', '50-200', '2026-07-01', 'Tertarik paket enterprise'),
        ('Sari Wulandari', 'CV Kreatif Nusantara', 'E-commerce', 'Referral', NOW() - INTERVAL 0 DAY, 90, 'Proposal', 45000000.00, 3, 1, '+6283245414322', '', 'Bandung', '100-200', '2026-07-15', 'Follow up proposal v2'),
        ('Toguh Prasetyo', 'UD Sumber Rejeki', 'Tourism', 'Google Ads', NOW() - INTERVAL 10 HOUR, 75, 'Hold', 18000000.00, 3, 0, '+6281546708399', '', 'Surabaya', '50-100', '2026-07-10', NULL),
        ('Rizky Pratama', 'Startup Inovasi ID', 'Finance', 'LinkedIn', NOW() - INTERVAL 10 HOUR, 60, 'Loss', 0.00, 3, 0, '+6282234515556', '', 'Jakarta', '200+', NULL, NULL),
        ('Dewi Lestari', 'PT Bintang Timur', 'Energy', 'TikTok Ads', NOW() - INTERVAL 0 DAY, 85, 'Won', 0.00, 3, 1, '+6282349991322', '', 'Medan', '100-200', NULL, 'Kontrak sudah ditandatangani'),
        ('Nurul Hidayah', 'Koperasi Sejahtera', 'FMCG', 'Cold Call', NOW() - INTERVAL 15 HOUR, 50, 'Done', 23000000.00, 3, 0, '+6282827881998', '', 'Semarang', '50-100', NULL, NULL),
        ('Agung Wibowo', 'PT Teknologi Masa Depan', 'Technology', 'Instagram Ads', NOW() - INTERVAL 8 HOUR, 70, 'Lead', 0.00, 3, 1, '+6281731223344', '', 'Yogyakarta', '10-50', '2026-08-01', NULL),
        ('Maya Putri', 'Salon & Spa Premium', 'F&B', 'Referral', NOW() - INTERVAL 0 DAY, 65, 'Proposal', 15000000.00, 3, 0, '+6281945662788', '', 'Bali', '10-50', '2026-07-20', NULL)
      `;
      await conn.query(insertLeadsSql);

      // Seed Client Contacts
      const insertContactsSql = `
        INSERT INTO client_contacts (client_id, name, phone, email) VALUES 
        (1, 'Rina Dewi', '+6281122334455', 'rina@majubersama.com'),
        (2, 'Tenacity Kontan', '+6281548776465', 'tenacity@kontan.com'),
        (3, 'Budi Handoko', '+6282199887766', 'budi@sumberrejeki.com'),
        (5, 'Imam Fatharani', '+6281393144772', 'imam@chandraasr.com')
      `;
      await conn.query(insertContactsSql);

      // Seed Lead Interactions
      const insertInteractionsSql = `
        INSERT INTO lead_interactions (lead_id, type, notes, created_by, created_at) VALUES 
        (1, 'Call', 'Perkenalan produk', 3, NOW() - INTERVAL 1 DAY),
        (1, 'Meeting', 'Presentasi proposal ERP Marketing integration.', 3, NOW() - INTERVAL 6 HOUR),
        (2, 'Email', 'Mengirimkan email perkenalan produk dan e-brochure.', 3, NOW() - INTERVAL 2 DAY),
        (3, 'Call', 'Diskusi harga dan timeline project.', 3, NOW() - INTERVAL 5 DAY),
        (5, 'Meeting', 'Kontrak final ditandatangani.', 3, NOW() - INTERVAL 4 DAY)
      `;
      await conn.query(insertInteractionsSql);

      // Seed Prospect Subtasks
      const insertSubtasksSql = `
        INSERT INTO prospect_subtasks (lead_id, name, description, resource_link, deadline, assigned_to, status, progress, created_by) VALUES
        (1, 'Pre Meeting Online', 'No description', NULL, '2026-05-01', 3, 'MT', 20, 1),
        (1, 'Kirim Proposal v1', 'Draft proposal awal', NULL, '2026-07-05', 3, 'IFR', 50, 1),
        (2, 'Review Kontrak Legal', 'Kontrak harus dicek tim legal', NULL, '2026-07-10', 2, 'EX', 30, 1),
        (5, 'Onboarding Setup', 'Setup akun dan konfigurasi awal', NULL, '2026-07-15', 3, 'IFC', 80, 1),
        (5, 'Training User', 'Training untuk tim marketing klien', NULL, '2026-07-20', 2, 'MT', 0, 1)
      `;
      await conn.query(insertSubtasksSql);

      // Seed Campaigns
      const insertCampaignsSql = `
        INSERT INTO campaigns (name, channel, budget, spend, conversion, revenue, status, start_date, end_date) VALUES 
        ('Ramadhan Big Sale Promo', 'Instagram Ads', 50000000.00, 42000000.00, 480, 180000000.00, 'Active', '2026-03-01', '2026-04-15'),
        ('B2B Enterprise Lead Gen', 'LinkedIn Ads', 80000000.00, 75000000.00, 120, 320000000.00, 'Completed', '2026-01-10', '2026-02-28'),
        ('TikTok Shop Product Launch', 'TikTok Ads', 30000000.00, 12000000.00, 950, 45000000.00, 'Active', '2026-06-01', '2026-07-31'),
        ('Google Search - High Intent CRM', 'Google Ads', 60000000.00, 15000000.00, 210, 150000000.00, 'Active', '2026-05-15', '2026-08-15')
      `;
      await conn.query(insertCampaignsSql);

      // Seed Assets
      const insertAssetsSql = `
        INSERT INTO assets (name, file_type, tags, file_url, download_count, created_by) VALUES 
        ('B2B Marketing Brochure 2026', 'PDF', 'brochure, pdf, sales', '/assets/files/brochure_2026.pdf', 34, 2),
        ('Ramadhan Banner Instagram', 'Image', 'ramadhan, instagram', '/assets/images/ramadhan_ig.png', 112, 2),
        ('Product Teaser Video 15s', 'Video', 'teaser, video, tiktok', '/assets/videos/teaser_15s.mp4', 58, 2)
      `;
      await conn.query(insertAssetsSql);

      // Seed Social Media Posts
      const insertSocialSql = `
        INSERT INTO social_media_posts (platform, content, media_url, schedule_time, status, engagement_likes, engagement_comments, leads_generated) VALUES 
        ('LinkedIn', 'Kolaborasi baru kami dalam penyediaan sistem ERP Marketing terintegrasi!', '/assets/images/collab.jpg', NOW() + INTERVAL 2 DAY, 'Scheduled', 0, 0, 0),
        ('Instagram', 'Promo spesial! Diskon setup fee 50% untuk 10 pendaftar pertama! 🚀', '/assets/images/promo_post.jpg', NOW() - INTERVAL 12 HOUR, 'Published', 145, 12, 18),
        ('TikTok', 'Tips mengelola expense ads agar ROI melesat! #marketingtips', '/assets/videos/tips_tricks.mp4', NOW() - INTERVAL 1 DAY, 'Published', 890, 45, 34)
      `;
      await conn.query(insertSocialSql);

    }
    
    // 5. Idempotent check to ensure the new admin and superadmin users exist, and clean up the old admin@erp.com
    try {
      // Delete old admin@erp.com
      await conn.query("DELETE FROM users WHERE email = 'admin@erp.com'");

      // Ensure admin.@gmail.com exists
      const [adminCheck] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin.@gmail.com']);
      const superadminPass = await bcrypt.hash('admin123', 10);
      if (adminCheck.length === 0) {
        await conn.query(
          "INSERT INTO users (name, email, password, phone, role, status, avatar_url) VALUES ('Super Admin', 'admin.@gmail.com', ?, '+6281122334455', 'Superadmin', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SuperAdmin')",
          [superadminPass]
        );
      } else {
        await conn.query(
          "UPDATE users SET role = 'Superadmin', password = ? WHERE email = ?",
          [superadminPass, 'admin.@gmail.com']
        );
      }

      // Ensure baruna.work@gmail.com exists
      const [barunaCheck] = await conn.query('SELECT id FROM users WHERE email = ?', ['baruna.work@gmail.com']);
      const barunaPass = await bcrypt.hash('baruna123', 10);
      if (barunaCheck.length === 0) {
        await conn.query(
          "INSERT INTO users (name, email, password, phone, role, status, avatar_url) VALUES ('Baruna', 'baruna.work@gmail.com', ?, '+6289988776655', 'Admin', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Baruna')",
          [barunaPass]
        );
      } else {
        await conn.query(
          "UPDATE users SET role = 'Admin', password = ? WHERE email = ?",
          [barunaPass, 'baruna.work@gmail.com']
        );
      }
    } catch (e) {
      console.error('Error upserting admin/superadmin:', e);
    }
    
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    if (tempConn) await tempConn.end();
    throw err;
  }
}

module.exports = {
  pool,
  initializeDatabase
};
