const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Default Preset SEO per Tipe Konten Marketing
const SEO_PRESETS = [
  {
    contentType: 'Landing Page (Jasa & Solusi)',
    titleTemplate: '[Nama Jasa/Produk] Presisi Tinggi | [Nama Perusahaan]',
    descriptionTemplate: 'Layanan [Nama Jasa] profesional dengan garansi presisi & waktu pengerjaan efisien. Konsultasi kebutuhan industri Anda secara gratis bersama engineer kami.',
    searchIntent: 'Transactional',
    schemaType: 'Service',
    metaRobots: 'index, follow',
    ogType: 'website',
    focusKeyword: 'jasa simulasi cfd dan fea',
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Jasa Simulasi CFD & Analisis FEA",
      "provider": {
        "@type": "Organization",
        "name": "Infimech Engineering"
      },
      "areaServed": "Indonesia",
      "description": "Layanan konsultasi teknik simulasi mekanika fluida (CFD) dan struktur (FEA)"
    }
  },
  {
    contentType: 'Studi Kasus (Case Study B2B)',
    titleTemplate: 'Studi Kasus: [Judul Proyek Prospek] | Success Story [Nama Perusahaan]',
    descriptionTemplate: 'Pelajari bagaimana kami membantu [Nama Klien/Industri] menghemat biaya prototyping hingga [XX]% dengan teknologi simulasi teknik modern.',
    searchIntent: 'Commercial',
    schemaType: 'Article',
    metaRobots: 'index, follow',
    ogType: 'article',
    focusKeyword: 'case study cfd hvac gedung',
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Optimasi Aerodinamika & Thermal Gedung Hijau",
      "author": {
        "@type": "Organization",
        "name": "Infimech Research Team"
      }
    }
  },
  {
    contentType: 'Whitepaper & Riset Teknik',
    titleTemplate: 'Whitepaper: [Topik Riset] Industri Manufaktur | Download Gratis',
    descriptionTemplate: 'Unduh laporan riset teknis mendalam tentang optimasi [Topik] dan efisiensi energi industri modern. Dapatkan wawasan berharga untuk tim R&D Anda.',
    searchIntent: 'Informational',
    schemaType: 'Article',
    metaRobots: 'index, follow',
    ogType: 'article',
    focusKeyword: 'whitepaper simulasi cae manufaktur',
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Kajian Peran CAE pada Industri Manufaktur Modern"
    }
  },
  {
    contentType: 'Katalog & Download Asset',
    titleTemplate: 'Katalog Brosur & Spesifikasi [Kategori Asset] | [Nama Perusahaan]',
    descriptionTemplate: 'Unduh brosur resmi, lembar spesifikasi teknis, dan portofolio lengkap layanan [Kategori] kami langsung dalam format PDF.',
    searchIntent: 'Navigational',
    schemaType: 'Product',
    metaRobots: 'index, follow',
    ogType: 'product',
    focusKeyword: 'katalog brosur cfd fea pdf',
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Katalog Brosur Layanan CAE 2026",
      "category": "Marketing Assets"
    }
  }
];

// Helper to seed sample SEO configs if table empty
async function seedDefaultSeoConfigs() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM seo_configs');
    if (rows[0].count === 0) {
      console.log('🌱 Seeding initial SEO Configurations...');
      const sampleConfigs = [
        [
          'Jasa Simulasi CFD & Analisis FEA Industri',
          'Landing Page (Jasa & Solusi)',
          'Jasa Simulasi CFD & Analisis FEA Presisi Tinggi | Infimech',
          'Dapatkan analisis simulasi mekanika fluida CFD & FEA presisi tinggi untuk industri manufaktur. Konsultasi gratis & garansi optimasi desain.',
          'jasa simulasi cfd dan fea',
          'Transactional',
          'Service',
          JSON.stringify(SEO_PRESETS[0].schemaJson),
          'Jasa Simulasi CFD & Analisis FEA Presisi Tinggi | Infimech',
          'Dapatkan analisis simulasi mekanika fluida CFD & FEA presisi tinggi untuk industri manufaktur.',
          'https://infimech.co.id/assets/images/cfd_aero.png',
          'website',
          'index, follow',
          'https://infimech.co.id/services/cfd-fea',
          92,
          1
        ],
        [
          'Case Study: Optimasi HVAC Gedung Hijau',
          'Studi Kasus (Case Study B2B)',
          'Case Study: Optimasi HVAC & Thermal Comfort Gedung | Infimech',
          'Pelajari bagaimana simulasi CFD kami meningkatkan efisiensi sistem HVAC gedung hingga 35% dan menghemat beban listrik chiller.',
          'case study cfd hvac gedung',
          'Commercial',
          'Article',
          JSON.stringify(SEO_PRESETS[1].schemaJson),
          'Case Study: Optimasi HVAC Gedung Hijau | Infimech',
          'Pelajari bagaimana simulasi CFD kami meningkatkan efisiensi sistem HVAC gedung hingga 35%.',
          'https://infimech.co.id/assets/images/hvac_case.png',
          'article',
          'index, follow',
          'https://infimech.co.id/case-study/hvac-building',
          88,
          1
        ]
      ];

      for (const cfg of sampleConfigs) {
        await pool.query(
          `INSERT INTO seo_configs 
           (title, content_type, meta_title, meta_description, focus_keyword, search_intent, schema_type, schema_json, og_title, og_description, og_image, og_type, meta_robots, canonical_url, score, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          cfg
        );
      }
    }
  } catch (err) {
    console.error('Error seeding SEO configs:', err.message);
  }
}

// GET Preset options & template guidance
router.get('/presets', (req, res) => {
  res.json({
    status: 'success',
    presets: SEO_PRESETS,
    searchIntents: [
      { key: 'Informational', label: 'Informational (Pengguna mencari ilmu/artikel)', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { key: 'Commercial', label: 'Commercial Investigation (Pengguna membandingkan vendor/solusi)', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      { key: 'Transactional', label: 'Transactional (Pengguna siap beli / minta penawaran)', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { key: 'Navigational', label: 'Navigational (Pengguna mencari brand/spesifik)', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    ],
    schemaTypes: [
      { key: 'Organization', label: 'Organization (Profil Perusahaan / Brand Utama)' },
      { key: 'Service', label: 'Service (Jasa Konsultasi / Simulasi Teknik)' },
      { key: 'Product', label: 'Product (Katalog Asset / Software / Brosur)' },
      { key: 'Article', label: 'Article / Blog (Case Study & Whitepaper)' },
      { key: 'FAQPage', label: 'FAQ Page (Tanya Jawab Seputar Layanan)' }
    ],
    robotsDirectives: [
      { key: 'index, follow', label: 'index, follow (Sangat Direkomendasikan - Muncul di Google & Link Di-crawl)' },
      { key: 'noindex, follow', label: 'noindex, follow (Sembunyikan Halaman tapi Ikuti Link)' },
      { key: 'noindex, nofollow', label: 'noindex, nofollow (Privat / Hanya Internal Admin)' }
    ]
  });
});

// GET Marketing Assets list for 1-click SEO generation
router.get('/marketing-assets', verifyToken, async (req, res) => {
  try {
    const [assets] = await pool.query(`
      SELECT id, name, category, file_type, tags, file_url 
      FROM assets 
      ORDER BY id DESC
    `);
    res.json({ status: 'success', data: assets });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST Smart Automatic SEO Generator
router.post('/auto-generate', verifyToken, async (req, res) => {
  try {
    const { topic, contentType, assetId, customKeyword } = req.body;
    
    let baseTitle = topic || 'Jasa Simulasi Engineering & Optimasi Design';
    let baseCategory = contentType || 'Landing Page (Jasa & Solusi)';
    let assetObj = null;

    if (assetId) {
      const [rows] = await pool.query('SELECT * FROM assets WHERE id = ?', [assetId]);
      if (rows.length > 0) {
        assetObj = rows[0];
        baseTitle = assetObj.name;
        if (assetObj.category) {
          if (assetObj.category.includes('Case Study')) baseCategory = 'Studi Kasus (Case Study B2B)';
          else if (assetObj.category.includes('Whitepaper')) baseCategory = 'Whitepaper & Riset Teknik';
          else if (assetObj.category.includes('Brosur') || assetObj.category.includes('PDF')) baseCategory = 'Katalog & Download Asset';
        }
      }
    }

    // Clean & extract slug
    const cleanTitle = baseTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const slug = cleanTitle.toLowerCase().replace(/\s+/g, '-');

    // Extract keyword
    let focusKw = customKeyword ? customKeyword.trim().toLowerCase() : '';
    if (!focusKw) {
      if (cleanTitle.toLowerCase().includes('cfd')) focusKw = 'jasa simulasi cfd dan fea';
      else if (cleanTitle.toLowerCase().includes('fea') || cleanTitle.toLowerCase().includes('struktur')) focusKw = 'analisis struktur fea industri';
      else if (cleanTitle.toLowerCase().includes('hvac') || cleanTitle.toLowerCase().includes('building')) focusKw = 'simulasi hvac thermal gedung';
      else if (cleanTitle.toLowerCase().includes('turbin') || cleanTitle.toLowerCase().includes('wind')) focusKw = 'simulasi aerodinamika turbin angin';
      else focusKw = cleanTitle.toLowerCase().slice(0, 35);
    }

    // Determine Intent & Schema
    let searchIntent = 'Transactional';
    let schemaType = 'Service';
    let ogType = 'website';
    let metaRobots = 'index, follow';

    if (baseCategory.includes('Studi Kasus')) {
      searchIntent = 'Commercial';
      schemaType = 'Article';
      ogType = 'article';
    } else if (baseCategory.includes('Whitepaper')) {
      searchIntent = 'Informational';
      schemaType = 'Article';
      ogType = 'article';
    } else if (baseCategory.includes('Katalog')) {
      searchIntent = 'Navigational';
      schemaType = 'Product';
      ogType = 'product';
    }

    // Generate Optimized Meta Title (target 50-60 chars)
    let metaTitle = `${cleanTitle} Presisi Tinggi | Infimech`;
    if (metaTitle.length > 60) {
      metaTitle = `${cleanTitle.slice(0, 48)} | Infimech`;
    } else if (metaTitle.length < 50) {
      metaTitle = `${cleanTitle} Presisi & Garansi Hasil | Infimech`;
    }
    // Truncate to max 60 cleanly
    if (metaTitle.length > 60) metaTitle = metaTitle.slice(0, 57) + '...';

    // Generate Optimized Meta Description (target 140-160 chars)
    let metaDescription = `Dapatkan analisis ${cleanTitle} presisi tinggi bersama engineer profesional Infimech. Solusi hemat biaya prototyping & optimasi performa industri. Konsultasi gratis!`;
    if (metaDescription.length > 160) {
      metaDescription = `Dapatkan analisis ${cleanTitle} presisi tinggi bersama Infimech. Hemat biaya prototyping & tingkatkan performa industri. Konsultasi gratis hari ini!`;
    }
    if (metaDescription.length > 160) metaDescription = metaDescription.slice(0, 157) + '...';
    if (metaDescription.length < 130) {
      metaDescription += ' Dapatkan estimasi pengerjaan cepat dan laporan riset lengkap.';
    }

    // Generate JSON-LD Schema
    let schemaJson = {};
    if (schemaType === 'Service') {
      schemaJson = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": cleanTitle,
        "provider": {
          "@type": "Organization",
          "name": "Infimech Engineering",
          "url": "https://infimech.co.id"
        },
        "areaServed": "Indonesia",
        "description": metaDescription
      };
    } else if (schemaType === 'Article') {
      schemaJson = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": cleanTitle,
        "description": metaDescription,
        "author": {
          "@type": "Organization",
          "name": "Infimech Engineering R&D Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Infimech",
          "logo": {
            "@type": "ImageObject",
            "url": "https://infimech.co.id/assets/logo.png"
          }
        }
      };
    } else if (schemaType === 'Product') {
      schemaJson = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": cleanTitle,
        "category": "Engineering Services & Digital Assets",
        "description": metaDescription,
        "brand": {
          "@type": "Brand",
          "name": "Infimech"
        }
      };
    } else {
      schemaJson = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Infimech Engineering",
        "url": "https://infimech.co.id",
        "logo": "https://infimech.co.id/assets/logo.png",
        "sameAs": ["https://linkedin.com/company/infimech"]
      };
    }

    const canonicalUrl = `https://infimech.co.id/services/${slug}`;
    const ogImage = assetObj && assetObj.file_type === 'Image' 
      ? assetObj.file_url 
      : 'https://infimech.co.id/assets/images/cfd_aero.png';

    res.json({
      status: 'success',
      generated: {
        title: cleanTitle,
        contentType: baseCategory,
        metaTitle,
        metaDescription,
        focusKeyword: focusKw,
        searchIntent,
        schemaType,
        schemaJsonText: JSON.stringify(schemaJson, null, 2),
        ogTitle: metaTitle,
        ogDescription: metaDescription,
        ogImage,
        ogType,
        metaRobots,
        canonicalUrl,
        calculatedScore: 95
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET All SEO Configs
router.get('/configs', verifyToken, async (req, res) => {
  await seedDefaultSeoConfigs();
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.name as creator_name 
      FROM seo_configs s 
      LEFT JOIN User u ON s.created_by = u.id 
      ORDER BY s.created_at DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST Save/Update SEO Config
router.post('/save', verifyToken, async (req, res) => {
  await seedDefaultSeoConfigs();
  try {
    const {
      id,
      title,
      content_type,
      meta_title,
      meta_description,
      focus_keyword,
      search_intent,
      schema_type,
      schema_json,
      og_title,
      og_description,
      og_image,
      og_type,
      meta_robots,
      canonical_url,
      score
    } = req.body;

    const userId = req.user ? req.user.id : null;
    const schemaStr = typeof schema_json === 'object' ? JSON.stringify(schema_json) : (schema_json || '{}');

    if (id) {
      // Update
      await pool.query(
        `UPDATE seo_configs SET 
         title = ?, content_type = ?, meta_title = ?, meta_description = ?, focus_keyword = ?,
         search_intent = ?, schema_type = ?, schema_json = ?, og_title = ?, og_description = ?,
         og_image = ?, og_type = ?, meta_robots = ?, canonical_url = ?, score = ?
         WHERE id = ?`,
        [
          title, content_type, meta_title, meta_description, focus_keyword,
          search_intent, schema_type, schemaStr, og_title || meta_title, og_description || meta_description,
          og_image, og_type, meta_robots, canonical_url, score || 85, id
        ]
      );
      return res.json({ status: 'success', message: 'Konfigurasi SEO berhasil diperbarui!' });
    } else {
      // Insert
      const [result] = await pool.query(
        `INSERT INTO seo_configs 
         (title, content_type, meta_title, meta_description, focus_keyword, search_intent, schema_type, schema_json, og_title, og_description, og_image, og_type, meta_robots, canonical_url, score, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, content_type || 'Landing Page', meta_title, meta_description, focus_keyword,
          search_intent || 'Informational', schema_type || 'Organization', schemaStr,
          og_title || meta_title, og_description || meta_description, og_image, og_type || 'website',
          meta_robots || 'index, follow', canonical_url, score || 85, userId
        ]
      );
      return res.json({ status: 'success', message: 'Konfigurasi SEO berhasil disimpan!', id: result.insertId });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE SEO Config
router.delete('/configs/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM seo_configs WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'Konfigurasi SEO berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

