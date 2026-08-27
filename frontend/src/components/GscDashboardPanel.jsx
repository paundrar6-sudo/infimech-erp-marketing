import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';

export default function GscDashboardPanel() {
  // --- State ---
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [range, setRange] = useState('28d');
  const [searchType, setSearchType] = useState('web');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Hook 1: Mount — fetch site list ---
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getGscSites();
        const list = data.siteEntry || [];
        setSites(list);
        if (list.length > 0) {
          setSelectedSite(list[0].siteUrl);
        }
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  // --- Hook 2: Fetch analytics on selectedSite / range / searchType change ---
  useEffect(() => {
    if (!selectedSite) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getGscAnalytics(selectedSite, range, searchType);
        const rows = data.rows || [];
        const transformed = rows.map((row) => ({
          date: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: parseFloat((row.ctr * 100).toFixed(2)),
          position: parseFloat(row.position.toFixed(1)),
        }));
        setAnalyticsData(transformed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSite, range, searchType]);

  // --- KPI calculations ---
  const totalClicks = analyticsData.reduce((sum, d) => sum + (d.clicks || 0), 0);
  const totalImpressions = analyticsData.reduce((sum, d) => sum + (d.impressions || 0), 0);
  const avgCtr =
    analyticsData.length > 0
      ? (analyticsData.reduce((sum, d) => sum + (d.ctr || 0), 0) / analyticsData.length).toFixed(2)
      : '0.00';
  const avgPosition =
    analyticsData.length > 0
      ? (analyticsData.reduce((sum, d) => sum + (d.position || 0), 0) / analyticsData.length).toFixed(1)
      : '0.0';

  // --- Range pill config ---
  const rangePills = [
    { label: '7 Hari', value: '7d' },
    { label: '28 Hari', value: '28d' },
    { label: '3 Bulan', value: '3m' },
  ];

  // --- Custom tooltip for recharts ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--text-primary)',
        }}
      >
        <p style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 11 }}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.stroke, marginBottom: 2 }}>
            {entry.name === 'clicks' ? 'Klik' : 'Tayangan'}:{' '}
            <strong>{entry.value.toLocaleString('id-ID')}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ marginBottom: 0 }}>

      {/* ── Header row ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 2,
            }}
          >
            {/* Simple search icon inline SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            GSC Performance Dashboard
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Data langsung dari Google Search Console
          </p>
        </div>

        {/* Site dropdown */}
        {sites.length > 0 && (
          <select
            className="form-select"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{ minWidth: 240, maxWidth: 360 }}
          >
            {sites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Filter row ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {/* Range pill buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {rangePills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setRange(pill.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
                background:
                  range === pill.value ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                color: range === pill.value ? 'black' : 'var(--text-secondary)',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* SearchType dropdown */}
        <select
          className="form-select"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={{ minWidth: 130 }}
        >
          <option value="web">Web</option>
          <option value="image">Gambar</option>
          <option value="video">Video</option>
          <option value="news">Berita</option>
        </select>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Clicks */}
        <div className="kpi-card cyan">
          <div className="kpi-header">
            <span>Total Klik</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {totalClicks.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Jumlah klik dari pencarian
          </div>
        </div>

        {/* Total Impressions */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Tayangan</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary-glow)' }}>
            {totalImpressions.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Frekuensi muncul di hasil
          </div>
        </div>

        {/* Avg CTR */}
        <div className="kpi-card green">
          <div className="kpi-header">
            <span>Rata-rata CTR</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>
            {avgCtr}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Click-through rate rata-rata
          </div>
        </div>

        {/* Avg Position */}
        <div className="kpi-card orange">
          <div className="kpi-header">
            <span>Rata-rata Posisi</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-orange)' }}>
            {avgPosition}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Posisi rata-rata di SERP
          </div>
        </div>
      </div>

      {/* ── Loading state ──────────────────────────────────────────── */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: 20,
              height: 20,
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 10,
            }}
          />
          <p>Memuat data...</p>
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--accent-red)',
            fontSize: 14,
          }}
        >
          <strong>Gagal memuat data:</strong> {error}
        </div>
      )}

      {/* ── LineChart ──────────────────────────────────────────────── */}
      {!loading && !error && analyticsData.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Tren Klik &amp; Tayangan
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={analyticsData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--border-color)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
                minTickGap={20}
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
                width={48}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 8 }}
                formatter={(value) =>
                  value === 'clicks' ? 'Klik' : 'Tayangan'
                }
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="var(--primary-glow)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!loading && !error && analyticsData.length === 0 && selectedSite && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          Tidak ada data tersedia untuk site dan rentang waktu yang dipilih.
        </div>
      )}

      {/* Spinner keyframe (injected locally to avoid global CSS dependency) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
