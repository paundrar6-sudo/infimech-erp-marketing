import React, { useState, useEffect } from 'react';
import IntroAnimation from './IntroAnimation';
import { 
  LayoutDashboard, Users, Megaphone, Calendar, FolderHeart, 
  UserSquare, LogOut, Sun, Moon, Search, Bell, Plus, Filter, 
  CheckCircle2, XCircle, Clock, Trash2, Edit3, MessageSquare, 
  Download, Share2, Check, ArrowRight, DollarSign, Target, Award,
  Users2, AlertTriangle, Eye, ShieldAlert, KeyRound, Mail, ChevronDown, ChevronRight, 
  MapPin, Building, Landmark, Phone, PlusCircle, ArrowLeft, Send, MoreVertical, FileText,
  Copy, ExternalLink, ListChecks, CircleDot, Clipboard, PhoneCall, CheckSquare, CalendarDays,
  Menu, X
} from 'lucide-react';
import { api } from './services/api';

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'operator-crm', 'digital-marketing', 'follow-up'
  const theme = 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [marketingDropdownOpen, setMarketingDropdownOpen] = useState(true);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introShown'));

  // Tab states for sub-views
  const [operatorTab, setOperatorTab] = useState('leads'); // 'leads', 'segments', 'roles'
  const [digitalTab, setDigitalTab] = useState('campaigns'); // 'campaigns', 'assets'
  const [followUpTab, setFollowUpTab] = useState('kanban'); // 'kanban', 'projects', 'project-status', 'it-projects', 'calendar'

  // Selected Lead Details
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);

  // Contact list options menu active ID
  const [activeContactMenuId, setActiveContactMenuId] = useState(null);

  // Follow Up / Prospects specific states
  const [fuSearch, setFuSearch] = useState('');
  const [fuFilterStatus, setFuFilterStatus] = useState('');
  const [fuSelectedProspect, setFuSelectedProspect] = useState(null); // full detail object
  const [fuSubtasks, setFuSubtasks] = useState([]);
  const [fuEditModalOpen, setFuEditModalOpen] = useState(false);
  const [fuEditForm, setFuEditForm] = useState({});
  const [fuNewContactPhone, setFuNewContactPhone] = useState('');
  const [fuNewContactNotes, setFuNewContactNotes] = useState('');
  const [fuTaskModalOpen, setFuTaskModalOpen] = useState(false);
  const [fuTaskForm, setFuTaskForm] = useState({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' });
  const [fuOperators, setFuOperators] = useState([]);

  // Projects states
  const [projects, setProjects] = useState([]);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ id: '', name: '', client_id: '', description: '', budget: '', status: 'Planning', progress: 0, deadline: '' });

  // Operator states for Role Management
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [operatorFormData, setOperatorFormData] = useState({ id: '', username: '', name: '', email: '', password: '', phone: '', role: 'Operator', status: 'Active' });

  // IT Projects view active lead ID for subtask viewing
  const [itActiveLeadId, setItActiveLeadId] = useState('');

  // Deadline alerts for in-app notification
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [assets, setAssets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [expandedSegmentId, setExpandedSegmentId] = useState(null);

  // Filtering states
  const [leadsFilterStatus, setLeadsFilterStatus] = useState('');
  const [leadsFilterIndustry, setLeadsFilterIndustry] = useState('');
  const [leadsFilterSource, setLeadsFilterSource] = useState('');
  const [leadsMeta, setLeadsMeta] = useState({ industries: [], sources: [] });

  // Custom Alert & Confirm Modals
  const [customAlert, setCustomAlert] = useState({ show: false, title: 'Notifikasi', message: '', type: 'success' });
  const [customConfirm, setCustomConfirm] = useState({ show: false, message: '', onConfirm: null });

  const showAlert = (message, title = 'Notifikasi', type = 'success') => {
    setCustomAlert({ show: true, title, message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setCustomConfirm({ show: true, message, onConfirm });
  };

  // Override local alert
  const alert = (msg) => {
    showAlert(msg, 'Notifikasi', 'info');
  };

  // Modals and Forms states
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ id: '', name: '', company: '', industry: 'Technology', source: 'Organic', value: '', lead_score: 50, owner_id: '', verified: false, phone: '', logo_url: '', location: 'Jakarta', company_size: '50-200', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', deadline: '' });
  
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteFormData, setNewNoteFormData] = useState({ type: 'Call', notes: '' });
  
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', phone: '', email: '', position: '', isPrimary: false });

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({ id: '', name: '', channel: 'Facebook Ads', budget: '', spend: '', conversion: '', revenue: '', status: 'Planned', start_date: '', end_date: '' });

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetFormData, setAssetFormData] = useState({ id: '', name: '', file_type: 'PDF', category: 'CFD/FEA', tags: '', file_url: '', version: '1.0', sharing_status: 'Shared', size: '2.4 MB' });
  const [selectedAssetHistory, setSelectedAssetHistory] = useState(null);
  const [shareModalAsset, setShareModalAsset] = useState(null);
  const [newVersionFileUrl, setNewVersionFileUrl] = useState('');
  const [newVersionFileSize, setNewVersionFileSize] = useState('');
  const [newVersionVal, setNewVersionVal] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('Semua');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [fuStageFilter, setFuStageFilter] = useState('Semua');
  const [publicShareAsset, setPublicShareAsset] = useState(null);
  const [publicShareLoading, setPublicShareLoading] = useState(false);
  const [publicShareError, setPublicShareError] = useState('');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postFormData, setPostFormData] = useState({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' });
  const [selectedPost, setSelectedPost] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', phone: '', password: '', avatar_url: '' });

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  // Init theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth bootstrap
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Fetch initial profile
  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      setProfileFormData({
        name: profile.name,
        phone: profile.phone || '',
        password: '',
        avatar_url: profile.avatar_url || ''
      });
      loadViewData(currentView);
      // Check deadline alerts on login
      checkDeadlineAlerts();
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  // Check deadline alerts (H-1 and H) + send email via backend
  const checkDeadlineAlerts = async () => {
    try {
      const data = await api.checkDeadlineAlerts();
      if (data.alerts && data.alerts.length > 0) {
        setDeadlineAlerts(data.alerts);
        setAlertBannerDismissed(false);
      }
    } catch (err) {
      // Silently fail — don't block the UI if notification check fails
      console.warn('Deadline alert check failed:', err.message);
    }
  };

  // Load view datasets dynamically
  const loadViewData = (view) => {
    if (!token) return;
    switch (view) {
      case 'dashboard':
        fetchDashboard();
        break;
      case 'operator-crm':
        fetchLeads();
        fetchSegments();
        fetchLeadsMeta();
        fetchFollowUpOperators();
        if (selectedLeadId) {
          fetchLeadDetails(selectedLeadId);
        }
        break;
      case 'digital-marketing':
        fetchCampaigns();
        fetchAssets();
        break;
      case 'follow-up':
        fetchFollowUpLeads();
        fetchFollowUpOperators();
        fetchProjects();
        fetchSocialPosts();
        if (fuSelectedProspect) {
          fetchSubtasks(fuSelectedProspect.lead.id);
        }
        if (itActiveLeadId) {
          fetchSubtasks(itActiveLeadId);
        }
        break;
      default:
        break;
    }
  };

  // Trigger view data refresh when view changes
  useEffect(() => {
    loadViewData(currentView);
  }, [currentView, token, selectedLeadId, itActiveLeadId]);

  // Refresh current data when global search finishes
  useEffect(() => {
    if (currentView === 'operator-crm' && !selectedLeadId) {
      fetchLeads();
    } else if (currentView === 'digital-marketing') {
      fetchAssets();
    }
  }, [globalSearch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.login(loginEmail, loginPassword);
      setToken(data.token);
    } catch (err) {
      setAuthError(err.message || 'Login gagal.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  // --- API fetches ---
  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads({
        status: leadsFilterStatus,
        industry: leadsFilterIndustry,
        source: leadsFilterSource,
        search: globalSearch
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSegments = async () => {
    try {
      const data = await api.getSegments();
      setSegments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeadsMeta = async () => {
    try {
      const data = await api.getLeadsMeta();
      setLeadsMeta(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeadDetails = async (id) => {
    try {
      const data = await api.getLeadDetails(id);
      setLeadDetail(data);
      setSelectedLeadId(id);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data detail lead: ' + err.message);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const cat = assetCategoryFilter === 'Semua' ? '' : assetCategoryFilter;
      const data = await api.getAssets(assetSearchTerm, '', cat);
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-fetch assets when search or category filter changes
  useEffect(() => {
    if (token && currentView === 'digital-marketing') {
      fetchAssets();
    }
  }, [assetSearchTerm, assetCategoryFilter, currentView, token]);

  // Load public asset details on direct load of a secure sharing link
  useEffect(() => {
    const isShare = window.location.pathname.includes('/share/assets/');
    if (isShare) {
      const parts = window.location.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id && !isNaN(id)) {
        loadPublicAsset(id);
      }
    }
  }, []);

  const loadPublicAsset = async (id) => {
    setPublicShareLoading(true);
    setPublicShareError('');
    try {
      const data = await api.getPublicAsset(id);
      setPublicShareAsset(data);
    } catch (err) {
      setPublicShareError(err.message || 'Materi tidak ditemukan atau tidak dibagikan.');
    } finally {
      setPublicShareLoading(false);
    }
  };

  const triggerDownloadPublicAsset = async (id, fileUrl) => {
    try {
      // Record public download metric on database
      await api.downloadPublicAsset(id);
      // Update local copy download count if loaded
      if (publicShareAsset && publicShareAsset.id === id) {
        setPublicShareAsset(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
      }
      // Open/Download the actual file URL
      handleOpenOrDownloadFile(fileUrl, publicShareAsset?.name || 'Dokumen');
    } catch (err) {
      console.error(err);
      handleOpenOrDownloadFile(fileUrl, 'Dokumen');
    }
  };

  const fetchSocialPosts = async () => {
    try {
      const data = await api.getSocialPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Follow Up specific fetches
  const fetchFollowUpLeads = async () => {
    try {
      const params = {};
      if (fuFilterStatus) params.status = fuFilterStatus;
      if (fuSearch) params.search = fuSearch;
      const data = await api.getProjects(params);
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowUpOperators = async () => {
    try {
      const data = await api.getOperators();
      setFuOperators(Array.isArray(data) ? data : (data.operators || []));
    } catch (err) { console.error(err); }
  };

  const fetchSubtasks = async (leadId) => {
    try {
      const data = await api.getSubtasks(leadId);
      setFuSubtasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openFuProspectDetail = async (leadId) => {
    try {
      const data = await api.getProjectDetails(leadId);
      setFuSelectedProspect(data);
      if (data.lead?.client_real_id) {
        fetchSubtasks(data.lead.client_real_id);
      } else {
        setFuSubtasks([]);
      }
    } catch (err) {
      alert('Gagal mengambil detail prospek: ' + err.message);
    }
  };

  const openFuEditModal = (lead) => {
    setFuEditForm({
      id: lead.id || lead.no_project || '',
      name: lead.name || lead.name_project || '',
      company: lead.company || lead.client_name || '',
      contact_name: lead.contact_name || '',
      status: lead.status || 'Lead',
      industry: lead.industry || 'Other',
      source: lead.source || 'Organic',
      phone: lead.phone || '',
      deadline: lead.deadline ? lead.deadline.split('T')[0] : '',
      value: lead.value || 0,
      notes: lead.notes || '',
      lead_score: lead.lead_score || 50,
      verified: lead.verified || false,
      logo_url: lead.logo_url || ''
    });
    setFuNewContactPhone('');
    setFuNewContactNotes('');
    setFuEditModalOpen(true);
  };

  const saveFuProspectEdit = async (e) => {
    e.preventDefault();
    try {
      if (!fuEditForm.name.trim().match(/^\d+\./)) {
        showAlert('Nama prospek/proyek wajib diawali dengan angka dan titik (contoh: 1. Nama Proyek).', 'Peringatan', 'warning');
        return;
      }

      if (fuEditForm.id) {
        // Edit existing project/prospect
        await api.updateProject(fuEditForm.id, {
          name_project: fuEditForm.name,
          client_name: fuEditForm.company,
          contact_name: fuEditForm.contact_name || '',
          status: fuEditForm.status ? fuEditForm.status.toUpperCase() : 'LEAD',
          value: fuEditForm.value || 0,
          phone: fuEditForm.phone || '',
          notes: fuEditForm.notes || '',
          source: fuEditForm.source || 'Organic',
          deadline: fuEditForm.deadline || null
        });
        if (fuSelectedProspect && (fuSelectedProspect.lead.id === fuEditForm.id || fuSelectedProspect.lead.no_project === fuEditForm.id)) {
          openFuProspectDetail(fuEditForm.id);
        }
        showAlert('Prospek berhasil diperbarui.', 'Sukses', 'success');
      } else {
        // Create new project/prospect
        await api.createProject({
          no_project: `imx-${Date.now()}`,
          name_project: fuEditForm.name,
          client_name: fuEditForm.company || '',
          contact_name: fuEditForm.contact_name || '',
          status: fuEditForm.status ? fuEditForm.status.toUpperCase() : 'LEAD',
          value: fuEditForm.value || 0,
          phone: fuEditForm.phone || '',
          notes: fuEditForm.notes || '',
          source: fuEditForm.source || 'Organic',
          deadline: fuEditForm.deadline || null
        });
        showAlert('Prospek baru berhasil disimpan.', 'Sukses', 'success');
      }
      setFuEditModalOpen(false);
      fetchFollowUpLeads();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const addFuContactHistory = async () => {
    if (!fuNewContactPhone.trim() && !fuNewContactNotes.trim()) return;
    try {
      await api.addInteraction(fuEditForm.id, 'Call', `${fuNewContactPhone} - ${fuNewContactNotes}`);
      setFuNewContactPhone('');
      setFuNewContactNotes('');
      fetchFollowUpLeads();
    } catch (err) {
      alert('Gagal menambahkan riwayat: ' + err.message);
    }
  };

  const saveFuNewSubtask = async (e) => {
    e.preventDefault();
    if (!fuSelectedProspect) return;
    try {
      const targetId = fuSelectedProspect.lead.client_real_id || fuSelectedProspect.lead.id;
      await api.createSubtask(targetId, fuTaskForm);
      setFuTaskModalOpen(false);
      setFuTaskForm({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' });
      fetchSubtasks(targetId);
    } catch (err) {
      alert('Gagal membuat subtask: ' + err.message);
    }
  };

  const updateFuSubtaskStatus = async (subtaskId, newStatus) => {
    try {
      const progressMap = { 'MT': 0, 'IFR': 25, 'EX': 50, 'IFC': 75, 'DONE': 100 };
      await api.updateSubtask(subtaskId, { status: newStatus, progress: progressMap[newStatus] || 0 });
      const targetId = fuSelectedProspect?.lead?.client_real_id || fuSelectedProspect?.lead?.id;
      if (fuSelectedProspect) fetchSubtasks(targetId);
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  };

  const deleteFuSubtask = (subtaskId) => {
    showConfirm('Hapus subtask ini?', async () => {
      try {
        await api.deleteSubtask(subtaskId);
        const targetId = fuSelectedProspect?.lead?.client_real_id || fuSelectedProspect?.lead?.id;
        if (fuSelectedProspect) fetchSubtasks(targetId);
        showAlert('Subtask berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert('Gagal menghapus subtask: ' + err.message, 'Gagal', 'error');
      }
    });
  };

  const deleteFuProspect = (id) => {
    showConfirm('Hapus prospek ini?', async () => {
      try {
        await api.deleteProject(id);
        setFuSelectedProspect(null);
        fetchFollowUpLeads();
        showAlert('Prospek berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const addFuNewProspect = async () => {
    const newName = prompt('Nama Klien Baru:');
    if (!newName) return;
    try {
      const result = await api.createLead({ name: newName, status: 'Lead' });
      fetchFollowUpLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  // Projects & Operator management helpers
  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (!projectFormData.name_project.trim().match(/^\d+\./)) {
        showAlert('Nama proyek wajib diawali dengan angka dan titik (contoh: 1. Nama Proyek).', 'Peringatan', 'warning');
        return;
      }

      if (projectFormData.id) {
        await api.updateProject(projectFormData.id, projectFormData);
        showAlert('Proyek berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createProject(projectFormData);
        showAlert('Proyek baru berhasil dibuat.', 'Sukses', 'success');
      }
      setProjectModalOpen(false);
      fetchProjects();
      fetchDashboard();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteProject = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus proyek ini?', async () => {
      try {
        await api.deleteProject(id);
        fetchProjects();
        fetchDashboard();
        showAlert('Proyek berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const saveOperator = async (e) => {
    e.preventDefault();
    try {
      if (operatorFormData.id) {
        await api.updateOperator(operatorFormData.id, operatorFormData);
        showAlert('Operator berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createOperator(operatorFormData);
        showAlert('Operator baru berhasil ditambahkan.', 'Sukses', 'success');
      }
      setOperatorModalOpen(false);
      fetchFollowUpOperators();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteOperator = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus operator ini?', async () => {
      try {
        await api.deleteOperator(id);
        fetchFollowUpOperators();
        showAlert('Operator berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Helper: format value as "Rp 25jt" style
  const formatRpShort = (val) => {
    const num = parseFloat(val);
    if (!num) return 'Rp 0';
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
    if (num >= 1000000) return `Rp ${Math.round(num / 1000000)}jt`;
    if (num >= 1000) return `Rp ${Math.round(num / 1000)}rb`;
    return `Rp ${num}`;
  };

  // Helper: time ago in Indonesian
  const timeAgoId = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return diffMins <= 0 ? 'Baru saja' : `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}h lalu`;
    if (diffDays === 0) return 'Hari ini!';
    if (diffDays === 1) return 'Kemarin';
    return `${diffDays}d lalu`;
  };

  // Helper: get initials color
  const getInitialsColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenOrDownloadFile = (fileUrl, filename) => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = fileUrl;
      const mimeMatch = fileUrl.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : '';
      let ext = 'pdf';
      if (mime.includes('image/')) ext = 'png';
      else if (mime.includes('word') || mime.includes('officedocument') || mime.includes('msword')) ext = 'docx';
      else if (mime.includes('excel') || mime.includes('sheet') || mime.includes('ms-excel')) ext = 'xlsx';
      else if (mime.includes('video/')) ext = 'mp4';
      
      link.download = filename.includes('.') ? filename : `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  // --- Actions ---

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLeadFormData(prev => ({ ...prev, logo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProspectLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFuEditForm(prev => ({ ...prev, logo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAssetFileUpload = (file) => {
    if (!file) return;
    
    // 1. Calculate file size (MB or KB)
    let sizeStr = '1.0 MB';
    if (file.size >= 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = (file.size / 1024).toFixed(0) + ' KB';
    }

    // 2. Determine file type based on mime/extension
    let fileType = 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      fileType = 'Image';
    } else {
      const templateExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar'];
      if (templateExts.includes(ext)) {
        fileType = 'Template';
      } else {
        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
        if (videoExts.includes(ext)) {
          fileType = 'Video';
        }
      }
    }

    // 3. Read file as Base64 Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setAssetFormData(prev => ({
        ...prev,
        file_url: event.target.result,
        size: sizeStr,
        file_type: fileType,
        name: prev.name ? prev.name : file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleVersionFileUpload = (file) => {
    if (!file) return;
    
    // 1. Calculate file size
    let sizeStr = '1.0 MB';
    if (file.size >= 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = (file.size / 1024).toFixed(0) + ' KB';
    }

    // 2. Convert to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewVersionFileUrl(event.target.result);
      setNewVersionFileSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  // Leads CRM
  const saveLead = async (e) => {
    e.preventDefault();
    try {
      const finalLeadData = { ...leadFormData, name: leadFormData.company };
      if (leadFormData.id) {
        await api.updateLead(leadFormData.id, finalLeadData);
        showAlert('Lead berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createLead(finalLeadData);
        showAlert('Lead baru berhasil disimpan.', 'Sukses', 'success');
      }
      setLeadModalOpen(false);
      fetchLeads();
      if (selectedLeadId) {
        fetchLeadDetails(selectedLeadId);
      }
      fetchDashboard();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const changeLeadStatus = async (id, status) => {
    try {
      await api.updateLeadStatus(id, status);
      fetchLeads();
      if (selectedLeadId === id) {
        fetchLeadDetails(id);
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  const deleteLead = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus lead ini?', async () => {
      try {
        await api.deleteLead(id);
        setSelectedLeadId(null);
        setLeadDetail(null);
        fetchLeads();
        fetchDashboard();
        showAlert('Lead berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) {
      setBulkImportError('Konten CSV tidak boleh kosong.');
      return;
    }

    setBulkImportLoading(true);
    setBulkImportError('');

    try {
      const lines = bulkCsvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        throw new Error('CSV harus berisi baris header dan minimal satu baris data.');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const clientsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        const values = currentLine.split(',').map(v => v.trim());
        
        const clientObj = {};
        headers.forEach((header, index) => {
          clientObj[header] = values[index] || '';
        });

        const mappedClient = {
          company: clientObj.company || '',
          name: clientObj.pic_name || clientObj.company || 'New Client',
          industry: clientObj.industry || 'Other',
          source: clientObj.source || 'Organic',
          phone: clientObj.pic_phone || '',
          status: clientObj.status || 'Lead',
          verified: (clientObj.verified && ['yes', 'true', '1', 'ya'].includes(clientObj.verified.toLowerCase())) ? 1 : 0,
          contact_name: clientObj.pic_name || '',
          contact_phone: clientObj.pic_phone || ''
        };

        if (!mappedClient.company && !mappedClient.name) {
          continue;
        }
        clientsToImport.push(mappedClient);
      }

      if (clientsToImport.length === 0) {
        throw new Error('Tidak ada data klien valid yang ditemukan untuk diimpor.');
      }

      const res = await api.bulkImportLeads(clientsToImport);
      showAlert(res.message || 'Bulk import berhasil.', 'Sukses', 'success');
      setBulkModalOpen(false);
      setBulkCsvText('');
      fetchLeads();
      fetchDashboard();
    } catch (err) {
      setBulkImportError(err.message || 'Gagal melakukan bulk import.');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "Company,Industry,Source,PIC_Name,PIC_Phone,Status,Verified\nPT Maju Jaya,Technology,Website,Agus Santoso,+628123456789,Lead,Yes\nCV Kreatif,E-commerce,Instagram Ads,Dewi Lestari,+628998877665,Proposal,No";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "client_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client Contacts
  const addClientContact = async (e) => {
    e.preventDefault();
    if (!contactFormData.name) return;
    try {
      await api.addContact(selectedLeadId, contactFormData.name, contactFormData.phone, contactFormData.email, contactFormData.position, contactFormData.isPrimary);
      setContactFormData({ name: '', phone: '', email: '', position: '', isPrimary: false });
      setContactModalOpen(false);
      fetchLeadDetails(selectedLeadId);
    } catch (err) {
      showAlert('Gagal menambahkan kontak: ' + err.message, 'Gagal', 'error');
    }
  };

  const deleteClientContact = (contactId) => {
    showConfirm('Hapus kontak ini?', async () => {
      try {
        await api.deleteContact(contactId);
        setActiveContactMenuId(null);
        fetchLeadDetails(selectedLeadId);
        showAlert('Kontak berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert('Gagal menghapus kontak: ' + err.message, 'Gagal', 'error');
      }
    });
  };

  const addInteractionLog = async (e) => {
    e.preventDefault();
    if (!newNoteFormData.notes.trim()) return;
    try {
      await api.addInteraction(selectedLeadId, newNoteFormData.type, newNoteFormData.notes);
      setNewNoteFormData({ type: 'Call', notes: '' });
      setNoteModalOpen(false);
      fetchLeadDetails(selectedLeadId);
      fetchLeads();
    } catch (err) {
      alert('Gagal menambahkan interaksi: ' + err.message);
    }
  };

  // Campaigns
  const saveCampaign = async (e) => {
    e.preventDefault();
    try {
      if (campaignFormData.id) {
        await api.updateCampaign(campaignFormData.id, campaignFormData);
        alert('Kampanye berhasil diperbarui.');
      } else {
        await api.createCampaign(campaignFormData);
        alert('Kampanye berhasil dibuat.');
      }
      setCampaignModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCampaign = (id) => {
    showConfirm('Hapus kampanye ini?', async () => {
      try {
        await api.deleteCampaign(id);
        fetchCampaigns();
        showAlert('Kampanye berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Assets
  const saveAsset = async (e) => {
    e.preventDefault();
    try {
      if (assetFormData.id) {
        await api.updateAsset(assetFormData.id, assetFormData);
        showAlert('Aset berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createAsset(assetFormData);
        showAlert('Aset berhasil ditambahkan.', 'Sukses', 'success');
      }
      setAssetModalOpen(false);
      fetchAssets();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const triggerDownloadAsset = async (asset) => {
    try {
      await api.downloadAsset(asset.id);
      fetchAssets();
      handleOpenOrDownloadFile(asset.file_url, asset.name || 'Dokumen');
    } catch (err) {
      console.error(err);
      handleOpenOrDownloadFile(asset?.file_url, asset?.name || 'Dokumen');
    }
  };

  const deleteAsset = (id) => {
    showConfirm('Hapus aset ini dari library?', async () => {
      try {
        await api.deleteAsset(id);
        fetchAssets();
        showAlert('Aset berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Calendar / Social Scheduling
  const saveSocialPost = async (e) => {
    e.preventDefault();
    try {
      if (postFormData.id) {
        await api.updateSocialPost(postFormData.id, postFormData);
        showAlert('Jadwal post berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createSocialPost(postFormData);
        showAlert('Postingan berhasil dijadwalkan.', 'Sukses', 'success');
      }
      setPostModalOpen(false);
      fetchSocialPosts();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteSocialPost = (id) => {
    showConfirm('Batalkan dan hapus postingan ini?', async () => {
      try {
        await api.deleteSocialPost(id);
        fetchSocialPosts();
        showAlert('Postingan berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Profile update self
  const saveProfileSelf = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile(profileFormData);
      setUser(res.user);
      setProfileModalOpen(false);
      alert('Profil Anda berhasil diperbarui.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Helpers
  const getUrgencyClass = (lastContactStr) => {
    if (!lastContactStr) return 'days-urgent';
    const lastContact = new Date(lastContactStr);
    const diffTime = Math.abs(new Date() - lastContact);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) return 'days-urgent';
    if (diffDays >= 3) return 'days-warning';
    return 'days-safe';
  };

  const getUrgencyText = (lastContactStr) => {
    if (!lastContactStr) return '-';
    const lastContact = new Date(lastContactStr);
    const diffTime = Math.abs(new Date() - lastContact);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFigmaStatusText = (status) => {
    if (status === 'Won' || status === 'Done') {
      return 'ACTIVE';
    }
    return 'PROSPECT';
  };

  const channels = ['Facebook Ads', 'Google Ads', 'TikTok Ads', 'Instagram Ads', 'LinkedIn Ads', 'Email Marketing', 'Organic Content'];
  const industriesList = ['Technology', 'E-commerce', 'Tourism', 'Finance', 'F&B', 'Education', 'FMCG', 'Energy', 'Other'];
  const sourcesList = ['Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads', 'LinkedIn Ads', 'Referral', 'Organic', 'Website', 'Event', 'Direct'];

  // 1. SECURE PUBLIC SHARING LANDING PAGE (NO LOGIN REQUIRED)
  if (window.location.pathname.includes('/share/assets/')) {
    return (
      <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="login-card" style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <Megaphone size={28} style={{ color: 'var(--primary-glow)' }} />
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>MarketERP Share</span>
          </div>

          {publicShareLoading ? (
            <div style={{ padding: '40px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '14px', animation: 'spin 1.5s linear infinite' }}>⏱️</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Mengambil materi pemasaran secure share...</p>
            </div>
          ) : publicShareError ? (
            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>Akses Gagal / Link Kedaluwarsa</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{publicShareError}</p>
              </div>
              <a href="/" className="btn btn-secondary" style={{ width: 'fit-content' }}>Kembali ke Login</a>
            </div>
          ) : publicShareAsset ? (() => {
            const a = publicShareAsset;
            const formatColors = {
              'PDF': 'linear-gradient(135deg, #ef4444, #b91c1c)',
              'Template': 'linear-gradient(135deg, #f59e0b, #d97706)',
              'Image': 'linear-gradient(135deg, #ec4899, #db2777)',
              'Video': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            };
            const headerBg = formatColors[a.file_type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* File Icon & Type Banner */}
                <div style={{ background: headerBg, borderRadius: '12px', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '44px' }}>
                    {a.file_type === 'PDF' ? '📄' : a.file_type === 'Template' ? '📝' : a.file_type === 'Image' ? '🖼️' : '📹'}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    {a.file_type} DOCUMENT
                  </span>
                </div>

                {/* Metadata */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.4, marginBottom: '8px' }}>{a.name}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                      {a.category}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      v{a.version}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      {a.size}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Diunggah Oleh:</span>
                      <span style={{ fontWeight: 600 }}>{a.creator_name || 'Siti Sarah'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tanggal Rilis:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Download/Share:</span>
                      <span style={{ fontWeight: 600 }}>{a.download_count || 0} Kali</span>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', fontSize: '14px', fontWeight: 700, background: 'linear-gradient(135deg, var(--primary-glow) 0%, #a855f7 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => triggerDownloadPublicAsset(a.id, a.file_url)}
                >
                  <Download size={16} />
                  <span>Unduh File Materi</span>
                </button>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>🛡️ Verified Secure by MarketERP Share</span>
                </div>
              </div>
            );
          })() : (
            <div style={{ padding: '30px 0', color: 'var(--text-muted)' }}>
              <p>Materi sharing tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!token) {

    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">Marketing ERP</div>
          <div className="login-desc">Sistem Manajemen Kampanye, Leads CRM & Kalender Konten</div>
          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={16} />
              <span>{authError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Operator</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }} 
                  placeholder="admin.@gmail.com" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }} 
                  placeholder="••••••••" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', height: '42px' }}>
              <span>Masuk Sistem</span>
              <ArrowRight size={16} />
            </button>
          </form>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            Info Akun Percobaan:<br />
            <strong>admin.@gmail.com</strong> (Pass: admin123) [Superadmin]<br />
            <strong>baruna.work@gmail.com</strong> (Pass: baruna123) [Admin]
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Intro Animation Overlay */}
      {showIntro && (
        <IntroAnimation onComplete={() => {
          setShowIntro(false);
          sessionStorage.setItem('introShown', 'true');
        }} />
      )}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedLeadId(null);
              setSidebarOpen(false);
            }}
          >
            <Megaphone size={24} style={{ color: '#fff' }} />
            <span>MarketERP</span>
          </div>
          <button 
            className="icon-btn mobile-close-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <ul className="sidebar-menu">
          <li>
            <a 
              className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedLeadId(null);
                setSidebarOpen(false);
              }}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
          </li>
          
          {/* Collapsible Marketing category */}
          <li>
            <div 
              className={`sidebar-item ${['operator-crm', 'digital-marketing', 'follow-up'].includes(currentView) ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setMarketingDropdownOpen(!marketingDropdownOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Megaphone size={20} />
                <span>Marketing</span>
              </div>
              {marketingDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            
            {marketingDropdownOpen && (
              <ul style={{ listStyle: 'none', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <li>
                  <a 
                    className={`sidebar-item ${currentView === 'operator-crm' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('operator-crm');
                      setSelectedLeadId(null);
                      setOperatorTab('leads');
                      setSidebarOpen(false);
                    }}
                  >
                    <Users size={16} />
                    <span>Marketing Operator</span>
                  </a>
                </li>
                <li>
                  <a 
                    className={`sidebar-item ${currentView === 'digital-marketing' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('digital-marketing');
                      setDigitalTab('campaigns');
                      setSidebarOpen(false);
                    }}
                  >
                    <Target size={16} />
                    <span>Marketing Assets</span>
                  </a>
                </li>
                <li>
                  <a 
                    className={`sidebar-item ${currentView === 'follow-up' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('follow-up');
                      setFuSelectedProspect(null);
                      setFollowUpTab('kanban');
                      setSidebarOpen(false);
                    }}
                  >
                    <Calendar size={16} />
                    <span>Follow Up</span>
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <div className="sidebar-footer">
          {user && (
            <>
              <img 
                src={user.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ahmad'} 
                alt="Avatar" 
                className="user-avatar" 
                onClick={() => setProfileModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="icon-btn" onClick={handleLogout} title="Keluar">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <main className="main-content">
        
        {/* HEADER BAR */}
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="icon-btn mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="header-title-container">
              <h1 className="header-title">
                {currentView === 'dashboard' && 'Analytics & Reporting'}
                {currentView === 'operator-crm' && (selectedLeadId ? `Detail Client • ${leadDetail?.lead?.name || ''}` : 'Marketing Operator')}
                {currentView === 'digital-marketing' && 'Marketing Assets'}
                {currentView === 'follow-up' && (fuSelectedProspect ? `Prospect Detail • ${fuSelectedProspect?.lead?.name || ''}` : 'Marketing Follow Up')}
              </h1>
              <span className="header-subtitle">
                Sistem ERP Pemasaran Digital Terpadu • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="header-actions">
            {((currentView === 'operator-crm' && !selectedLeadId) || currentView === 'digital-marketing') && (
              <div className="search-bar-wrapper">
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Search clients by name or industry..." 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
            )}

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => {
                setShowNotifications(!showNotifications);
                if (notificationCount > 0) setNotificationCount(0);
              }}>
                <Bell size={20} />
                {notificationCount > 0 && <span className="badge-dot" />}
              </button>

              {showNotifications && (
                <div style={{ position: 'absolute', right: 0, top: '45px', width: '320px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '16px', zIndex: 1000 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <span>Notifikasi Follow Up</span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-orange)', background: 'rgba(249, 115, 22, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Mendesak</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>Gojek Indonesia</span> meminta proposal review SLA sebelum deadline esok hari.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW ROUTER */}
        <div className="content-body">
          
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && dashboardData && (
            <>
              {/* KPI CARDS */}
              <div className="kpi-grid">
                <div className="kpi-card cyan">
                  <div className="kpi-header">
                    <span>Prospek Aktif (Active Leads)</span>
                    <Users2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.activeLeads}</div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">↑ 12%</span>
                    <span style={{ color: 'var(--text-muted)' }}>dari bulan lalu</span>
                  </div>
                </div>
                <div className="kpi-card green">
                  <div className="kpi-header">
                    <span>Total Deal Won</span>
                    <Award size={18} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.totalWonCount}</div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">↑ 8%</span>
                    <span style={{ color: 'var(--text-muted)' }}>rasio konversi tinggi</span>
                  </div>
                </div>
                <div className="kpi-card red">
                  <div className="kpi-header">
                    <span>Total Deal Loss</span>
                    <XCircle size={18} style={{ color: 'var(--accent-red)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.totalLossCount}</div>
                  <div className="kpi-footer">
                    <span style={{ color: 'var(--text-muted)' }}>Kerugian: </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(dashboardData.summary.totalLossValue)}</span>
                  </div>
                </div>
                <div className="kpi-card orange">
                  <div className="kpi-header">
                    <span>Revenue Won</span>
                    <DollarSign size={18} style={{ color: 'var(--accent-orange)' }} />
                  </div>
                  <div className="kpi-value" style={{ fontSize: '20px', paddingTop: '6px' }}>
                    {formatCurrency(dashboardData.summary.revenueWon)}
                  </div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">↑ Rp 45jt</span>
                    <span style={{ color: 'var(--text-muted)' }}>bulan ini</span>
                  </div>
                </div>
              </div>

              {/* DASHBOARD CHARTS & TABLES BLOCK */}
              <div className="dashboard-grid">
                
                {/* Monthly trend chart */}
                <div className="glass-panel" style={{ minHeight: '380px' }}>
                  <div className="chart-title">
                    <span>Jalur Pendaftaran Leads vs Deal Won (Monthly Trend)</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>6 Bulan Terakhir</span>
                  </div>
                  
                  <div className="chart-container" style={{ paddingLeft: '40px', paddingRight: '20px' }}>
                    <div style={{ position: 'absolute', left: 0, top: 20, bottom: 40, width: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <span>10</span>
                      <span>5</span>
                      <span>0</span>
                    </div>

                    {dashboardData.trendData.map((t, idx) => {
                      const leadHeight = Math.min((t.leads / 10) * 100, 100);
                      const wonHeight = Math.min((t.won / 10) * 100, 100);
                      
                      return (
                        <div key={idx} className="bar-chart-bar">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '180px', width: '100%', justifyContent: 'center' }}>
                            <div 
                              className="bar-fill" 
                              style={{ 
                                height: `${leadHeight}%`, 
                                background: 'linear-gradient(to top, #6366f1, #3b82f6)',
                                width: '14px'
                              }} 
                              title={`Total Leads: ${t.leads}`}
                            />
                            <div 
                              className="bar-fill" 
                              style={{ 
                                height: `${wonHeight}%`, 
                                background: 'linear-gradient(to top, #10b981, #34d399)',
                                width: '14px' 
                              }} 
                              title={`Won Leads: ${t.won}`}
                            />
                          </div>
                          <span className="bar-label">{t.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage distribution */}
                <div className="glass-panel" style={{ minHeight: '380px' }}>
                  <div className="chart-title">
                    <span>Distribusi CRM Leads</span>
                  </div>
                  
                  <div className="pie-chart-container">
                    <div className="donut-chart" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                      <svg width="140" height="140" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-color)" strokeWidth="4" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-cyan)" strokeWidth="4" 
                                strokeDasharray="30 70" strokeDashoffset="25" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-purple)" strokeWidth="4" 
                                strokeDasharray="20 80" strokeDashoffset="95" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-green)" strokeWidth="4" 
                                strokeDasharray="35 65" strokeDashoffset="60" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-red)" strokeWidth="4" 
                                strokeDasharray="15 85" strokeDashoffset="15" />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800 }}>
                          {Object.values(dashboardData.stageDistribution).reduce((a, b) => a + b, 0)}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Leads</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* VIEW: MARKETING OPERATOR */}
          {currentView === 'operator-crm' && (
            <>
              {selectedLeadId && leadDetail ? (
                /* CLIENT DETAIL VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button 
                      className="icon-btn" 
                      style={{ padding: '8px', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}
                      onClick={() => {
                        setSelectedLeadId(null);
                        setLeadDetail(null);
                        fetchLeads();
                      }}
                      title="Kembali ke CRM Portal"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left Card: Company Profile specs */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building size={36} style={{ color: 'var(--accent-cyan)' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{leadDetail.lead.name}</h3>
                          {leadDetail.lead.company && (
                            <h4 style={{ fontSize: '15px', color: 'var(--accent-cyan)', marginTop: '4px' }}>{leadDetail.lead.company}</h4>
                          )}
                          <span className={`badge ${leadDetail.lead.status === 'Won' || leadDetail.lead.status === 'Done' ? 'badge-won' : 'badge-hold'}`} style={{ marginTop: '8px' }}>
                            {getFigmaStatusText(leadDetail.lead.status)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Building size={12} />
                            <span>Industry</span>
                          </div>
                          <div style={{ fontWeight: 600 }}>{leadDetail.lead.industry || 'N/A'}</div>
                        </div>

                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Target size={12} />
                            <span>Lead Source</span>
                          </div>
                          <div style={{ fontWeight: 600 }}>{leadDetail.lead.source || 'N/A'}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Created At</div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{getUrgencyText(leadDetail.lead.created_at)}</div>
                          </div>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Last Communication</div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{getUrgencyText(leadDetail.lead.last_contact)}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexFlow: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {['Superadmin', 'Admin'].includes(user?.role) && (
                          <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, justifyContent: 'center' }}
                              onClick={() => {
                                setLeadFormData({
                                  id: leadDetail.lead.id,
                                  name: leadDetail.lead.name,
                                  company: leadDetail.lead.company,
                                  industry: leadDetail.lead.industry,
                                  source: leadDetail.lead.source,
                                  value: leadDetail.lead.value,
                                  lead_score: leadDetail.lead.lead_score,
                                  owner_id: leadDetail.lead.owner_id,
                                  verified: leadDetail.lead.verified,
                                  phone: leadDetail.lead.phone || '',
                                  logo_url: leadDetail.lead.logo_url || '',
                                  location: leadDetail.lead.location || 'Jakarta',
                                  company_size: leadDetail.lead.company_size || '50-200',
                                  contact1_name: leadDetail.contacts && leadDetail.contacts[0] ? leadDetail.contacts[0].name : '',
                                  contact1_phone: leadDetail.contacts && leadDetail.contacts[0] ? leadDetail.contacts[0].phone : '',
                                  contact2_name: leadDetail.contacts && leadDetail.contacts[1] ? leadDetail.contacts[1].name : '',
                                  contact2_phone: leadDetail.contacts && leadDetail.contacts[1] ? leadDetail.contacts[1].phone : '',
                                  deadline: leadDetail.lead.deadline ? leadDetail.lead.deadline.substring(0, 10) : ''
                                });
                                setLeadModalOpen(true);
                              }}
                            >
                              <Edit3 size={14} />
                              <span>Edit Client</span>
                            </button>
                            
                            <button 
                              className="btn btn-danger" 
                              style={{ background: '#ff1493', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}
                              onClick={() => deleteLead(leadDetail.lead.id)}
                              title="Hapus Client"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Convert to Project Option */}
                      {['Superadmin', 'Admin'].includes(user?.role) && ['Won', 'Done'].includes(leadDetail.lead.status) && (
                        <button 
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            setProjectFormData({
                              id: '',
                              client_id: leadDetail.lead.id,
                              name: `Implementasi ERP - ${leadDetail.lead.company || leadDetail.lead.name}`,
                              description: `Proyek implementasi ERP untuk klien ${leadDetail.lead.name}.`,
                              budget: leadDetail.lead.value,
                              status: 'Planning',
                              progress: 0,
                              deadline: ''
                            });
                            setProjectModalOpen(true);
                          }}
                        >
                          <Plus size={16} />
                          <span>Buat Proyek</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Contacts */}
                      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span>Client Contacts</span>
                          </h4>
                          {['Superadmin', 'Admin'].includes(user?.role) && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => setContactModalOpen(true)}
                            >
                              <span>+ Add Contact</span>
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                          {leadDetail.contacts && leadDetail.contacts.length > 0 ? (
                            leadDetail.contacts.map((c, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  padding: '14px', 
                                  background: 'rgba(255,255,255,0.02)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users2 size={16} />
                                </div>
                                <div style={{ flexGrow: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                    {(c.isPrimary === 1 || c.isPrimary === true) && (
                                      <span style={{ fontSize: '9px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Utama</span>
                                    )}
                                  </div>
                                  {c.position && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1px' }}>{c.position}</div>
                                  )}
                                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Phone size={10} />
                                    <span>{c.phone || '-'}</span>
                                  </div>
                                  {c.email && (
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                      {c.email}
                                    </div>
                                  )}
                                </div>
                                
                                 {['Superadmin', 'Admin'].includes(user?.role) && (
                                  <div style={{ position: 'relative' }}>
                                    <button 
                                      className="icon-btn" 
                                      style={{ color: 'var(--text-muted)' }} 
                                      onClick={() => setActiveContactMenuId(activeContactMenuId === c.id ? null : c.id)}
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {activeContactMenuId === c.id && (
                                      <div style={{ position: 'absolute', right: 0, top: '20px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--accent-red)', border: 'none', background: 'transparent' }}
                                          onClick={() => deleteClientContact(c.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                              Belum ada kontak terdaftar.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactions & Notes */}
                      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span>Interactions & Notes</span>
                          </h4>
                          {['Superadmin', 'Admin'].includes(user?.role) && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => {
                                setNewNoteFormData({ type: 'Call', notes: '' });
                                setNoteModalOpen(true);
                              }}
                            >
                              <span>+ Add Note</span>
                            </button>
                          )}
                        </div>

                        {leadDetail.interactions && leadDetail.interactions.length > 0 ? (
                          <div className="interaction-timeline" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {leadDetail.interactions.map((it, idx) => (
                              <div key={idx} className="interaction-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                  <span>{it.type}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(it.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                                <p style={{ marginTop: '4px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{it.notes}</p>
                                <div className="interaction-meta">Oleh: {it.creator_name}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '12px', color: 'var(--text-muted)', padding: '40px 0' }}>
                            <FileText size={48} strokeWidth={1} style={{ opacity: 0.4 }} />
                            <div style={{ fontSize: '13px' }}>No interactions logged yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIN CRM OPERATOR VIEWS WITH TABS */
                <>
                  {/* Top tabs */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <button 
                      className={`btn ${operatorTab === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOperatorTab('leads')}
                    >
                      <Users size={16} />
                      <span>Lead Management</span>
                    </button>
                    <button 
                      className={`btn ${operatorTab === 'segments' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOperatorTab('segments')}
                    >
                      <Filter size={16} />
                      <span>Customer Segmentation</span>
                    </button>
                    {['Superadmin', 'Admin'].includes(user?.role) && (
                      <button 
                        className={`btn ${operatorTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setOperatorTab('roles')}
                      >
                        <KeyRound size={16} />
                        <span>Role & Operators</span>
                      </button>
                    )}
                  </div>

                  {/* TAB 1: CRM Leads table */}
                  {operatorTab === 'leads' && (
                    <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>CRM Portal</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Client Management Hub</span>
                        </div>
                        {['Superadmin', 'Admin'].includes(user?.role) && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => {
                                setBulkCsvText('');
                                setBulkImportError('');
                                setBulkModalOpen(true);
                              }}
                            >
                              <span>+ Bulk Import</span>
                            </button>
                            <button 
                              className="btn" 
                              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => {
                                setLeadFormData({ id: '', name: '', company: '', industry: 'Technology', source: 'Organic', value: '', lead_score: 50, owner_id: user.id, verified: false, phone: '', logo_url: '', location: 'Jakarta', company_size: '50-200', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', deadline: '' });
                                setLeadModalOpen(true);
                              }}
                            >
                              <span>+ New Client</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>LOGO</th>
                              <th>PERUSAHAAN</th>
                              <th>INDUSTRY</th>
                              <th>SOURCE</th>
                              <th>LAST CONTACT</th>
                              <th>VERIFIED</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map((l, i) => (
                              <tr key={i} style={{ cursor: 'pointer' }} onClick={() => fetchLeadDetails(l.id)}>
                                <td>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {l.logo_url ? (
                                      <img src={l.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                      <Building size={14} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, color: 'white' }}>{l.company || '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building size={13} style={{ color: 'var(--text-muted)' }} />
                                    <span>{l.industry || '-'}</span>
                                  </div>
                                </td>
                                <td>{l.source || '-'}</td>
                                <td>
                                  <span style={{ fontSize: '13px', color: getUrgencyClass(l.last_contact) === 'days-urgent' ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                    {getUrgencyText(l.last_contact)}
                                  </span>
                                </td>
                                <td>
                                  {l.verified ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', background: 'var(--accent-cyan)', borderRadius: '3px', color: 'black' }}>
                                      <Check size={11} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div style={{ width: '16px', height: '16px', border: '1px solid var(--border-color)', borderRadius: '3px' }} />
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        background: 'transparent',
                                        border: l.status === 'Won' || l.status === 'Done' ? '1px solid var(--accent-green)' : '1px solid var(--accent-orange)',
                                        color: l.status === 'Won' || l.status === 'Done' ? 'var(--accent-green)' : 'var(--accent-orange)',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {getFigmaStatusText(l.status)}
                                    </span>
                                    {['Superadmin', 'Admin'].includes(user?.role) && (
                                      <button
                                        className="icon-btn"
                                        style={{ color: 'var(--accent-red)', opacity: 0.7, padding: '4px' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteLead(l.id);
                                        }}
                                        title="Hapus Klien"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Customer Segmentation */}
                  {operatorTab === 'segments' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Customer Segmentation</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Segmentasi dinamis berdasarkan kriteria CRM</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {segments.map((seg, idx) => {
                          const isExpanded = expandedSegmentId === seg.id;
                          let matchedLeads = [];
                          if (seg.id === 'high-score') {
                            matchedLeads = leads.filter(l => l.lead_score >= 80);
                          } else if (seg.id === 'enterprise-tier') {
                            matchedLeads = leads.filter(l => parseFloat(l.value) >= 200000000);
                          } else if (seg.id === 'digital-ads') {
                            matchedLeads = leads.filter(l => ['Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads'].includes(l.source));
                          } else if (seg.id === 'pt-accounts') {
                            matchedLeads = leads.filter(l => (l.company || '').toUpperCase().includes('PT') || (l.name || '').toUpperCase().includes('PT'));
                          } else if (seg.id === 'proposal-stage') {
                            matchedLeads = leads.filter(l => l.status === 'Proposal');
                          } else {
                            matchedLeads = leads.filter(l => !l.last_contact || (new Date() - new Date(l.last_contact) > 7 * 24 * 60 * 60 * 1000));
                          }

                          return (
                            <div 
                              key={idx} 
                              className="glass-panel" 
                              style={{ 
                                cursor: 'pointer', 
                                borderLeft: `4px solid ${seg.color}`,
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                              onClick={() => setExpandedSegmentId(isExpanded ? null : seg.id)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{seg.title}</h4>
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kriteria: {seg.criteria}</span>
                                </div>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: seg.color }}>
                                  {matchedLeads.length} leads
                                </span>
                              </div>

                              {isExpanded && (
                                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }} onClick={(e) => e.stopPropagation()}>
                                  <div className="table-container">
                                    <table className="custom-table" style={{ background: 'rgba(0,0,0,0.1)' }}>
                                      <thead>
                                        <tr>
                                          <th>Logo</th>
                                          <th>Client Name</th>
                                          <th>Perusahaan</th>
                                          <th>Industry</th>
                                          <th>Lead Score</th>
                                          <th>Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {matchedLeads.map((ml, mlIdx) => (
                                          <tr key={mlIdx} style={{ cursor: 'pointer' }} onClick={() => fetchLeadDetails(ml.id)}>
                                            <td>
                                              <Building size={14} />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{ml.name}</td>
                                            <td>{ml.company || '-'}</td>
                                            <td>{ml.industry}</td>
                                            <td>{ml.lead_score}/100</td>
                                            <td>{formatCurrency(ml.value)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                                    <button 
                                      className="btn btn-primary"
                                      onClick={() => alert(`Mengirim pesan blast ke segment [${seg.title}]...`)}
                                    >
                                      <Send size={14} style={{ marginRight: '6px' }} />
                                      <span>Kirim Pesan ke Segment Ini</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* TAB 3: Operators Role Directory */}
                  {operatorTab === 'roles' && (
                    <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Operator & Role Directory</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kelola akses pengguna dan operator ERP Marketing</span>
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setOperatorFormData({ id: '', username: '', name: '', email: '', password: '', phone: '', role: 'Operator', status: 'Active' });
                            setOperatorModalOpen(true);
                          }}
                        >
                          <Plus size={16} />
                          <span>+ Tambah Operator</span>
                        </button>
                      </div>

                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>OPERATOR NAME</th>
                              <th>EMAIL ADDRESS</th>
                              <th>WHATSAPP PHONE</th>
                              <th>SYSTEM ROLE</th>
                              <th>STATUS</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(Array.isArray(fuOperators) ? fuOperators : []).map((op, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={op.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ahmad'} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                    <span>{op.name}</span>
                                  </div>
                                </td>
                                <td>{op.email}</td>
                                <td>{op.phone || '-'}</td>
                                <td>
                                  <span className={`badge`} style={{
                                    background: op.role === 'Superadmin' ? 'rgba(245,158,11,0.15)' : op.role === 'Admin' ? 'rgba(239,68,68,0.15)' : op.role === 'Digital Marketing' ? 'rgba(168,85,247,0.15)' : 'rgba(6,182,212,0.15)',
                                    color: op.role === 'Superadmin' ? 'var(--accent-orange)' : op.role === 'Admin' ? 'var(--accent-red)' : op.role === 'Digital Marketing' ? 'var(--accent-purple)' : 'var(--accent-cyan)'
                                  }}>
                                    {op.role}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge" style={{
                                    background: op.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                    color: op.status === 'Active' ? 'var(--accent-green)' : 'var(--text-muted)'
                                  }}>{op.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" onClick={() => {
                                      setOperatorFormData({
                                        id: op.id,
                                        username: op.username || '',
                                        name: op.name,
                                        email: op.email,
                                        password: '',
                                        phone: op.phone || '',
                                        role: op.role,
                                        status: op.status
                                      });
                                      setOperatorModalOpen(true);
                                    }}>
                                      <Edit3 size={14} />
                                    </button>
                                    {op.id !== user?.id && (
                                      <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteOperator(op.id)}>
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
            </>
          )}

          {/* VIEW: MARKETING DIGITAL */}
          {currentView === 'digital-marketing' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button 
                  className={`btn ${digitalTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDigitalTab('campaigns')}
                >
                  <FolderHeart size={16} />
                  <span>Manajemen Konten & Aset</span>
                </button>
                <button 
                  className={`btn ${digitalTab === 'assets' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDigitalTab('assets')}
                >
                  <FolderHeart size={16} />
                  <span>Asset Library</span>
                </button>
              </div>

              {digitalTab === 'campaigns' && (
                <>
                  {/* Stats summary panel */}
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
                    <div className="kpi-card cyan">
                      <div className="kpi-header">
                        <span>Total Materi Pemasaran</span>
                      </div>
                      <div className="kpi-value">{assets.length} Aset</div>
                    </div>
                    <div className="kpi-card green">
                      <div className="kpi-header">
                        <span>Dibagikan ke Sales</span>
                      </div>
                      <div className="kpi-value">{assets.filter(a => a.sharing_status === 'Shared').length} Aset</div>
                    </div>
                    <div className="kpi-card orange">
                      <div className="kpi-header">
                        <span>Total Download & Bagikan</span>
                      </div>
                      <div className="kpi-value">{assets.reduce((a, b) => a + (b.download_count || 0), 0)} Kali</div>
                    </div>
                  </div>

                  {/* Toolbar & Filters */}
                  <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      {/* Search Bar */}
                      <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search cepat materi..."
                          value={assetSearchTerm}
                          onChange={e => setAssetSearchTerm(e.target.value)}
                          style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                        />
                      </div>

                      {/* Upload Button */}
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setAssetFormData({ id: '', name: '', file_type: 'PDF', category: 'CFD/FEA', tags: '', file_url: '', version: '1.0', sharing_status: 'Shared', size: '2.4 MB' });
                          setAssetModalOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                      >
                        <Plus size={16} />
                        <span>Upload Materi Baru</span>
                      </button>
                    </div>

                    {/* Category tabs filters */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
                      {['Semua', 'CFD/FEA', 'Case Study', 'Proposal Template', 'Foto Proyek', 'Whitepaper'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setAssetCategoryFilter(cat)}
                          style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            background: assetCategoryFilter === cat ? 'var(--primary-glow)' : 'transparent',
                            border: `1px solid ${assetCategoryFilter === cat ? 'var(--primary-glow)' : 'var(--border-color)'}`,
                            color: assetCategoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document & Asset List */}
                  {assets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <FolderHeart size={44} style={{ opacity: 0.2, marginBottom: '10px' }} />
                      <p style={{ fontSize: '13px' }}>Tidak ada materi pemasaran yang cocok dengan filter atau pencarian Anda.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {assets.map((a) => {
                        const categoryConfig = {
                          'CFD/FEA': { color: '#06b6d4', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)', label: 'CFD/FEA' },
                          'Case Study': { color: '#a855f7', bg: 'linear-gradient(135deg, #a855f7, #6366f1)', label: 'Case Study' },
                          'Proposal Template': { color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #e11d48)', label: 'Proposal Template' },
                          'Foto Proyek': { color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)', label: 'Foto Proyek' },
                          'Whitepaper': { color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #059669)', label: 'Whitepaper' },
                        };
                        const cfg = categoryConfig[a.category] || { color: '#6b7280', bg: 'linear-gradient(135deg, #6b7280, #374151)', label: a.category || 'Materi' };

                        return (
                          <div
                            key={a.id}
                            className="glass-panel"
                            style={{
                              background: 'rgba(15,23,42,0.65)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '14px',
                              padding: '20px',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Card Top: Category Banner & Delete */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                                background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}35`
                              }}>
                                {cfg.label}
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="icon-btn"
                                  onClick={() => {
                                    setAssetFormData({ id: a.id, name: a.name, file_type: a.file_type, category: a.category, tags: a.tags || '', file_url: a.file_url || '', version: a.version || '1.0', sharing_status: a.sharing_status || 'Shared', size: a.size || '2.4 MB' });
                                    setAssetModalOpen(true);
                                  }}
                                  title="Edit"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteAsset(a.id)} title="Hapus">✕</button>
                              </div>
                            </div>

                            {/* Document Title & Icon */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', margin: '6px 0' }}>
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '8px', background: cfg.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', flexShrink: 0
                              }}>
                                {a.file_type === 'PDF' ? '📄' : a.file_type === 'Template' ? '📝' : a.file_type === 'Image' ? '🖼️' : '📹'}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.4, margin: 0, wordBreak: 'break-word' }}>
                                  {a.name}
                                </h4>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {a.size || '2.4 MB'} · {a.file_type}
                                </div>
                              </div>
                            </div>

                            {/* Metadata & Tags */}
                            {a.tags && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {a.tags.split(',').map((tag, idx) => (
                                  <span key={idx} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                                    #{tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Version Control section */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                              fontSize: '11px'
                            }}>
                              <span style={{ color: 'var(--text-muted)' }}>Versi Aktif:</span>
                              <button
                                onClick={() => setSelectedAssetHistory(a)}
                                style={{
                                  background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.4)',
                                  borderRadius: '4px', padding: '2px 8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                                title="Klik untuk lihat riwayat versi"
                              >
                                ⏱️ v{a.version || '1.0'}
                              </button>
                            </div>

                            {/* Sharing status badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%',
                                  background: a.sharing_status === 'Shared' ? 'var(--accent-green)' : 'var(--text-muted)'
                                }} />
                                <span style={{ fontWeight: 600, color: a.sharing_status === 'Shared' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                  {a.sharing_status === 'Shared' ? 'Shared with Sales' : 'Private'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {a.download_count || 0} shares
                              </span>
                            </div>

                            {/* Actions block */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '7px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                onClick={() => setShareModalAsset(a)}
                              >
                                <Share2 size={12} />
                                <span>Bagikan</span>
                              </button>
                              <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '7px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--primary-glow)', border: 'none' }}
                                onClick={() => triggerDownloadAsset(a)}
                              >
                                <Download size={12} />
                                <span>Unduh</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}


              {digitalTab === 'assets' && (
                <>
                  <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Perpustakaan Aset Kreatif</h3>
                    <button className="btn btn-primary" onClick={() => {
                      setAssetFormData({ id: '', name: '', file_type: 'Image', tags: '', file_url: '' });
                      setAssetModalOpen(true);
                    }}>
                      <Plus size={16} />
                      <span>Upload Aset</span>
                    </button>
                  </div>

                  <div className="asset-grid">
                    {assets.map((a, i) => (
                      <div key={i} className="asset-card">
                        <FolderHeart size={28} style={{ color: 'var(--primary-glow)' }} />
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.name}</div>
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-glow)', width: 'fit-content' }}>{a.file_type}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px' }}>
                          <span>{a.download_count} downloads</span>
                          <button className="icon-btn" onClick={() => triggerDownloadAsset(a)}>
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ====== FOLLOW UP VIEW (2-tab: Pipeline + Social Media) ====== */}
          {currentView === 'follow-up' && (
            <>
              {/* === Deadline Alert Banner === */}
              {deadlineAlerts.length > 0 && !alertBannerDismissed && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 18px', borderRadius: '10px', marginBottom: '16px',
                  background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))',
                  border: '1px solid rgba(239,68,68,0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b' }}>
                        ⚠️ {deadlineAlerts.length} Prospek Deadline Mendekati
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {deadlineAlerts.map(a => {
                          const d = new Date(a.deadline);
                          const isToday = d.toDateString() === new Date().toDateString();
                          return (
                            <span key={a.id} style={{ marginRight: '12px' }}>
                              <span style={{ color: isToday ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{a.name}</span>
                              {' '}({isToday ? 'Hari Ini!' : 'Besok H-1'})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setAlertBannerDismissed(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
              )}

              {/* 2-tab navigation */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button
                  className={`btn ${followUpTab === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFollowUpTab('kanban')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Follow Up Pipeline
                </button>
                <button
                  className={`btn ${followUpTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFollowUpTab('calendar')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Social Media
                </button>
              </div>

              {/* ===== TAB 1: FOLLOW UP PIPELINE ===== */}
              {followUpTab === 'kanban' && (
                <>
                  {fuSelectedProspect ? (
                    /* ---- PROSPECT DETAIL VIEW (split 2 columns) ---- */
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'flex-start' }}>
                      {/* LEFT: Prospect Info */}
                      <div>
                        <button
                          className="btn btn-secondary"
                          style={{ marginBottom: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setFuSelectedProspect(null)}
                        >
                          &larr; Back to Kanban
                        </button>

                        <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.5)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)' }}>
                              PROSPECT LEAD
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="icon-btn" onClick={() => openFuEditModal(fuSelectedProspect.lead)} title="Edit"><Edit3 size={14} /></button>
                              <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteFuProspect(fuSelectedProspect.lead.id)} title="Hapus"><Trash2 size={14} /></button>
                            </div>
                          </div>

                          <div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>{fuSelectedProspect.lead?.name}</h2>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{fuSelectedProspect.lead?.company || '-'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                              {fuSelectedProspect.lead?.id && `ID-${String(fuSelectedProspect.lead.id).padStart(3,'0')}`}
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>CONTACT PERSON</div>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{fuSelectedProspect.lead?.contact_name || '-'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{fuSelectedProspect.lead?.phone || '-'}</div>
                            {fuSelectedProspect.lead?.phone && (
                              <a
                                href={`https://wa.me/${(fuSelectedProspect.lead.phone || '').replace(/\D/g,'')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '12px', color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <Phone size={12} /> Hubungi via WhatsApp
                              </a>
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>STATUS STAGE</div>
                            {(() => {
                              const stageColors = { Lead: '#3b82f6', Proposal: '#8b5cf6', Hold: '#f59e0b', Lose: '#ef4444', Lost: '#ef4444', Won: '#10b981', Done: '#10b981' };
                              const s = fuSelectedProspect.lead?.status || 'Lead';
                              return (
                                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${stageColors[s] || '#3b82f6'}20`, color: stageColors[s] || '#3b82f6', border: `1px solid ${stageColors[s] || '#3b82f6'}40` }}>
                                  {s}
                                </span>
                              );
                            })()}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>TANGGAL MASUK</div>
                              <div style={{ fontSize: '13px' }}>{fuSelectedProspect.lead?.created_at ? new Date(fuSelectedProspect.lead.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>NILAI PROSPEK</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)' }}>{formatCurrency(fuSelectedProspect.lead?.value)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>SUMBER</div>
                              <div style={{ fontSize: '13px' }}>{fuSelectedProspect.lead?.source || '-'}</div>
                            </div>
                            {fuSelectedProspect.lead?.deadline && (
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>DEADLINE</div>
                                <div style={{ fontSize: '13px' }}>{new Date(fuSelectedProspect.lead.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              </div>
                            )}
                            {fuSelectedProspect.interactions && fuSelectedProspect.interactions.length > 0 && (
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>LAST COMMUNICATION</div>
                                <div style={{ fontSize: '13px' }}>
                                  {(() => {
                                    const last = fuSelectedProspect.interactions[0];
                                    const diff = Math.floor((new Date() - new Date(last.created_at)) / (1000 * 60 * 60 * 24));
                                    return diff === 0 ? 'Hari ini' : `${diff} hari yang lalu`;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Subtasks Panel */}
                      <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.4)', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Subtasks</h3>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => { setFuTaskForm({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' }); setFuTaskModalOpen(true); }}
                          >
                            <Plus size={14} /> Add Task
                          </button>
                        </div>

                        {fuTaskModalOpen && (
                          <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid var(--accent-cyan)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.8px' }}>ADD NEW TASK</span>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }} onClick={() => setFuTaskModalOpen(false)}>x</button>
                            </div>
                            <form onSubmit={saveFuNewSubtask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" className="form-input" placeholder="Task Name" required style={{ flex: 1 }}
                                  value={fuTaskForm.name} onChange={e => setFuTaskForm({ ...fuTaskForm, name: e.target.value })} />
                                <input type="date" className="form-input" style={{ width: '150px' }}
                                  value={fuTaskForm.deadline} onChange={e => setFuTaskForm({ ...fuTaskForm, deadline: e.target.value })} />
                              </div>
                              <input type="text" className="form-input" placeholder="Description"
                                value={fuTaskForm.description} onChange={e => setFuTaskForm({ ...fuTaskForm, description: e.target.value })} />
                              <input type="text" className="form-input" placeholder="Resource Link (Optional)"
                                value={fuTaskForm.resource_link} onChange={e => setFuTaskForm({ ...fuTaskForm, resource_link: e.target.value })} />
                              <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ASSIGN TO (MANAJEMEN ONLY)</label>
                                <select className="form-select" value={fuTaskForm.assigned_to} onChange={e => setFuTaskForm({ ...fuTaskForm, assigned_to: e.target.value })}>
                                  <option value="">Unassigned</option>
                                  {(Array.isArray(fuOperators) ? fuOperators : []).map(op => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button type="button" className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setFuTaskModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ fontSize: '12px', background: 'var(--accent-cyan)', color: 'black', fontWeight: 700 }}>Create Subtask</button>
                              </div>
                            </form>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {fuSubtasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                              <CheckSquare size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                              <p style={{ fontSize: '13px' }}>Belum ada subtask. Klik "+ Add Task" untuk menambahkan.</p>
                            </div>
                          ) : fuSubtasks.map(task => {
                            const progressMap = { 'MT': 0, 'IFR': 25, 'EX': 50, 'IFC': 75, 'DONE': 100 };
                            const prog = progressMap[task.status] ?? task.progress ?? 0;
                            const statusColors = { MT: '#3b82f6', IFR: '#f59e0b', EX: '#8b5cf6', IFC: '#06b6d4', DONE: '#10b981' };
                            return (
                              <div key={task.id} className="glass-panel" style={{ background: task.status === 'DONE' ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', border: task.status === 'DONE' ? '1px solid rgba(16,185,129,0.15)' : '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                  <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                                    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                      <circle cx="22" cy="22" r="18" fill="none" stroke={statusColors[task.status] || '#3b82f6'} strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 18}`}
                                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - prog / 100)}`}
                                        strokeLinecap="round" />
                                    </svg>
                                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{prog}%</span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{task.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>0</span></span>
                                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {['MT', 'IFR', 'EX', 'IFC', 'DONE'].map(st => (
                                          <button
                                            key={st}
                                            onClick={() => updateFuSubtaskStatus(task.id, st)}
                                            style={{
                                              fontSize: '9px', padding: '2px 5px', borderRadius: '3px', cursor: 'pointer', fontWeight: 700,
                                              background: task.status === st ? statusColors[st] : 'transparent',
                                              border: `1px solid ${task.status === st ? statusColors[st] : 'var(--border-color)'}`,
                                              color: task.status === st ? (st === 'IFR' ? '#000' : '#fff') : 'var(--text-muted)'
                                            }}
                                          >
                                            {st === 'MT' ? 'M' : st}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {task.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>{task.description}</p>}
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
                                      {task.assigned_name && <span>By: <b>{task.assigned_name}</b></span>}
                                      {task.assigned_name && <span style={{ color: 'var(--accent-cyan)' }}>Assigned {task.assigned_name}</span>}
                                      {task.deadline && (() => {
                                        const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                        const overdue = daysLeft < 0;
                                        return <span style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>Deadline: {overdue ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}</span>;
                                      })()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                      <button className="icon-btn" style={{ opacity: 0.5 }}><Bell size={12} /></button>
                                      <button className="icon-btn" style={{ opacity: 0.5 }}><Edit3 size={12} /></button>
                                      <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteFuSubtask(task.id)}><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', width: '220px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="form-input" placeholder="Cari klien..."
                              value={fuSearch}
                              onChange={e => setFuSearch(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') fetchFollowUpLeads(); }}
                              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                            />
                          </div>

                          {/* Stage filters buttons (mockup screenshot 2 style) */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                            {[
                              { label: 'Semua', value: 'Semua', color: 'var(--primary-glow)' },
                              { label: 'Lead', value: 'Lead', color: '#3b82f6' },
                              { label: 'Proposal', value: 'Proposal', color: '#8b5cf6' },
                              { label: 'Hold', value: 'Hold', color: '#f59e0b' },
                              { label: 'Loss', value: 'Lose', color: '#ef4444' },
                              { label: 'Won', value: 'Won', color: '#10b981' },
                              { label: 'Done', value: 'Done', color: '#06b6d4' }
                            ].map(btn => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => setFuStageFilter(btn.value)}
                                style={{
                                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                  background: fuStageFilter === btn.value ? btn.color : 'transparent',
                                  border: 'none',
                                  color: fuStageFilter === btn.value ? (btn.value === 'Hold' ? 'black' : '#fff') : 'var(--text-secondary)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button className="btn btn-primary"
                          style={{ height: '38px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setFuEditForm({ id: '', name: '', company: '', source: 'Organic', phone: '', deadline: '', value: '', notes: '', status: 'Lead', industry: 'Other' });
                            setFuNewContactPhone('');
                            setFuNewContactNotes('');
                            setFuEditModalOpen(true);
                          }}
                        >
                          <Plus size={16} /> Tambah Prospek
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '20px', minHeight: '500px' }}>
                        {[
                          { stage: 'Lead', color: '#3b82f6' },
                          { stage: 'Proposal', color: '#8b5cf6' },
                          { stage: 'Hold', color: '#f59e0b' },
                          { stage: 'Lose', color: '#ef4444' },
                          { stage: 'Won', color: '#10b981' },
                          { stage: 'Done', color: '#06b6d4' }
                        ].filter(col => fuStageFilter === 'Semua' || col.stage === fuStageFilter)
                         .map(({ stage, color }) => {
                          const colLeads = (Array.isArray(leads) ? leads : []).filter(l => l.status === stage);
                          return (
                            <div key={stage} style={{ 
                              minWidth: fuStageFilter === 'Semua' ? '215px' : '360px', 
                              flex: fuStageFilter === 'Semua' ? '0 0 215px' : '0 0 360px', 
                              display: 'flex', flexDirection: 'column' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px 8px 0 0', background: `${color}18`, borderBottom: `3px solid ${color}`, marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color }}>{stage}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, background: `${color}30`, color, width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{colLeads.length}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {colLeads.map(lead => {
                                  const urgencyDays = lead.deadline ? Math.ceil((new Date(lead.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                                  const isOverdue = urgencyDays !== null && urgencyDays < 0;
                                  const isToday = urgencyDays === 0;
                                  const isTomorrow = urgencyDays === 1;
                                  const sourceColors = { 'Instagram Ads': '#e1306c', 'Google Ads': '#4285F4', 'Facebook Ads': '#1877F2', 'TikTok Ads': '#69C9D0', 'LinkedIn': '#0A66C2', 'Referral': '#8b5cf6', 'Organic': '#10b981', 'Cold Call': '#f59e0b' };
                                  const srcColor = sourceColors[lead.source] || '#06b6d4';

                                  // Generate avatar initials and gradient
                                  const words = (lead.name || '').split(' ');
                                  const initials = (words[0]?.[0] || '') + (words[1]?.[0] || words[0]?.[1] || '');
                                  const avatarColors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#e1306c','#ec4899'];
                                  const avatarColor = avatarColors[lead.id % avatarColors.length] || '#3b82f6';

                                  return (
                                    <div key={lead.id} className="kanban-card"
                                      style={{ cursor: 'pointer', padding: '12px 14px', background: 'rgba(15,23,42,0.7)', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                                      onClick={() => openFuProspectDetail(lead.id)}
                                    >
                                      {/* Top row: avatar + name/company + edit */}
                                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0, textTransform: 'uppercase' }}>
                                          {initials || '??'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                                            {lead.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</div>}
                                            {lead.no_project && <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{lead.no_project}</div>}
                                          </div>
                                        </div>
                                        <button className="icon-btn" style={{ flexShrink: 0, opacity: 0.7 }}
                                          onClick={e => { e.stopPropagation(); openFuEditModal(lead); }}>
                                          <Edit3 size={12} />
                                        </button>
                                      </div>

                                      {/* Source + Value row */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: srcColor }}>{lead.source || 'Organic'}</span>
                                        {lead.value && parseFloat(lead.value) > 0 && (
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            Rp {(parseFloat(lead.value) / 1e6).toFixed(0)}jt
                                          </span>
                                        )}
                                      </div>

                                      {/* Phone */}
                                      {lead.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                          <Phone size={10} /> {lead.phone}
                                        </div>
                                      )}

                                      {/* Deadline badge */}
                                      {urgencyDays !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: isOverdue ? '#ef4444' : isToday ? '#ef4444' : isTomorrow ? '#f59e0b' : 'var(--text-muted)', marginBottom: lead.last_contact ? '8px' : '0' }}>
                                          <Clock size={10} />
                                          {isOverdue ? `${Math.abs(urgencyDays)}h terlambat` : isToday ? 'Hari Ini!' : isTomorrow ? 'Besok (H-1)' : `${urgencyDays}h lagi`}
                                        </div>
                                      )}

                                      {/* Terakhir Kontak box — shown only if last_contact exists */}
                                      {lead.last_contact && (
                                        <div style={{ marginTop: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '7px 10px' }}>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px', marginBottom: '3px' }}>Terakhir Kontak</div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {lead.last_contact_phone && <span>{lead.last_contact_phone}</span>}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {lead.last_contact_name && <span>{lead.last_contact_name} · </span>}
                                            {new Date(lead.last_contact).toISOString().split('T')[0]}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ===== TAB 2: SOCIAL MEDIA ===== */}
              {followUpTab === 'calendar' && (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        📅 Kalender Konten Sosmed
                      </h3>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Jadwalkan dan kelola konten untuk semua platform media sosial Anda</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* Stats summary */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['Published', 'Scheduled', 'Draft'].map(s => {
                          const count = posts.filter(p => p.status === s).length;
                          const colors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
                          return (
                            <div key={s} style={{ background: `${colors[s]}15`, border: `1px solid ${colors[s]}30`, borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: colors[s] }}>{count}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{s}</div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}
                        onClick={() => { setPostFormData({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' }); setPostModalOpen(true); }}
                      >
                        <Plus size={16} /> Jadwalkan Post
                      </button>
                    </div>
                  </div>

                  {/* Post grid */}
                  {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ fontSize: '56px', marginBottom: '16px' }}>📱</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Belum Ada Konten Dijadwalkan</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Mulai buat jadwal konten untuk Instagram, Facebook, TikTok, dan platform lainnya</p>
                      <button
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => { setPostFormData({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' }); setPostModalOpen(true); }}
                      >
                        <Plus size={14} /> Buat Post Pertama
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                      {posts.map((p) => {
                        const platformConfig = {
                          Instagram: { color: '#e1306c', bg: 'linear-gradient(135deg,#e1306c,#f77737,#fcaf45)', icon: '📸', textColor: '#fff' },
                          Facebook: { color: '#1877F2', bg: 'linear-gradient(135deg,#1877F2,#0d5dbf)', icon: '👍', textColor: '#fff' },
                          TikTok: { color: '#010101', bg: 'linear-gradient(135deg,#010101,#69C9D0)', icon: '🎵', textColor: '#fff' },
                          LinkedIn: { color: '#0A66C2', bg: 'linear-gradient(135deg,#0A66C2,#0d4a8a)', icon: '💼', textColor: '#fff' },
                          Twitter: { color: '#1DA1F2', bg: 'linear-gradient(135deg,#1DA1F2,#0c7abf)', icon: '🐦', textColor: '#fff' },
                          YouTube: { color: '#FF0000', bg: 'linear-gradient(135deg,#FF0000,#c20000)', icon: '▶️', textColor: '#fff' },
                        };
                        const cfg = platformConfig[p.platform] || { color: '#6b7280', bg: 'linear-gradient(135deg,#374151,#1f2937)', icon: '📢', textColor: '#fff' };
                        const statusColors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
                        const statusColor = statusColors[p.status] || '#6b7280';

                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPost(p)}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '14px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${cfg.color}30`; e.currentTarget.style.borderColor = `${cfg.color}50`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            {/* Platform header strip */}
                            <div style={{ background: cfg.bg, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                                <span style={{ color: cfg.textColor, fontWeight: 800, fontSize: '14px', letterSpacing: '0.3px' }}>{p.platform}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                  background: `${statusColor}25`, color: statusColor,
                                  border: `1px solid ${statusColor}50`,
                                  backdropFilter: 'blur(4px)'
                                }}>
                                  {p.status}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); deleteSocialPost(p.id); }}
                                  style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                  title="Hapus"
                                >✕</button>
                              </div>
                            </div>

                            {/* Content body */}
                            <div style={{ padding: '14px 16px' }}>
                              {/* Media preview if available */}
                              {p.media_url && (
                                <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: '#0f172a' }}>
                                  <img src={p.media_url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                </div>
                              )}

                              {/* Content preview */}
                              <p style={{
                                fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                overflow: 'hidden', marginBottom: '12px', minHeight: '60px'
                              }}>
                                {p.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada konten...</span>}
                              </p>

                              {/* Schedule time */}
                              {p.schedule_time && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                  <Clock size={10} />
                                  {new Date(p.schedule_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}

                              {/* Engagement stats */}
                              <div style={{ display: 'flex', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>❤️ {p.engagement_likes || 0}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>💬 {p.engagement_comments || 0}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🔁 {p.engagement_shares || 0}</span>
                                <span style={{ marginLeft: 'auto', color: cfg.color, fontWeight: 600, fontSize: '10px' }}>Klik untuk detail →</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}

    </div>
  </main>

      {/* --- MODALS BLOCK --- */}

      {/* MODAL: JADWALKAN POST */}
      {postModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', margin: '-1px -1px 0', padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '2px' }}>
                  {postFormData.id ? '✏️ Edit Jadwal Post' : '📅 Jadwalkan Post Baru'}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Buat dan jadwalkan konten untuk media sosial</p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setPostModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveSocialPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
              {/* Platform selection */}
              <div className="form-group">
                <label className="form-label">Platform</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Instagram', icon: '📸', color: '#e1306c' },
                    { name: 'Facebook', icon: '👍', color: '#1877F2' },
                    { name: 'TikTok', icon: '🎵', color: '#69C9D0' },
                    { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
                    { name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
                    { name: 'YouTube', icon: '▶️', color: '#FF0000' },
                  ].map(pl => (
                    <button
                      key={pl.name}
                      type="button"
                      onClick={() => setPostFormData({ ...postFormData, platform: pl.name })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: postFormData.platform === pl.name ? `${pl.color}20` : 'transparent',
                        border: `2px solid ${postFormData.platform === pl.name ? pl.color : 'var(--border-color)'}`,
                        color: postFormData.platform === pl.name ? pl.color : 'var(--text-muted)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{pl.icon}</span> {pl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">Konten Postingan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder="Tulis caption / konten postingan Anda di sini... #hashtag"
                  required
                  value={postFormData.content}
                  onChange={e => setPostFormData({ ...postFormData, content: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  {postFormData.content.length} karakter
                </div>
              </div>

              {/* Media URL */}
              <div className="form-group">
                <label className="form-label">URL Media (Gambar/Video)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={postFormData.media_url}
                  onChange={e => setPostFormData({ ...postFormData, media_url: e.target.value })}
                />
                {postFormData.media_url && (
                  <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                    <img src={postFormData.media_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Schedule time */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tanggal & Waktu Tayang</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={postFormData.schedule_time}
                    onChange={e => setPostFormData({ ...postFormData, schedule_time: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ width: '140px' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={postFormData.status}
                    onChange={e => setPostFormData({ ...postFormData, status: e.target.value })}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPostModalOpen(false)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', fontWeight: 700, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckSquare size={14} /> {postFormData.id ? 'Simpan Perubahan' : 'Jadwalkan Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST DETAIL (view full content) */}
      {selectedPost && (() => {
        const p = selectedPost;
        const platformConfig = {
          Instagram: { color: '#e1306c', bg: 'linear-gradient(135deg,#e1306c,#f77737,#fcaf45)', icon: '📸' },
          Facebook: { color: '#1877F2', bg: 'linear-gradient(135deg,#1877F2,#0d5dbf)', icon: '👍' },
          TikTok: { color: '#010101', bg: 'linear-gradient(135deg,#010101,#69C9D0)', icon: '🎵' },
          LinkedIn: { color: '#0A66C2', bg: 'linear-gradient(135deg,#0A66C2,#0d4a8a)', icon: '💼' },
          Twitter: { color: '#1DA1F2', bg: 'linear-gradient(135deg,#1DA1F2,#0c7abf)', icon: '🐦' },
          YouTube: { color: '#FF0000', bg: 'linear-gradient(135deg,#FF0000,#c20000)', icon: '▶️' },
        };
        const cfg = platformConfig[p.platform] || { color: '#6b7280', bg: 'linear-gradient(135deg,#374151,#1f2937)', icon: '📢' };
        const statusColors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
        const statusColor = statusColors[p.status] || '#6b7280';
        return (
          <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
            <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
              {/* Platform header */}
              <div style={{ background: cfg.bg, padding: '20px 24px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{cfg.icon}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>{p.platform}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Detail Konten</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${statusColor}30`, color: statusColor, border: `1px solid ${statusColor}60` }}>
                    {p.status}
                  </span>
                  <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setSelectedPost(null)}>
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Media preview */}
                {p.media_url && (
                  <div style={{ marginBottom: '18px', borderRadius: '10px', overflow: 'hidden', maxHeight: '220px', background: '#0f172a' }}>
                    <img src={p.media_url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}

                {/* Full content */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>KONTEN POSTINGAN</div>
                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                    {p.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada konten</span>}
                  </div>
                </div>

                {/* Schedule info */}
                {p.schedule_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Clock size={14} style={{ color: '#3b82f6' }} />
                    <span>Dijadwalkan: <b>{new Date(p.schedule_time).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></span>
                  </div>
                )}

                {/* Engagement stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Likes', value: p.engagement_likes || 0, icon: '❤️', color: '#ef4444' },
                    { label: 'Comments', value: p.engagement_comments || 0, icon: '💬', color: '#3b82f6' },
                    { label: 'Shares', value: p.engagement_shares || 0, icon: '🔁', color: '#10b981' },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: '12px', background: `${stat.color}10`, border: `1px solid ${stat.color}25`, borderRadius: '10px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)' }}
                    onClick={() => { setSelectedPost(null); deleteSocialPost(p.id); }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setSelectedPost(null);
                      setPostFormData({ id: p.id, platform: p.platform, content: p.content, media_url: p.media_url || '', schedule_time: p.schedule_time ? p.schedule_time.slice(0,16) : '', status: p.status });
                      setPostModalOpen(true);
                    }}
                  >
                    <Edit3 size={14} /> Edit Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* MODAL: UPLOAD/EDIT MATERI (Asset) */}
      {assetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary-glow) 0%, #a855f7 100%)', margin: '-1px -1px 0', padding: '18px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '2px' }}>
                  {assetFormData.id ? '✏️ Edit Metadata Aset' : '📤 Upload Materi Pemasaran Baru'}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Simpan materi CFD/FEA, proposal, case study secara terpusat</p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setAssetModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">Nama Materi Pemasaran <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Brosur Jasa Simulasi CFD (Fluids)"
                  required
                  value={assetFormData.name}
                  onChange={e => setAssetFormData({ ...assetFormData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kategori Materi</label>
                  <select
                    className="form-select"
                    value={assetFormData.category || 'CFD/FEA'}
                    onChange={e => setAssetFormData({ ...assetFormData, category: e.target.value })}
                  >
                    <option value="CFD/FEA">CFD/FEA</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Proposal Template">Proposal Template</option>
                    <option value="Foto Proyek">Foto Proyek</option>
                    <option value="Whitepaper">Whitepaper</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tipe File</label>
                  <select
                    className="form-select"
                    value={assetFormData.file_type || 'PDF'}
                    onChange={e => setAssetFormData({ ...assetFormData, file_type: e.target.value })}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Template">Template Word/Excel</option>
                    <option value="Image">Image (Foto/Render)</option>
                    <option value="Video">Video Teaser</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Versi Aset</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1.0 atau 1.2"
                    value={assetFormData.version || '1.0'}
                    onChange={e => setAssetFormData({ ...assetFormData, version: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ukuran File</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4.2 MB"
                    value={assetFormData.size || '2.4 MB'}
                    onChange={e => setAssetFormData({ ...assetFormData, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">File Materi (Drag & Drop atau Pilih File/Folder)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAssetFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('asset-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input
                    type="file"
                    id="asset-file-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAssetFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {assetFormData.file_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '24px' }}>
                        {assetFormData.file_type === 'PDF' && '📄'}
                        {assetFormData.file_type === 'Image' && '🖼️'}
                        {assetFormData.file_type === 'Template' && '📊'}
                        {assetFormData.file_type === 'Video' && '🎬'}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                        File Berhasil Dikumpulkan
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Ukuran: {assetFormData.size} · Tipe: {assetFormData.file_type}
                      </div>
                      {assetFormData.file_url.startsWith('data:') && (
                        <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600 }}>✓ File terkompresi Base64</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={24} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh file/item di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung PDF, Word, Excel, JPG, PNG, MP4</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tags (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="sales, cfd, brochure"
                    value={assetFormData.tags}
                    onChange={e => setAssetFormData({ ...assetFormData, tags: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label className="form-label">Akses Sharing</label>
                  <select
                    className="form-select"
                    value={assetFormData.sharing_status || 'Shared'}
                    onChange={e => setAssetFormData({ ...assetFormData, sharing_status: e.target.value })}
                  >
                    <option value="Shared">Shared with Sales</option>
                    <option value="Private">Private (Marketing Only)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssetModalOpen(false)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--primary-glow), #a855f7)', border: 'none', fontWeight: 700, minWidth: '130px' }}
                >
                  {assetFormData.id ? 'Simpan' : 'Upload Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERSION CONTROL HISTORY */}
      {selectedAssetHistory && (() => {
        let history = [];
        try {
          history = JSON.parse(selectedAssetHistory.version_history || '[]');
          if (!Array.isArray(history)) history = [];
        } catch (e) {
          history = [];
        }

        const autoNextVer = selectedAssetHistory.version ? (() => {
          const v = selectedAssetHistory.version;
          const match = v.match(/^(v?)(\d+)\.(\d+)(.*)$/i);
          if (match) {
            return `${match[1]}${match[2]}.${parseInt(match[3], 10) + 1}${match[4]}`;
          }
          const singleNumMatch = v.match(/^(v?)(\d+)(.*)$/i);
          if (singleNumMatch) {
            return `${singleNumMatch[1]}${parseInt(singleNumMatch[2], 10) + 1}${singleNumMatch[3]}`;
          }
          return v + '.1';
        })() : '1.1';

        return (
          <div className="modal-overlay" onClick={() => {
            setSelectedAssetHistory(null);
            setNewVersionFileUrl('');
            setNewVersionFileSize('');
            setNewVersionVal('');
          }}>
            <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                    ⏱️ Version Control & Riwayat Versi
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedAssetHistory.name}</span>
                </div>
                <button className="icon-btn" onClick={() => {
                  setSelectedAssetHistory(null);
                  setNewVersionFileUrl('');
                  setNewVersionFileSize('');
                  setNewVersionVal('');
                }}>
                  <XCircle size={20} />
                </button>
              </div>
              
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Version History Log Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', margin: '8px 0 8px 10px' }}>
                  
                  {/* Current Active Version */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-25px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-cyan)', border: '4px solid var(--bg-main)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--accent-cyan)' }}>
                      <span>Versi {selectedAssetHistory.version || '1.0'} (Aktif)</span>
                      <button
                        className="btn"
                        style={{ padding: '2px 8px', fontSize: '10px', height: 'auto', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', border: 'none', borderRadius: '4px', fontWeight: 600 }}
                        onClick={() => handleOpenOrDownloadFile(selectedAssetHistory.file_url, selectedAssetHistory.name || 'Dokumen')}
                      >
                        Buka File Aktif
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Ukuran: {selectedAssetHistory.size || '1.5 MB'} · Rilis: {new Date(selectedAssetHistory.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  {/* Legacy Versions */}
                  {history.map((hist, idx) => (
                    <div key={idx} style={{ position: 'relative', opacity: 0.75 }}>
                      <div style={{ position: 'absolute', left: '-25px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text-muted)', border: '4px solid var(--bg-main)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        <span>Versi {hist.version}</span>
                        <button
                          className="btn"
                          style={{ padding: '2px 8px', fontSize: '10px', height: 'auto', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', fontWeight: 600 }}
                          onClick={() => handleOpenOrDownloadFile(hist.file_url, `${selectedAssetHistory.name || 'Dokumen'}_v${hist.version}`)}
                        >
                          Buka File Lama
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Ukuran: {hist.size || '1.5 MB'} · Diupload: {new Date(hist.uploaded_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Version control upgrade form */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                    🚀 Upload Versi Baru (Version Control)
                  </h4>
                  
                  {/* File Upload Drag & Drop inside Version Control modal */}
                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                      marginBottom: '12px'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleVersionFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('history-file-input').click()}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <input
                      type="file"
                      id="history-file-input"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleVersionFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    {newVersionFileUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                          File Baru Siap Diunggah
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ukuran: {newVersionFileSize}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>
                        <Download size={18} style={{ marginBottom: '4px', color: 'var(--accent-cyan)' }} />
                        <div style={{ fontSize: '11px', fontWeight: 500 }}>Seret file baru ke sini atau klik untuk memilih</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Versi baru (e.g. ${autoNextVer})`}
                      id="new_ver_input"
                      value={newVersionVal}
                      onChange={(e) => setNewVersionVal(e.target.value)}
                      style={{ width: '150px', height: '36px', fontSize: '12px' }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, height: '36px', fontSize: '12px', background: 'var(--accent-cyan)', color: 'black', border: 'none', fontWeight: 700 }}
                      onClick={async () => {
                        const targetVer = newVersionVal || autoNextVer;
                        if (!newVersionFileUrl) return alert('Silakan unggah file baru terlebih dahulu!');
                        try {
                          await api.updateAsset(selectedAssetHistory.id, {
                            ...selectedAssetHistory,
                            version: targetVer,
                            file_url: newVersionFileUrl,
                            size: newVersionFileSize
                          });
                          showAlert(`Versi berhasil ditingkatkan ke v${targetVer}`, 'Sukses', 'success');
                          setSelectedAssetHistory(null);
                          setNewVersionFileUrl('');
                          setNewVersionFileSize('');
                          setNewVersionVal('');
                          fetchAssets();
                        } catch (err) {
                          showAlert(err.message, 'Gagal', 'error');
                        }
                      }}
                    >
                      Unggah & Tingkatkan Versi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}



      {/* MODAL: SHARE WITH SALES */}
      {shareModalAsset && (
        <div className="modal-overlay" onClick={() => setShareModalAsset(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                  🔗 Bagikan Materi Pemasaran ke Sales
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bagikan file ke tim sales tanpa perlu kirim file manual</span>
              </div>
              <button className="icon-btn" onClick={() => setShareModalAsset(null)}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🟢</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>Tautan Aktif & Siap Dibagikan</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Tim sales dapat mengakses file versi terbaru secara langsung melalui tautan di bawah ini.
                </p>
              </div>

              {/* Secure share link display */}
              <div className="form-group">
                <label className="form-label">Tautan Secure Sharing</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={`${window.location.origin}/share/assets/${shareModalAsset.id}`}
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '12px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap', height: '38px', fontSize: '12px' }}
                    onClick={async () => {
                      const shareLink = `${window.location.origin}/share/assets/${shareModalAsset.id}`;
                      try {
                        await navigator.clipboard.writeText(shareLink);
                        // Record share increment
                        await api.downloadAsset(shareModalAsset.id);
                        fetchAssets();
                        alert('Tautan secure share berhasil disalin ke clipboard!');
                        setShareModalAsset(null);
                      } catch (err) {
                        alert('Gagal menyalin tautan: ' + err.message);
                      }
                    }}
                  >
                    Salin Tautan
                  </button>
                </div>
              </div>

              {/* Helper list */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tautan selalu merujuk ke versi dokumen terbaru (saat ini v{shareModalAsset.version || '1.0'})</li>
                  <li>Tim sales tidak memerlukan login terpisah untuk mengunduh</li>
                  <li>Setiap klik unduhan tim sales akan tercatat pada statistik sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT LEAD */}
      {leadModalOpen && (

        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{leadFormData.id ? 'Edit Klien Lead' : 'Tambah Klien Lead Baru'}</h3>
              <button className="icon-btn" onClick={() => setLeadModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Perusahaan (PT)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={leadFormData.company || ''} 
                    onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value, name: e.target.value })} 
                    placeholder="e.g. PT Maju Bersama" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo Perusahaan (PT)</label>
                <div 
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('logo-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input 
                    type="file" 
                    id="logo-file-input" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {leadFormData.logo_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={leadFormData.logo_url} 
                        alt="Logo PT" 
                        style={{ height: '50px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }} 
                      />
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '3px 8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '10px', border: 'none', borderRadius: '4px', height: 'auto', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadFormData(prev => ({ ...prev, logo_url: '' }));
                        }}
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={20} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh logo di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung format PNG, JPG, JPEG</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industri</label>
                  <select 
                    className="form-select"
                    value={leadFormData.industry}
                    onChange={(e) => setLeadFormData({ ...leadFormData, industry: e.target.value })}
                  >
                    {industriesList.map((ind, i) => (
                      <option key={i} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sumber Lead (Source)</label>
                  <select 
                    className="form-select"
                    value={leadFormData.source}
                    onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                  >
                    {sourcesList.map((src, i) => (
                      <option key={i} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Deal Value (Estimasi Nilai Rp)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={leadFormData.value} 
                    onChange={(e) => setLeadFormData({ ...leadFormData, value: e.target.value })} 
                    placeholder="e.g. 150000000" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Score (0-100)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="0" 
                    max="100" 
                    value={leadFormData.lead_score} 
                    onChange={(e) => setLeadFormData({ ...leadFormData, lead_score: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location (Kota)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={leadFormData.location} 
                    onChange={(e) => setLeadFormData({ ...leadFormData, location: e.target.value })} 
                    placeholder="e.g. Jakarta" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={leadFormData.company_size} 
                    onChange={(e) => setLeadFormData({ ...leadFormData, company_size: e.target.value })} 
                    placeholder="e.g. 50-200" 
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Kontak Utama (Wajib - Perusahaan)</span>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Nama Kontak 1</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={leadFormData.contact1_name || ''} 
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact1_name: e.target.value })} 
                      placeholder="Nama Kontak Pertama" 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">No. Telepon Kontak 1</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={leadFormData.contact1_phone || ''} 
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact1_phone: e.target.value })} 
                      placeholder="e.g. +6281122334455" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Kontak Kedua (Opsional)</span>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Nama Kontak 2</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={leadFormData.contact2_name || ''} 
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact2_name: e.target.value })} 
                      placeholder="Nama Kontak Kedua" 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">No. Telepon Kontak 2</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={leadFormData.contact2_phone || ''} 
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact2_phone: e.target.value })} 
                      placeholder="e.g. +6287766554433" 
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Deadline / Target Proyek</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={leadFormData.deadline || ''} 
                      onChange={(e) => setLeadFormData({ ...leadFormData, deadline: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input 
                  type="checkbox" 
                  id="lead-verified"
                  checked={leadFormData.verified} 
                  onChange={(e) => setLeadFormData({ ...leadFormData, verified: e.target.checked })} 
                />
                <label htmlFor="lead-verified" className="form-label" style={{ textTransform: 'none', cursor: 'pointer' }}>Akun Klien Terverifikasi</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setLeadModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT CONTACT */}
      {contactModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tambah Kontak Client Baru</h3>
              <button className="icon-btn" onClick={() => setContactModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={addClientContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={contactFormData.name} 
                  onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })} 
                  placeholder="e.g. K Seto" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan (Position)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={contactFormData.position || ''} 
                  onChange={(e) => setContactFormData({ ...contactFormData, position: e.target.value })} 
                  placeholder="e.g. Manager / PIC" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={contactFormData.phone} 
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })} 
                  placeholder="e.g. +62 896-3871-9518" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={contactFormData.email} 
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })} 
                  placeholder="e.g. k.seto@company.com" 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="contact-is-primary"
                  checked={contactFormData.isPrimary || false} 
                  onChange={(e) => setContactFormData({ ...contactFormData, isPrimary: e.target.checked })} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="contact-is-primary" style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>Jadikan sebagai Kontak Utama (Primary)</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setContactModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Kontak</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INTERACTION NOTE */}
      {noteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tambah Catatan Interaksi</h3>
              <button className="icon-btn" onClick={() => setNoteModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={addInteractionLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Tipe Interaksi</label>
                <select 
                  className="form-select"
                  value={newNoteFormData.type} 
                  onChange={(e) => setNewNoteFormData({ ...newNoteFormData, type: e.target.value })}
                >
                  <option value="Call">Call (Telepon)</option>
                  <option value="Meeting">Meeting (Pertemuan)</option>
                  <option value="Email">Email</option>
                  <option value="Note">Note (Catatan)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Detail Catatan</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  placeholder="Tulis detail percakapan / notes follow up..." 
                  value={newNoteFormData.notes}
                  onChange={(e) => setNewNoteFormData({ ...newNoteFormData, notes: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNoteModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCOUNT PROFILE UPDATE */}
      {profileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Profil Saya</h3>
              <button className="icon-btn" onClick={() => setProfileModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveProfileSelf} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileFormData.name} 
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setProfileModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK IMPORT CLIENTS */}
      {bulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Klien</h3>
              <button className="icon-btn" onClick={() => setBulkModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Format CSV: Company, Industry, Source, PIC_Name, PIC_Phone, Status, Verified</span>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={downloadCsvTemplate}>
                  Unduh Templat
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Unggah Berkas CSV</label>
                <input 
                  type="file" 
                  accept=".csv"
                  className="form-input"
                  style={{ padding: '8px' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setBulkCsvText(evt.target.result);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Atau Tempel / Edit Data CSV Di Sini</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '12px' }}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="Company,Industry,Source,PIC_Name,PIC_Phone,Status,Verified&#13;PT Maju Jaya,Technology,Website,Agus Santoso,+628123456789,Lead,Yes"
                  required
                />
              </div>

              {bulkImportError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '13px' }}>
                  {bulkImportError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={bulkImportLoading}>
                  {bulkImportLoading ? 'Mengimpor...' : 'Mulai Impor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROSPECT */}
      {fuEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {fuEditForm.id ? `Edit Prospek — ${fuEditForm.name}` : 'Edit Prospek — Baru'}
              </h3>
              <button className="icon-btn" onClick={() => setFuEditModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveFuProspectEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Stage Proyek */}
              <div className="form-group">
                <label className="form-label">Stage Prospek</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Lead', 'Proposal', 'Hold', 'Loss', 'Won', 'Done'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFuEditForm({ ...fuEditForm, status: st })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: fuEditForm.status === st ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: fuEditForm.status === st ? 'rgba(0, 210, 211, 0.15)' : 'transparent',
                        color: fuEditForm.status === st ? 'var(--accent-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Prospek / Proyek</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fuEditForm.name || ''} 
                    onChange={(e) => setFuEditForm({ ...fuEditForm, name: e.target.value })} 
                    placeholder="e.g. 22. Simulasi Basin Sea ..." 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Perusahaan (PT)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fuEditForm.company || ''} 
                    onChange={(e) => setFuEditForm({ ...fuEditForm, company: e.target.value })} 
                    placeholder="e.g. PT Transportasi Gas Indonesia" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama PIC / Kontak</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fuEditForm.contact_name || ''} 
                    onChange={(e) => setFuEditForm({ ...fuEditForm, contact_name: e.target.value })} 
                    placeholder="e.g. Ryan Vidyantara" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo Perusahaan (PT)</label>
                <div 
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProspectLogoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('prospect-logo-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input 
                    type="file" 
                    id="prospect-logo-file-input" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProspectLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {fuEditForm.logo_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={fuEditForm.logo_url} 
                        alt="Logo PT" 
                        style={{ height: '50px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }} 
                      />
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '3px 8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '10px', border: 'none', borderRadius: '4px', height: 'auto', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFuEditForm(prev => ({ ...prev, logo_url: '' }));
                        }}
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={20} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh logo di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung format PNG, JPG, JPEG</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Sumber (Source)</label>
                  <select
                    className="form-select"
                    value={fuEditForm.source || 'Organic'}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, source: e.target.value })}
                  >
                    {sourcesList.map((src, i) => (
                      <option key={i} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kontak Utama (Phone)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fuEditForm.phone || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fuEditForm.deadline || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, deadline: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nilai (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={fuEditForm.value || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={fuEditForm.notes || ''}
                  onChange={(e) => setFuEditForm({ ...fuEditForm, notes: e.target.value })}
                />
              </div>

              {/* Tambah Riwayat Kontak — only for existing prospects */}
              {fuEditForm.id && (
                <div className="form-group">
                  <label className="form-label">Tambah Riwayat Kontak</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="62 8xx-xxxx-xxxx"
                      value={fuNewContactPhone}
                      onChange={e => setFuNewContactPhone(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Catatan..."
                      value={fuNewContactNotes}
                      onChange={e => setFuNewContactNotes(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap', height: '38px', fontSize: '12px' }}
                      onClick={addFuContactHistory}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFuEditModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckSquare size={14} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT PROJECT */}
      {projectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{projectFormData.id ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h3>
              <button className="icon-btn" onClick={() => setProjectModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Proyek</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={projectFormData.name} 
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Klien / Perusahaan</label>
                <select
                  className="form-select"
                  value={projectFormData.client_id}
                  onChange={(e) => setProjectFormData({ ...projectFormData, client_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Klien --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.company || l.name} ({l.name})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Proyek</label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  value={projectFormData.description || ''} 
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })} 
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Budget (Estimasi Nilai Rp)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={projectFormData.budget || ''} 
                    onChange={(e) => setProjectFormData({ ...projectFormData, budget: e.target.value })} 
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Deadline</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={projectFormData.deadline} 
                    onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })} 
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Progress (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="0"
                    max="100"
                    value={projectFormData.progress} 
                    onChange={(e) => setProjectFormData({ ...projectFormData, progress: parseInt(e.target.value) || 0 })} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status Proyek</label>
                  <select 
                    className="form-select"
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setProjectModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Proyek</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT OPERATOR */}
      {operatorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{operatorFormData.id ? 'Edit Operator' : 'Tambah Operator Baru'}</h3>
              <button className="icon-btn" onClick={() => setOperatorModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveOperator} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={operatorFormData.name} 
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={operatorFormData.username || ''} 
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, username: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={operatorFormData.email} 
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, email: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Password {operatorFormData.id && '(Kosongkan jika tidak diubah)'}</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={operatorFormData.password} 
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, password: e.target.value })} 
                    required={!operatorFormData.id} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">No. WhatsApp</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={operatorFormData.phone || ''} 
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, phone: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Role</label>
                  <select 
                    className="form-select"
                    value={operatorFormData.role}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, role: e.target.value })}
                    disabled={user?.role !== 'Superadmin'}
                  >
                    <option value="Operator">Operator</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Admin">Admin</option>
                    <option value="Superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={operatorFormData.status}
                  onChange={(e) => setOperatorFormData({ ...operatorFormData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOperatorModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Operator</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CUSTOM ALERT MODAL */}
      {customAlert.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              {customAlert.type === 'error' ? (
                <XCircle size={48} color="#ef4444" />
              ) : (
                <CheckCircle2 size={48} color="#06b6d4" />
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
              {customAlert.title || 'Notifikasi'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {customAlert.message}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600 }}
              onClick={() => setCustomAlert({ ...customAlert, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {customConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={48} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
              Konfirmasi
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {customConfirm.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border-color)' }}
                onClick={() => setCustomConfirm({ show: false, message: '', onConfirm: null })}
              >
                Batal
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                onClick={() => {
                  const onConf = customConfirm.onConfirm;
                  setCustomConfirm({ show: false, message: '', onConfirm: null });
                  if (onConf) onConf();
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
