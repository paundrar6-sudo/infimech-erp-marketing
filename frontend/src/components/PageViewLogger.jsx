import { useEffect } from 'react';
import { api } from '../services/api';

// Komponen "tak terlihat" (return null) yang cuma bertugas
// mencatat log kunjungan halaman untuk Real-Time Analytics.
// Ditaruh di file terpisah biar App.jsx gak perlu disentuh isinya.
export default function PageViewLogger({ token, user, currentView, digitalTab }) {
  const pageLabels = {
    dashboard: { action: 'Membuka Dashboard Overview', page_url: '/dashboard' },
    'operator-crm': { action: 'Membuka Marketing Operator', page_url: '/operator-crm' },
    'digital-marketing': { action: 'Membuka Marketing Assets', page_url: '/digital-marketing' },
    'follow-up': { action: 'Membuka Marketing Follow Up', page_url: '/follow-up' },
  };

  const digitalTabLabels = {
    campaigns: 'Melihat Manajemen Konten & Aset',
    assets: 'Melihat Asset Library',
    seo: 'Melihat Form Options SEO Interaktif',
    analytics: 'Melihat Analytics Real-Time User & Admin',
  };

  // Log setiap kali menu utama berpindah
  useEffect(() => {
    if (!token || !user) return;
    const info = pageLabels[currentView] || { action: `Membuka halaman ${currentView}`, page_url: `/${currentView}` };
    api.logVisit({ action: info.action, module: 'marketing', page_url: info.page_url }).catch(() => {});
  }, [currentView, token, user]);

  // Log khusus perpindahan sub-tab di dalam Marketing Assets
  useEffect(() => {
    if (!token || !user || currentView !== 'digital-marketing') return;
    api.logVisit({
      action: digitalTabLabels[digitalTab] || `Melihat tab ${digitalTab}`,
      module: 'marketing',
      page_url: `/digital-marketing/${digitalTab}`
    }).catch(() => {});
  }, [digitalTab, currentView, token, user]);

  return null; // gak render UI apapun
}