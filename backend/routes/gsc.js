const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

// --- GSC Client Initialization ---
// Supports both env var (production/Cloud Run) and local key file (development)
let authConfig;
if (process.env.GSC_SERVICE_ACCOUNT_JSON) {
  // Production: parse JSON from environment variable
  authConfig = {
    credentials: JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  };
} else {
  // Development: read from local file
  authConfig = {
    keyFile: path.join(__dirname, '..', 'gsc-service-account-key.json'),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  };
}
const auth = new google.auth.GoogleAuth(authConfig);

const searchconsole = google.searchconsole({ version: 'v1', auth });

// Helper: hitung tanggal berdasarkan range
// range: '7d' | '28d' | '3m'
// returns: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
function calculateDateRange(range) {
  const RANGE_MAP = { '7d': 7, '28d': 28, '3m': 90 };
  const days = RANGE_MAP[range] || 28; // default 28d

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3); // endDate = today - 3 hari

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days); // startDate = endDate - N hari

  const fmt = (d) => d.toISOString().split('T')[0];
  return { startDate: fmt(startDate), endDate: fmt(endDate) };
}

// GET /api/gsc/sites
// Headers: Authorization: Bearer <JWT>
// Response: Google API siteEntry list JSON
router.get('/sites', verifyToken, async (req, res) => {
  try {
    const response = await searchconsole.sites.list();
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil daftar site GSC.', error: err.message });
  }
});

// GET /api/gsc/analytics
// Query params:
//   siteUrl    (required) — e.g. 'https://infimech.co.id/'
//   range      (optional, default '28d') — '7d' | '28d' | '3m'
//   searchType (optional, default 'web') — 'web' | 'image' | 'video' | 'news'
// Response: Google API searchanalytics.query JSON
router.get('/analytics', verifyToken, async (req, res) => {
  const { siteUrl, range = '28d', searchType = 'web' } = req.query;

  if (!siteUrl) {
    return res.status(400).json({
      message: 'Parameter siteUrl wajib disertakan.',
      error: 'MISSING_SITE_URL',
    });
  }

  const { startDate, endDate } = calculateDateRange(range);

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        type: searchType,
        rowLimit: 100,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data analytics GSC.', error: err.message });
  }
});

module.exports = router;
