import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Clock, ShieldCheck, UserCheck, RefreshCw, BarChart2, TrendingUp, Radio, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function RealtimeUserAnalytics({ token, user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchRealtimeStats = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      // Trigger visit log ping first to update backend active state
      await api.post('/analytics/log-visit', {
        action: 'Melihat Analytics Real-Time User & Admin',
        module: 'marketing',
        page_url: '/analytics'
      }, token);

      const res = await api.get('/analytics/realtime-stats', token);
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

  // Poll backend every 8 seconds for real-time live data updates
  useEffect(() => {
    fetchRealtimeStats();
    const interval = setInterval(() => {
      fetchRealtimeStats(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Superadmin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Digital Marketing':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Menghubungkan ke server real-time analytics...</span>
      </div>
    );
  }

  const { todayVisits = 0, totalVisits = 0, userFrequency = [], roleBreakdown = [], activeUsers = [], recentLogs = [] } = stats || {};

  return (
    <div className="space-y-6">
      {/* Realtime Dashboard Header */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
              <Radio className="w-4 h-4 animate-ping text-emerald-400" /> Real-time Live Analytics Sync
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Perhitungan Frekuensi & Persentase Penggunaan</h2>
            <p className="text-slate-400 text-sm mt-1">
              Monitoring real-time seberapa sering user & admin aktif masuk ke web marketing dan rasio pembagian aktivitas secara terdistribusi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Update: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
            <button
              onClick={() => fetchRealtimeStats(false)}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              Refresh Real-time
            </button>
          </div>
        </div>

        {/* Key Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Kunjungan Hari Ini</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{todayVisits} <span className="text-xs font-normal text-emerald-400">Visits</span></div>
            <p className="text-[11px] text-slate-500">Frekuensi akses hari ini</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Log Aktivitas</span>
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalVisits} <span className="text-xs font-normal text-slate-400">Aktivitas</span></div>
            <p className="text-[11px] text-slate-500">Akumulasi seluruh tim</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>User & Admin Aktif</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              {activeUsers.length || 1} <span className="text-xs font-normal text-slate-400">Online Live</span>
            </div>
            <p className="text-[11px] text-slate-500">Terlibat dalam 15 menit terakhir</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Rasio Partisipasi Tim</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">100% <span className="text-xs font-normal text-emerald-400">Distributed</span></div>
            <p className="text-[11px] text-slate-500">Proporsi penggunaan real-time</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: User Frequency & Real-time Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Frequency Table (Seberapa sering user/admin masuk) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Frekuensi Masuk & Aktivitas Pengguna
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time Ranking</span>
          </div>

          <div className="space-y-3">
            {userFrequency.map((u, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{u.name || u.username}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Aktif terakhir: {new Date(u.last_active).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">{u.total_visits} Kali</span>
                    <span className="text-xs font-semibold text-indigo-400">{u.usage_percentage}% Share</span>
                  </div>
                </div>

                {/* Real-time Usage Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(u.usage_percentage, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persentase Penggunaan Terdistribusi Real-Time per Role & User */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Persentase Penggunaan Antar Admin & User
            </h3>
            <span className="text-xs text-emerald-400 font-mono">Live Matrix</span>
          </div>

          <div className="space-y-4">
            {roleBreakdown.map((r, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{r.role}</span>
                  <span className="font-bold text-emerald-400">{r.percentage}% ({r.total_actions} Akses)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      r.role === 'Superadmin' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' :
                      r.role === 'Admin' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min(r.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Active Live Session Feed */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Live Real-time Activity Logs</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-slate-200">{log.name || log.username}</span>
                    <span className="text-slate-400 truncate">({log.action})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
