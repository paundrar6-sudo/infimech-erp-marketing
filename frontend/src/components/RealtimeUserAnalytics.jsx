import React, { useState, useEffect } from 'react';
import {
  Users, Activity, Clock, RefreshCw, HelpCircle, Crown
} from 'lucide-react';
import { api } from '../services/api';

const ROLE_COLORS = {
  Superadmin: { color: '#d8b4fe', bg: 'rgba(168,85,247,0.12)', ring: 'rgba(168,85,247,0.25)' },
  Admin: { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)', ring: 'rgba(59,130,246,0.25)' },
  'Digital Marketing': { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', ring: 'rgba(16,185,129,0.25)' },
  default: { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', ring: 'rgba(245,158,11,0.25)' },
};

export default function RealtimeUserAnalytics({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showGuide, setShowGuide] = useState(false);

  const fetchRealtimeStats = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await api.getRealtimeStats();
      if (res && res.data) {
        setStats(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load realtime analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStats();
    const interval = setInterval(() => fetchRealtimeStats(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const getRoleStyle = (role) => ROLE_COLORS[role] || ROLE_COLORS.default;

  const rankBadge = (idx) => {
    if (idx === 0) return { icon: <Crown size={15} color="#fbbf24" />, ring: 'rgba(245,158,11,0.4)' };
    if (idx === 1) return { icon: null, ring: 'rgba(148,163,184,0.3)' };
    if (idx === 2) return { icon: null, ring: 'rgba(194,120,3,0.3)' };
    return { icon: null, ring: 'transparent' };
  };

  if (loading && !stats) {
    return (
      <div style={styles.loadingBox}>
        <RefreshCw size={20} className="spin" color="#60a5fa" />
        <span style={{ fontSize: 14, color: '#94a3b8' }}>Menghubungkan ke server real-time…</span>
        <style>{spinKeyframes}</style>
      </div>
    );
  }

  const { todayVisits = 0, totalVisits = 0, userFrequency = [], roleBreakdown = [], activeUsers = [], recentLogs = [] } = stats || {};

  return (
    <div style={styles.page}>
      <style>{spinKeyframes + pingKeyframes + scrollbarCss}</style>

      {/* Header */}
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.liveRow}>
              <span style={styles.pingWrap}>
                <span style={styles.pingPulse} />
                <span style={styles.pingDot} />
              </span>
              <span style={styles.liveLabel}>Live</span>
              <button
                onClick={() => setShowGuide(!showGuide)}
                style={styles.iconButton}
                title="Cara membaca data ini"
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <h2 style={styles.title}>Aktivitas User &amp; Admin</h2>
            <p style={styles.subtitle}>Pemantauan aktivitas tim secara langsung</p>
          </div>

          <div style={styles.headerActions}>
            <span style={styles.clock}>{lastUpdated.toLocaleTimeString('id-ID')}</span>
            <button
              onClick={() => fetchRealtimeStats(false)}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {showGuide && (
          <div style={styles.guideBox}>
            <p style={styles.guideItem}><span style={styles.guideTerm}>Online</span> — aktif dalam 15 menit terakhir.</p>
            <p style={styles.guideItem}><span style={styles.guideTerm}>Share</span> — persentase aktivitas akun dari total tim.</p>
            <p style={styles.guideItem}><span style={styles.guideTerm}>Log</span> tercatat otomatis, tanpa input manual.</p>
          </div>
        )}

        {/* Metrics */}
        <div style={styles.metricsGrid}>
          {[
            { label: 'Kunjungan Hari Ini', value: todayVisits, icon: Activity, color: '#60a5fa' },
            { label: 'Total Aktivitas', value: totalVisits, icon: Clock, color: '#94a3b8' },
            { label: 'Online Sekarang', value: activeUsers.length, icon: Users, color: '#34d399' },
          ].map((m, i) => (
            <div key={i} style={styles.metricCard}>
              <div>
                <div style={styles.metricLabel}>{m.label}</div>
                <div style={styles.metricValue}>{m.value}</div>
              </div>
              <div style={styles.metricIconBox}>
                <m.icon size={18} color={m.color} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div style={styles.mainGrid}>
        {/* Frekuensi per user */}
        <div style={{ ...styles.card, ...styles.freqCard }}>
          <div style={styles.sectionHeaderRow}>
            <h3 style={styles.sectionTitle}>Frekuensi Masuk per Akun</h3>
            <span style={styles.sectionEyebrow}>Ranking</span>
          </div>

          {userFrequency.length === 0 && (
            <p style={styles.emptyText}>Belum ada data aktivitas.</p>
          )}

          <div>
            {userFrequency.map((u, idx) => {
              const rank = rankBadge(idx);
              return (
                <div key={idx} style={styles.userRow} className="hover-row">
                  <div style={{ ...styles.rankBadge, boxShadow: `0 0 0 1px ${rank.ring}` }}>
                    {rank.icon || idx + 1}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.userNameRow}>
                      <span style={styles.userName}>{u.name || u.username}</span>
                      <span style={{
                        ...styles.roleBadge,
                        color: getRoleStyle(u.role).color,
                        background: getRoleStyle(u.role).bg,
                        boxShadow: `0 0 0 1px ${getRoleStyle(u.role).ring}`,
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${Math.min(u.usage_percentage, 100)}%` }} />
                    </div>
                  </div>

                  <div style={styles.userStats}>
                    <div style={styles.userStatMain}>{u.total_visits}×</div>
                    <div style={styles.userStatSub}>{u.usage_percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role breakdown + live feed */}
        <div style={{ ...styles.card, ...styles.sideCard }}>
          <div style={{ marginBottom: 28 }}>
            <h3 style={styles.sectionTitle}>Share per Role</h3>
            {roleBreakdown.length === 0 && (
              <p style={styles.emptyText}>Belum ada data.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              {roleBreakdown.map((r, idx) => (
                <div key={idx}>
                  <div style={styles.roleShareRow}>
                    <span style={styles.roleShareLabel}>{r.role}</span>
                    <span style={styles.roleSharePct}>{r.percentage}% · {r.total_actions}×</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(r.percentage, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.feedSection}>
            <h3 style={styles.sectionTitle}>Aktivitas Terbaru</h3>
            {recentLogs.length === 0 && (
              <p style={styles.emptyText}>Belum ada log.</p>
            )}
            <div style={styles.feedList} className="thin-scroll">
              {recentLogs.map((log) => (
                <div key={log.id} style={styles.feedItem}>
                  <span style={styles.feedDot} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.feedTopRow}>
                      <span style={styles.feedName}>{log.name || log.username}</span>
                      <span style={styles.feedTime}>{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <span style={styles.feedAction}>{log.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const spinKeyframes = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
`;

const pingKeyframes = `
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
`;

const scrollbarCss = `
.thin-scroll::-webkit-scrollbar { width: 6px; }
.thin-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
.hover-row:hover { background: rgba(30,41,59,0.4); }
`;

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    maxWidth: 1200,
    margin: '0 auto',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  loadingBox: {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid #1e293b',
    borderRadius: 14,
    padding: 40,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(30,41,59,0.8)',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
  },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  liveRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  pingWrap: { position: 'relative', display: 'inline-flex', height: 7, width: 7 },
  pingPulse: {
    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
    position: 'absolute',
    display: 'inline-flex',
    height: '100%',
    width: '100%',
    borderRadius: '999px',
    background: '#60a5fa',
    opacity: 0.75,
  },
  pingDot: {
    position: 'relative',
    display: 'inline-flex',
    borderRadius: '999px',
    height: 7,
    width: 7,
    background: '#60a5fa',
  },
  liveLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#60a5fa' },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    marginLeft: 2,
    padding: 0,
    display: 'inline-flex',
  },
  title: { fontSize: 19, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10 },
  clock: { fontSize: 13, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(30,41,59,0.8)',
    color: '#e2e8f0',
    border: '1px solid rgba(51,65,85,0.6)',
    padding: '7px 13px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  guideBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(30,41,59,0.7)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  guideItem: { fontSize: 13, color: '#94a3b8', margin: 0 },
  guideTerm: { color: '#e2e8f0', fontWeight: 500 },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
    marginTop: 20,
  },
  metricCard: {
    background: 'rgba(2,6,23,0.6)',
    border: '1px solid rgba(30,41,59,0.5)',
    borderRadius: 12,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 500, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: 600, color: '#ffffff', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' },
  metricIconBox: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 9 },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '3fr 2fr',
    gap: 16,
  },
  freqCard: {},
  sideCard: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0, marginBottom: 12 },
  sectionEyebrow: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', padding: '28px 0' },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px',
    margin: '0 -10px',
    borderRadius: 12,
    transition: 'background 0.15s ease',
  },
  rankBadge: {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: '999px',
    background: '#1e293b',
    border: '1px solid rgba(51,65,85,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#cbd5e1',
  },
  userNameRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  userName: { fontSize: 13, fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  roleBadge: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', padding: '2px 6px', borderRadius: 5 },
  progressTrack: { width: '100%', background: 'rgba(30,41,59,0.7)', borderRadius: 999, height: 5 },
  progressFill: { background: '#3b82f6', height: '100%', borderRadius: 999, transition: 'width 0.5s ease' },
  userStats: { textAlign: 'right', flexShrink: 0, paddingLeft: 10 },
  userStatMain: { fontSize: 13, fontFamily: 'monospace', color: '#ffffff', fontVariantNumeric: 'tabular-nums' },
  userStatSub: { fontSize: 11, fontFamily: 'monospace', color: '#64748b', marginTop: 1, fontVariantNumeric: 'tabular-nums' },
  roleShareRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, marginBottom: 6 },
  roleShareLabel: { color: '#cbd5e1', fontWeight: 500 },
  roleSharePct: { fontFamily: 'monospace', color: '#64748b', fontSize: 11, fontVariantNumeric: 'tabular-nums' },
  feedSection: { paddingTop: 16, borderTop: '1px solid rgba(30,41,59,0.7)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  feedList: { display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4, maxHeight: 210 },
  feedItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  feedDot: { width: 5, height: 5, borderRadius: '999px', background: '#34d399', marginTop: 6, flexShrink: 0 },
  feedTopRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 3 },
  feedName: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  feedTime: { fontSize: 11, fontFamily: 'monospace', color: '#475569', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  feedAction: { fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' },
};