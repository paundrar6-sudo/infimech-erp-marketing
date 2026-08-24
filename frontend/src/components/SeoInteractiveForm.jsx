import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Globe, Eye, Code, Share2, 
  Search, Info, FileText, Layers, ShieldCheck, Download, Trash2, Plus, RefreshCw, Copy, Check, Zap, Smartphone, Monitor, HelpCircle, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function SeoInteractiveForm({ showAlert, showConfirm, token, user }) {
  const [presets, setPresets] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [searchIntents, setSearchIntents] = useState([]);
  const [schemaTypes, setSchemaTypes] = useState([]);
  const [robotsDirectives, setRobotsDirectives] = useState([]);
  const [marketingAssets, setMarketingAssets] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'saved-configs', 'serp-preview', 'guide'
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' or 'mobile'

  // Auto-Generate Inputs
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [autoTopicInput, setAutoTopicInput] = useState('');

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

  // Fetch initial preset options & saved configs & marketing assets
  useEffect(() => {
    fetchPresetData();
    fetchConfigs();
    fetchMarketingAssets();
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

  const fetchMarketingAssets = async () => {
    try {
      const res = await api.getSeoMarketingAssets();
      if (res && res.data) {
        setMarketingAssets(res.data);
      }
    } catch (err) {
      console.error('Failed to load marketing assets for SEO:', err);
    }
  };

  // 1-Click Smart Auto SEO Generator
  const handleAutoGenerateSEO = async (assetIdToUse = null) => {
    setIsGenerating(true);
    try {
      const payload = {
        topic: autoTopicInput || title,
        contentType,
        assetId: assetIdToUse || selectedAssetId,
        customKeyword: focusKeyword
      };

      const res = await api.autoGenerateSeo(payload);
      if (res && res.status === 'success' && res.generated) {
        const gen = res.generated;
        setTitle(gen.title || title);
        setContentType(gen.contentType || contentType);
        setMetaTitle(gen.metaTitle || '');
        setMetaDescription(gen.metaDescription || '');
        setFocusKeyword(gen.focusKeyword || '');
        setSearchIntent(gen.searchIntent || 'Transactional');
        setSchemaType(gen.schemaType || 'Service');
        setSchemaJsonText(gen.schemaJsonText || '{}');
        setOgTitle(gen.ogTitle || gen.metaTitle || '');
        setOgDescription(gen.ogDescription || gen.metaDescription || '');
        setOgImage(gen.ogImage || 'https://infimech.co.id/assets/images/cfd_aero.png');
        setOgType(gen.ogType || 'website');
        setMetaRobots(gen.metaRobots || 'index, follow');
        setCanonicalUrl(gen.canonicalUrl || 'https://infimech.co.id/services/');

        if (showAlert) {
          showAlert(`✨ SEO berhasil di-generate secara otomatis! Meta Title (${gen.metaTitle.length} char), Description (${gen.metaDescription.length} char), & Schema JSON-LD siap digunakan.`, 'Smart AI SEO Generator', 'success');
        }
      }
    } catch (err) {
      if (showAlert) showAlert('Gagal generate SEO otomatis: ' + err.message, 'Error Generator', 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Asset Choice Dropdown Selection
  const handleSelectAssetForSEO = (assetId) => {
    setSelectedAssetId(assetId);
    if (!assetId) return;
    const found = marketingAssets.find(a => String(a.id) === String(assetId));
    if (found) {
      setAutoTopicInput(found.name);
      handleAutoGenerateSEO(found.id);
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
    if (metaTitle.length >= 45 && metaTitle.length <= 60) score += 30;
    else if (metaTitle.length > 0) score += 15;

    if (metaDescription.length >= 130 && metaDescription.length <= 160) score += 30;
    else if (metaDescription.length > 0) score += 15;

    if (focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
    if (focusKeyword && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 10;

    if (ogImage && ogTitle) score += 10;
    if (schemaType) score += 5;

    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore();

  // Reset form
  const handleResetForm = () => {
    setEditingId(null);
    setSelectedPresetIndex('');
    setSelectedAssetId('');
    setAutoTopicInput('');
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
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> Automatic Smart SEO & Meta Optimizer
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">SEO Marketing & Automated Metadata Engine</h2>
            <p className="text-slate-400 text-sm mt-1">
              Sistem SEO Otomatis 1-Klik: Bebas pengisian manual. Dibuat elegan, presisi, dan terhubung real-time dengan Dashboard.
            </p>
          </div>

          {/* Quick Score Badge & Real-Time Sync Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 px-4 shadow-md">
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
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'editor' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" /> Form & Smart Generator Otomatis
          </button>

          <button
            onClick={() => setActiveTab('serp-preview')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'serp-preview' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" /> Live Google SERP & Social Card
          </button>

          <button
            onClick={() => setActiveTab('saved-configs')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'saved-configs' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" /> Config SEO Tersimpan ({configs.length})
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'guide' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                : 'text-emerald-400 hover:text-white hover:bg-slate-800 border border-emerald-500/30'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Cara Penggunaan SEO (Panduan)
          </button>
        </div>
      </div>

      {/* TAB 1: SMART AUTOMATED GENERATOR & EDITOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI SMART AUTOMATED GENERATOR CARD */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Generate SEO Otomatis 1-Klik (Smart AI Engine)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Pilih Aset ERP atau ketik topik produk. Sistem secara otomatis menyusun Meta Title, Description, Keyword, & JSON-LD Schema.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Otomatis 100%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Select from Asset ERP */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Impor dari Asset Marketing ERP</label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => handleSelectAssetForSEO(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-500/40 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Pilih Aset Marketing ERP --</option>
                    {marketingAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        📄 {asset.name} ({asset.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Topic / Keyword Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ketik Topik / Produk / Solusi</label>
                  <input
                    type="text"
                    value={autoTopicInput}
                    onChange={(e) => setAutoTopicInput(e.target.value)}
                    placeholder="Contoh: Jasa Simulasi CFD Penukar Panas Heat Exchanger"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Mengikuti standar Google SERP (Title: 50-60 char, Desc: 140-160 char)
                </span>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleAutoGenerateSEO()}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Meta Tags...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Generate SEO Otomatis Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ready Preset Quick Selector */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Opsional: Pilihan Preset Template Siap Pakai
                </label>
                {selectedPresetIndex !== '' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                    Preset Terpilih
                  </span>
                )}
              </div>
              <select
                value={selectedPresetIndex}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">-- Pilih Template Preset SEO Marketing --</option>
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
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> 
                  {editingId ? 'Edit Konfigurasi SEO' : 'Konfigurasi Isian SEO Result'}
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
                  <label className="text-xs font-semibold text-slate-300">Meta Title (Judul Google SERP)</label>
                  <span className={`text-xs font-medium ${metaTitle.length >= 45 && metaTitle.length <= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {metaTitle.length} / 60 Karakter (Ideal: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Contoh: Jasa Simulasi CFD & Analisis FEA Presisi Tinggi | Infimech"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none font-medium"
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
                  placeholder="Contoh: Dapatkan analisis simulasi mekanika fluida CFD & FEA presisi tinggi untuk industri Anda..."
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
                  <Globe className="w-4 h-4 text-blue-400" /> Live Google SERP Preview
                </span>
                
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded text-xs flex items-center gap-1 ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    <Monitor className="w-3 h-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded text-xs flex items-center gap-1 ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    <Smartphone className="w-3 h-3" /> Mobile
                  </button>
                </div>
              </div>
              
              <div className={`bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1 ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto' : ''}`}>
                <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">G</span>
                  <span className="truncate">{canonicalUrl || 'https://infimech.co.id'}</span>
                </div>
                <h4 className="text-blue-400 text-base font-semibold hover:underline cursor-pointer truncate">
                  {metaTitle || 'Judul Halaman Belum Diisi'}
                </h4>
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                  {metaDescription || 'Deskripsi halaman akan muncul di sini sesuai yang di-generate otomatis oleh sistem.'}
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
                  {metaTitle.length >= 45 && metaTitle.length <= 60 ? (
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
                  <span>Focus Keyword di Title</span>
                  {focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()) ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ada</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Belum Ada</span>
                  )}
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Schema JSON-LD Markup</span>
                  <span className="text-indigo-400 font-semibold">{schemaType}</span>
                </li>
              </ul>

              {/* Code Tags Exporter */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyMetaHtml}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-medium transition-all"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> HTML Meta Tags Tersalin!
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4 text-cyan-400" /> Copy Meta Tags HTML Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SERP & SOCIAL CARD PREVIEW */}
      {activeTab === 'serp-preview' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" /> Preview Tampilan Google & Social Media
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Desktop Preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Google SERP Desktop Preview</span>
                  <Monitor className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">G</span>
                    <span>{canonicalUrl || 'https://infimech.co.id'}</span>
                  </div>
                  <h4 className="text-blue-400 text-lg font-semibold hover:underline cursor-pointer">
                    {metaTitle || 'Judul Halaman SEO Belum Ditetapkan'}
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {metaDescription || 'Deskripsi halaman akan muncul di hasil pencarian Google sesuai pengaturan Meta Description Anda.'}
                  </p>
                </div>
              </div>

              {/* Social Media OpenGraph Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>OpenGraph Social Share Card (LinkedIn & FB)</span>
                  <Share2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  {ogImage && (
                    <img src={ogImage} alt="OG Preview" className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">INFIMECH.CO.ID</span>
                    <h5 className="text-sm font-bold text-white truncate">{ogTitle || metaTitle || 'Judul Share Social Media'}</h5>
                    <p className="text-xs text-slate-400 line-clamp-2">{ogDescription || metaDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED SEO CONFIGS TABLE */}
      {activeTab === 'saved-configs' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Daftar Konfigurasi SEO Tersimpan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Semua data SEO terhubung secara real-time ke Dashboard & Analytics.</p>
            </div>
            <button
              onClick={fetchConfigs}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Memuat data konfigurasi SEO...</span>
            </div>
          ) : configs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Belum ada konfigurasi SEO tersimpan. Gunakan Smart Generator di tab pertama.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Asset / Campaign</th>
                    <th className="py-3 px-4">Focus Keyword</th>
                    <th className="py-3 px-4">Intent</th>
                    <th className="py-3 px-4">Schema Type</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{cfg.title}</div>
                        <div className="text-xs text-slate-400 font-normal truncate max-w-xs">{cfg.meta_title}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-cyan-400">{cfg.focus_keyword || '-'}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                          {cfg.search_intent}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">{cfg.schema_type}</td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={cfg.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                          {cfg.score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditConfig(cfg)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(cfg)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPREHENSIVE USER GUIDE (CARA PENGGUNAAN SEO MARKETING OTOMATIS) */}
      {activeTab === 'guide' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 text-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Panduan & Cara Penggunaan SEO Marketing Otomatis</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Panduan lengkap memanfaatkan fitur Smart SEO Auto-Generator dan sinkronisasi real-time ke Dashboard ERP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">1</span>
                <span>Generate SEO Otomatis 1-Klik</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda tidak perlu lagi mengisikan Meta Title, Meta Description, atau JSON-LD Schema secara manual. Cukup pilih aset dari dropdown <strong>"Impor dari Asset Marketing ERP"</strong> atau ketik nama topik/produk Anda pada kolom input, lalu klik tombol <strong>"Generate SEO Otomatis Sekarang"</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center">2</span>
                <span>Evaluasi Live SERP & Score Quality</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem akan menghitung <strong>SEO Quality Score (A+/B/C)</strong> secara live. Anda bisa melihat preview tampilan pada pencarian Google (Desktop & Mobile) serta Social Media Card (LinkedIn/FB) di tab <strong>"Live Google SERP"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">3</span>
                <span>Penerapan Structured Data Schema JSON-LD</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Schema JSON-LD mempermudah Google memuat Rich Snippets halaman Anda (Service, Article, Product, Organization). Script JSON-LD ini otomatis dibuat sesuai tipe konten yang Anda pilih.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">4</span>
                <span>Sinkronisasi Real-Time ke Dashboard</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Setiap kali Anda menekan tombol <strong>"Simpan Konfigurasi SEO"</strong>, data statistik skor SEO, indeksasi Google, dan Schema breakdown akan otomatis ter-update secara <strong>real-time</strong> pada Dashboard Utama ERP Marketing!
              </p>
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between text-xs">
            <span className="text-indigo-300">
              💡 <strong>Tips Tambahan:</strong> Anda juga bisa men-copy kode tag HTML Meta lengkap melalui tombol "Copy Meta Tags HTML Code" untuk langsung dipasang di header website.
            </span>
            <button
              onClick={() => setActiveTab('editor')}
              className="flex items-center gap-1 text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              Mulai Generate <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
