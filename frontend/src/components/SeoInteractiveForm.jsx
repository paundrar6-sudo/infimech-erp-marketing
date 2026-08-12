import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Globe, Eye, Code, Share2, 
  Search, Info, FileText, Layers, ShieldCheck, Download, Trash2, Plus, RefreshCw, Copy, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function SeoInteractiveForm({ showAlert, showConfirm, token, user }) {
  const [presets, setPresets] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [searchIntents, setSearchIntents] = useState([]);
  const [schemaTypes, setSchemaTypes] = useState([]);
  const [robotsDirectives, setRobotsDirectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'saved-configs', 'serp-preview'
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState('');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Landing Page (Jasa & Solusi)');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [searchIntent, setSearchIntent] = useState('Transactional');
  const [schemaType, setSchemaType] = useState('Service');
  const [schemaJsonText, setSchemaJsonText] = useState('{\n  "@context": "https://schema.org",\n  "@type": "Service"\n}');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('https://infimech.co.id/assets/images/cfd_aero.png');
  const [ogType, setOgType] = useState('website');
  const [metaRobots, setMetaRobots] = useState('index, follow');
  const [canonicalUrl, setCanonicalUrl] = useState('https://infimech.co.id/services/');

  // Fetch initial preset options & saved configs
  useEffect(() => {
    fetchPresetData();
    fetchConfigs();
  }, []);

  const fetchPresetData = async () => {
    try {
      const res = await api.get('/seo/presets', token);
      if (res && res.status === 'success') {
        setPresets(res.presets || []);
        setSearchIntents(res.searchIntents || []);
        setSchemaTypes(res.schemaTypes || []);
        setRobotsDirectives(res.robotsDirectives || []);
      }
    } catch (err) {
      console.error('Failed to load SEO presets:', err);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seo/configs', token);
      if (res && res.data) {
        setConfigs(res.data);
      }
    } catch (err) {
      console.error('Failed to load SEO configs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Preset Choice Selection
  const handleApplyPreset = (indexStr) => {
    setSelectedPresetIndex(indexStr);
    if (indexStr === '') return;

    const idx = parseInt(indexStr, 10);
    const selected = presets[idx];
    if (selected) {
      setContentType(selected.contentType);
      setSearchIntent(selected.searchIntent);
      setSchemaType(selected.schemaType);
      setMetaRobots(selected.metaRobots);
      setOgType(selected.ogType);
      if (selected.focusKeyword) setFocusKeyword(selected.focusKeyword);

      // Auto-fill template placeholders if title/meta title not filled
      if (!title) setTitle(selected.contentType);
      if (!metaTitle) setMetaTitle(selected.titleTemplate.replace('[Nama Jasa/Produk]', 'Jasa Simulasi CFD').replace('[Nama Perusahaan]', 'Infimech'));
      if (!metaDescription) setMetaDescription(selected.descriptionTemplate.replace('[Nama Jasa]', 'Simulasi CFD & FEA').replace('[Nama Klien/Industri]', 'Manufaktur'));

      if (selected.schemaJson) {
        setSchemaJsonText(JSON.stringify(selected.schemaJson, null, 2));
      }
      if (showAlert) showAlert(`Preset "${selected.contentType}" berhasil diterapkan!`, 'Preset SEO', 'info');
    }
  };

  // Calculate SEO Quality Score (0-100)
  const calculateSeoScore = () => {
    let score = 0;
    // Meta Title length score (ideal 50-60)
    if (metaTitle.length >= 40 && metaTitle.length <= 65) score += 30;
    else if (metaTitle.length > 0) score += 15;

    // Meta Description length score (ideal 130-160)
    if (metaDescription.length >= 120 && metaDescription.length <= 165) score += 30;
    else if (metaDescription.length > 0) score += 15;

    // Focus keyword present in Meta Title & Meta Description
    if (focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
    if (focusKeyword && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 10;

    // OpenGraph & Schema selected
    if (ogImage && ogTitle) score += 10;
    if (schemaType) score += 5;

    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore();

  // Reset form
  const handleResetForm = () => {
    setEditingId(null);
    setSelectedPresetIndex('');
    setTitle('');
    setContentType('Landing Page (Jasa & Solusi)');
    setMetaTitle('');
    setMetaDescription('');
    setFocusKeyword('');
    setSearchIntent('Transactional');
    setSchemaType('Service');
    setSchemaJsonText('{\n  "@context": "https://schema.org",\n  "@type": "Service"\n}');
    setOgTitle('');
    setOgDescription('');
    setOgImage('https://infimech.co.id/assets/images/cfd_aero.png');
    setOgType('website');
    setMetaRobots('index, follow');
    setCanonicalUrl('https://infimech.co.id/services/');
  };

  // Load config into editor
  const handleEditConfig = (cfg) => {
    setEditingId(cfg.id);
    setTitle(cfg.title || '');
    setContentType(cfg.content_type || 'Landing Page');
    setMetaTitle(cfg.meta_title || '');
    setMetaDescription(cfg.meta_description || '');
    setFocusKeyword(cfg.focus_keyword || '');
    setSearchIntent(cfg.search_intent || 'Informational');
    setSchemaType(cfg.schema_type || 'Organization');
    setSchemaJsonText(cfg.schema_json || '{}');
    setOgTitle(cfg.og_title || cfg.meta_title || '');
    setOgDescription(cfg.og_description || cfg.meta_description || '');
    setOgImage(cfg.og_image || '');
    setOgType(cfg.og_type || 'website');
    setMetaRobots(cfg.meta_robots || 'index, follow');
    setCanonicalUrl(cfg.canonical_url || '');
    setActiveTab('editor');
  };

  // Save SEO Configuration
  const handleSave = async (e) => {
    e.preventDefault();
    if (!metaTitle.trim() || !metaDescription.trim() || !focusKeyword.trim()) {
      if (showAlert) showAlert('Meta Title, Meta Description, dan Focus Keyword wajib diisi!', 'Peringatan Form', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingId,
        title: title || metaTitle,
        content_type: contentType,
        meta_title: metaTitle,
        meta_description: metaDescription,
        focus_keyword: focusKeyword,
        search_intent: searchIntent,
        schema_type: schemaType,
        schema_json: schemaJsonText,
        og_title: ogTitle || metaTitle,
        og_description: ogDescription || metaDescription,
        og_image: ogImage,
        og_type: ogType,
        meta_robots: metaRobots,
        canonical_url: canonicalUrl,
        score: seoScore
      };

      const res = await api.post('/seo/save', payload, token);
      if (res && res.status === 'success') {
        if (showAlert) showAlert(res.message, 'SEO Marketing', 'success');
        fetchConfigs();
        handleResetForm();
        setActiveTab('saved-configs');
      }
    } catch (err) {
      if (showAlert) showAlert('Gagal menyimpan konfigurasi SEO: ' + err.message, 'Error', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Delete Config
  const handleDeleteConfig = async (id) => {
    if (showConfirm) {
      showConfirm('Apakah Anda yakin ingin menghapus konfigurasi SEO ini?', async () => {
        try {
          await api.delete(`/seo/configs/${id}`, token);
          if (showAlert) showAlert('Konfigurasi SEO berhasil dihapus.', 'Informasi', 'success');
          fetchConfigs();
        } catch (err) {
          if (showAlert) showAlert('Gagal menghapus SEO: ' + err.message, 'Error', 'danger');
        }
      });
    }
  };

  // Generate HTML Meta tags code snippet
  const generateMetaHtml = () => {
    return `<!-- Standard SEO Meta Tags -->
<title>${metaTitle}</title>
<meta name="description" content="${metaDescription}" />
<meta name="keywords" content="${focusKeyword}" />
<meta name="robots" content="${metaRobots}" />
<link rel="canonical" href="${canonicalUrl}" />

<!-- Open Graph / Social Media Meta Tags -->
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${ogTitle || metaTitle}" />
<meta property="og:description" content="${ogDescription || metaDescription}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:url" content="${canonicalUrl}" />

<!-- JSON-LD Structured Data Schema Markup -->
<script type="application/ld+json">
${schemaJsonText}
</script>`;
  };

  const handleCopyMetaHtml = () => {
    navigator.clipboard.writeText(generateMetaHtml());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" /> SEO & Content Marketing Optimizer
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Form Options SEO Interaktif</h2>
            <p className="text-slate-400 text-sm mt-1">
              Pilihan preset isian SEO terstandarisasi untuk halaman marketing, brosur, studi kasus, & campaign digital.
            </p>
          </div>

          {/* Quick Score Badge */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 px-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">SEO Quality Score</span>
              <span className={`text-xl font-bold ${seoScore >= 80 ? 'text-emerald-400' : seoScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {seoScore} / 100
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
              seoScore >= 80 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 
              seoScore >= 50 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 
              'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}>
              {seoScore >= 80 ? 'A+' : seoScore >= 50 ? 'B' : 'C'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'editor' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Form Isian SEO Interaktif
          </button>
          <button
            onClick={() => setActiveTab('saved-configs')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'saved-configs' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Daftar Config SEO Tersimpan ({configs.length})
          </button>
          <button
            onClick={() => setActiveTab('serp-preview')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'serp-preview' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" /> Live Google & Social Preview
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Left Side (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preset Selector Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Pilihan Preset SEO Otomatis (Preset Ready-to-Use)
                </label>
                {selectedPresetIndex !== '' && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Preset Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Pilih opsi preset di bawah ini untuk mengisi template judul, deskripsi, niat pencarian, dan schema markup otomatis agar tidak salah memilih.
              </p>
              <select
                value={selectedPresetIndex}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-500/40 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Pilih Preset Konten SEO Marketing --</option>
                {presets.map((p, idx) => (
                  <option key={idx} value={idx}>
                    ✨ {p.contentType} ({p.searchIntent})
                  </option>
                ))}
              </select>
            </div>

            {/* Main SEO Inputs Form */}
            <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" /> 
                  {editingId ? 'Edit Konfigurasi SEO' : 'Buat Konfigurasi SEO Baru'}
                </h3>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              {/* Title & Content Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nama Konten / Campaign</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Landing Page Jasa Simulasi CFD 2026"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tipe Konten Marketing</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="Landing Page (Jasa & Solusi)">Landing Page (Jasa & Solusi)</option>
                    <option value="Studi Kasus (Case Study B2B)">Studi Kasus (Case Study B2B)</option>
                    <option value="Whitepaper & Riset Teknik">Whitepaper & Riset Teknik</option>
                    <option value="Katalog & Download Asset">Katalog & Download Asset</option>
                    <option value="Artikel Blog / Berita">Artikel Blog / Berita</option>
                  </select>
                </div>
              </div>

              {/* Meta Title */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Meta Title (Judul di SERP Google)</label>
                  <span className={`text-xs font-medium ${metaTitle.length >= 50 && metaTitle.length <= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {metaTitle.length} / 60 Karakter (Ideal: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Contoh: Jasa Simulasi CFD & Analisis FEA Presisi Tinggi | Infimech"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  required
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Meta Description (Ringkasan Deskripsi)</label>
                  <span className={`text-xs font-medium ${metaDescription.length >= 130 && metaDescription.length <= 160 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {metaDescription.length} / 160 Karakter (Ideal: 140-160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Contoh: Dapatkan analisis simulasi mekanika fluida CFD & FEA presisi tinggi untuk industri Anda. Hemat biaya prototyping & tingkatkan performa..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  required
                />
              </div>

              {/* Focus Keyword & Search Intent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Focus Keyword (Kata Kunci Utama)</label>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="Contoh: jasa simulasi cfd dan fea"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Search Intent (Niat Pencarian Pembaca)</label>
                  <select
                    value={searchIntent}
                    onChange={(e) => setSearchIntent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    {searchIntents.map((si) => (
                      <option key={si.key} value={si.key}>{si.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schema Type & Robots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Schema Markup Type (Rich Snippet)</label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    {schemaTypes.map((st) => (
                      <option key={st.key} value={st.key}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Meta Robots Directive</label>
                  <select
                    value={metaRobots}
                    onChange={(e) => setMetaRobots(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    {robotsDirectives.map((rd) => (
                      <option key={rd.key} value={rd.key}>{rd.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Canonical URL & OG Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Canonical URL</label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://infimech.co.id/services/cfd-fea"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Social Share Image URL (OG Image)</label>
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://infimech.co.id/assets/images/cfd_aero.png"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schema JSON Preview */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>JSON-LD Schema Script Preview</span>
                  <span className="text-slate-500 font-mono text-[11px]">application/ld+json</span>
                </label>
                <textarea
                  rows={4}
                  value={schemaJsonText}
                  onChange={(e) => setSchemaJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 rounded-xl p-3 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Simpan Konfigurasi SEO
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Real-Time SERP Snippet & Checklist */}
          <div className="space-y-6">
            {/* Live Google Search Result Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" /> Tampilan Google SERP (Live)
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Desktop View</span>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">G</span>
                  <span className="truncate">{canonicalUrl || 'https://infimech.co.id'}</span>
                </div>
                <h4 className="text-blue-400 text-base font-semibold hover:underline cursor-pointer truncate">
                  {metaTitle || 'Judul Halaman Belum Diisi'}
                </h4>
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                  {metaDescription || 'Deskripsi halaman akan muncul di sini sesuai yang Anda isikan pada form di sebelah kiri.'}
                </p>
              </div>
            </div>

            {/* Checklist Optimasi SEO */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Checklist Kualitas SEO
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between text-slate-300">
                  <span>Panjang Meta Title (50-60 char)</span>
                  {metaTitle.length >= 50 && metaTitle.length <= 60 ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ideal</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Perlu Disesuaikan</span>
                  )}
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Panjang Meta Description (140-160)</span>
                  {metaDescription.length >= 130 && metaDescription.length <= 160 ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ideal</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Perlu Disesuaikan</span>
                  )}
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Focus Keyword di Meta Title</span>
                  {focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()) ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ada</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Belum Ada</span>
                  )}
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Schema Markup Selected</span>
                  {schemaType ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {schemaType}</span>
                  ) : (
                    <span className="text-amber-400">Kosong</span>
                  )}
                </li>
              </ul>
            </div>

            {/* Export HTML Code Block */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-purple-400" /> Export Code Tags HTML
                </span>
                <button
                  onClick={handleCopyMetaHtml}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition-all"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Tercopy!' : 'Copy Tags'}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                {generateMetaHtml()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Saved Configurations Tab */}
      {activeTab === 'saved-configs' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Daftar Konfigurasi SEO Tersimpan</h3>
              <p className="text-xs text-slate-400 mt-1">Daftar pengaturan SEO yang telah dikonfigurasi untuk seluruh aset & campaign marketing.</p>
            </div>
            <button
              onClick={() => setActiveTab('editor')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Baru
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Memuat data konfigurasi SEO...</span>
            </div>
          ) : configs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Belum ada konfigurasi SEO tersimpan. Silakan isi form di tab pertama.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((cfg) => (
                <div key={cfg.id} className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {cfg.content_type || 'Landing Page'}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1.5">{cfg.title}</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      Score: {cfg.score || 85}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cfg.meta_description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Search className="w-3 h-3 text-slate-400" /> Key: <strong className="text-slate-300">{cfg.focus_keyword}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditConfig(cfg)}
                        className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(cfg.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-900"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live SERP & Social Preview Tab */}
      {activeTab === 'serp-preview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Desktop Preview */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Google Search Desktop Card Preview
            </h3>
            <div className="bg-white rounded-xl p-5 shadow-lg text-slate-900 space-y-1 font-sans">
              <div className="text-xs text-slate-600 truncate">{canonicalUrl || 'https://infimech.co.id'}</div>
              <h4 className="text-blue-800 text-lg font-medium hover:underline cursor-pointer truncate">
                {metaTitle || 'Pratinjau Judul Meta Google'}
              </h4>
              <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                {metaDescription || 'Deskripsi meta akan muncul di sini dalam hasil pencarian Google.'}
              </p>
            </div>
          </div>

          {/* Social Share Card (Open Graph) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" /> Social Media Share Card (LinkedIn/Facebook)
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="h-44 bg-slate-900 overflow-hidden relative">
                {ogImage ? (
                  <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No OG Image Attached</div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">{canonicalUrl ? new URL(canonicalUrl).hostname : 'infimech.co.id'}</span>
                <h5 className="text-sm font-bold text-white truncate">{ogTitle || metaTitle || 'Judul Shared Card'}</h5>
                <p className="text-xs text-slate-400 line-clamp-2">{ogDescription || metaDescription || 'Deskripsi shared card...'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
