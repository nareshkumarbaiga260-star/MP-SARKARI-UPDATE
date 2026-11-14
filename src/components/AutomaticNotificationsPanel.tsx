import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  Trash2,
  Play,
  Edit3,
  Clock,
  ShieldAlert,
  Loader2,
  Search,
  Check,
  X,
  Database,
  SlidersHorizontal,
  Wifi
} from 'lucide-react';
import {
  AutoNotificationCategory,
  DetectedNotification,
  GovernmentSource,
  MonitoringLog,
  MonitoringSummary,
  PostCategory,
  SourceMonitorMethod
} from '../types';
import {
  BackendMonitorPayload,
  ExtractionTestResult,
  mapAutoCategoryToWebsiteCategory,
  notificationService
} from '../services/notificationService';
import { CATEGORIES } from '../data/categories';
import { AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';

interface AutomaticNotificationsPanelProps {
  onPostPublished: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

const AUTO_CATEGORIES: AutoNotificationCategory[] = [
  'Latest Government Jobs',
  'MP Government Jobs',
  'Central Government Jobs',
  'Government Orders',
  'Sarkari Yojana',
  'Admit Card',
  'Results',
  'Answer Key',
  'Exam Notifications',
  'Important Notices'
];

function formatDateTime(iso: string): string {
  if (!iso) return 'अभी तक नहीं';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const AutomaticNotificationsPanel: React.FC<AutomaticNotificationsPanelProps> = ({
  onPostPublished,
  onNotify
}) => {
  const [subTab, setSubTab] = useState<'queue' | 'sources' | 'logs'>('queue');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);
  const [extractingSourceId, setExtractingSourceId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [sources, setSources] = useState<GovernmentSource[]>([]);
  const [detected, setDetected] = useState<DetectedNotification[]>([]);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);

  // Extraction Preview Modal state
  const [extractionPreview, setExtractionPreview] =
    useState<ExtractionTestResult['extraction'] | null>(null);

  // Manual Source Config + Manual Notice Modal state
  const [configSource, setConfigSource] = useState<GovernmentSource | null>(null);
  const [configTab, setConfigTab] = useState<'url' | 'notice'>('url');
  const [cfgUrl, setCfgUrl] = useState<string>('');
  const [cfgAlternateUrl, setCfgAlternateUrl] = useState<string>('');
  const [cfgMethod, setCfgMethod] = useState<SourceMonitorMethod>('auto');
  const [cfgNotes, setCfgNotes] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualOfficialUrl, setManualOfficialUrl] = useState<string>('');
  const [manualPdfUrl, setManualPdfUrl] = useState<string>('');
  const [manualLastDate, setManualLastDate] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Filters for approval queue
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AutoNotificationCategory>('all');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Preview & Edit modal state
  const [editingItem, setEditingItem] = useState<DetectedNotification | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editAutoCat, setEditAutoCat] = useState<AutoNotificationCategory>('Important Notices');
  const [editWebCat, setEditWebCat] = useState<PostCategory>('govt-updates');
  const [editLastDate, setEditLastDate] = useState<string>('');
  const [editOfficialUrl, setEditOfficialUrl] = useState<string>('');
  const [editPdfUrl, setEditPdfUrl] = useState<string>('');
  const [editApplyUrl, setEditApplyUrl] = useState<string>('');

  // Add new official source form
  const [showAddSource, setShowAddSource] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceDept, setNewSourceDept] = useState<string>('');
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newSourceMethod, setNewSourceMethod] = useState<SourceMonitorMethod>('auto');
  const [newSourceRegion, setNewSourceRegion] = useState<'MP' | 'Central' | 'State'>('MP');
  const [newSourceCategory, setNewSourceCategory] =
    useState<AutoNotificationCategory>('MP Government Jobs');
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);

  const applyPayload = useCallback((payload: BackendMonitorPayload) => {
    setSummary(payload.summary);
    setSources(payload.sources);
    setDetected(payload.detected);
    setLogs(payload.logs);
  }, []);

  const loadAndSyncState = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await notificationService.fetchBackendMonitorState();
      applyPayload(payload);
      // Persist latest backend snapshot cleanly into Firestore collections
      notificationService.syncBackendStateToFirestore(payload).catch((err) => {
        console.warn('Firestore background sync notice:', err);
      });
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'स्वचालित सूचना डेटा लोड करने में त्रुटि हुई।'
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyPayload, onNotify]);

  useEffect(() => {
    loadAndSyncState();
  }, [loadAndSyncState]);

  const handleRunCheckAll = async () => {
    setIsRunningCheck(true);
    try {
      const payload = await notificationService.triggerBackendCheck();
      applyPayload(payload);
      await notificationService.syncBackendStateToFirestore(payload);
      onNotify(
        'success',
        `सरकारी पोर्टल्स की जाँच पूर्ण: ${payload.summary.newlyDetectedLastRun} नई सूचनाएँ मिलीं, ${payload.summary.lastRunDuplicateCount} डुप्लीकेट छोड़ी गईं।`
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'स्वचालित जाँच चलाने में त्रुटि हुई।'
      );
    } finally {
      setIsRunningCheck(false);
    }
  };

  const handleTestSingleSource = async (sourceId: string) => {
    setTestingSourceId(sourceId);
    try {
      const result = await notificationService.testSourceConnection(sourceId);
      setSummary(result.summary);
      setSources(result.sources);
      setLogs(result.logs);
      const isOk = result.probe.connectionStatus === 'connected';
      onNotify(
        isOk ? 'success' : 'error',
        isOk
          ? `${result.source.name}: कनेक्शन सफल (HTTP ${result.probe.httpStatus}, ${result.probe.readableItemsCount || 0} पठनीय आइटम, ${result.probe.latencyMs} ms)`
          : `${result.source.name} (${result.probe.failureReason}): ${result.probe.statusMessage}`
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'स्रोत कनेक्शन परीक्षण विफल रहा।'
      );
    } finally {
      setTestingSourceId(null);
    }
  };

  const handleTestDataExtraction = async (sourceId: string) => {
    setExtractingSourceId(sourceId);
    try {
      const result = await notificationService.testSourceExtraction(sourceId);
      setSummary(result.summary);
      setSources(result.sources);
      setDetected(result.detected);
      setLogs(result.logs);
      setExtractionPreview(result.extraction);
      const isOk = result.extraction.probe.connectionStatus === 'connected';
      onNotify(
        isOk ? 'success' : 'error',
        isOk
          ? `${result.extraction.source.name}: ${result.extraction.extractedTotal} सूचनाएँ पढ़ी गईं (${result.extraction.newlyQueuedCount} नई Pending कतार में जोड़ी गईं)।`
          : `${result.extraction.source.name}: डेटा निष्कर्षण नहीं हो सका (${result.extraction.probe.failureReason})।`
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'डेटा निष्कर्षण परीक्षण विफल रहा।'
      );
    } finally {
      setExtractingSourceId(null);
    }
  };

  const openManualConfig = (src: GovernmentSource) => {
    setConfigSource(src);
    setConfigTab('url');
    setCfgUrl(src.url);
    setCfgAlternateUrl(src.alternateUrl || '');
    setCfgMethod(src.method);
    setCfgNotes(src.manualNotes || '');
    setManualTitle('');
    setManualDesc('');
    setManualOfficialUrl(src.portalHomeUrl || src.url);
    setManualPdfUrl('');
    setManualLastDate('');
  };

  const handleSaveManualConfig = async (e: React.FormEvent, alsoTestConnection = false) => {
    e.preventDefault();
    if (!configSource) return;
    setIsSavingConfig(true);
    try {
      const updated = await notificationService.updateSourceConfig(configSource.id, {
        url: cfgUrl.trim(),
        alternateUrl: cfgAlternateUrl.trim(),
        method: cfgMethod,
        manualNotes: cfgNotes.trim()
      });
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setConfigSource(updated);
      onNotify('success', `${updated.name} का मैनुअल कॉन्फ़िगरेशन सहेजा गया।`);
      if (alsoTestConnection) {
        const result = await notificationService.testSourceConnection(updated.id);
        setSummary(result.summary);
        setSources(result.sources);
        setLogs(result.logs);
        setConfigSource(result.source);
        onNotify(
          result.probe.connectionStatus === 'connected' ? 'success' : 'error',
          `परीक्षण परिणाम: ${result.probe.statusMessage}`
        );
      }
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'मैनुअल कॉन्फ़िगरेशन सहेजने में त्रुटि।'
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSubmitManualNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configSource) return;
    setIsSubmittingManual(true);
    try {
      const result = await notificationService.submitManualNotice({
        sourceId: configSource.id,
        title: manualTitle.trim(),
        description: manualDesc.trim(),
        officialSourceUrl: manualOfficialUrl.trim(),
        pdfUrl: manualPdfUrl.trim(),
        lastDate: manualLastDate.trim()
      });
      setSummary(result.summary);
      setSources(result.sources);
      setDetected(result.detected);
      setLogs(result.logs);
      setManualTitle('');
      setManualDesc('');
      setManualPdfUrl('');
      setManualLastDate('');
      setConfigSource(null);
      setSubTab('queue');
      setStatusFilter('pending');
      onNotify(
        'success',
        'आधिकारिक अधिसूचना Pending Approval कतार में जोड़ दी गई है। कृपया सत्यापित कर प्रकाशित करें।'
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'मैनुअल अधिसूचना जोड़ने में त्रुटि।'
      );
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleToggleSource = async (src: GovernmentSource) => {
    try {
      const updated = await notificationService.toggleSourceEnabled(src.id, !src.enabled);
      setSources((prev) => prev.map((s) => (s.id === src.id ? updated : s)));
      onNotify(
        'success',
        `${updated.name} ${updated.enabled ? 'सक्रिय' : 'रोका (Paused)'} किया गया।`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'स्रोत बदलने में त्रुटि।');
    }
  };

  const handleDeleteSource = async (src: GovernmentSource) => {
    try {
      await notificationService.deleteSource(src.id);
      setSources((prev) => prev.filter((s) => s.id !== src.id));
      onNotify('success', `${src.name} मॉनिटर सूची से हटा दिया गया।`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'स्रोत हटाने में त्रुटि।');
    }
  };

  const handleAddSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      onNotify('error', 'कृपया स्रोत का नाम और वैध URL दर्ज करें।');
      return;
    }
    setIsAddingSource(true);
    try {
      const { source, payload } = await notificationService.addSource({
        name: newSourceName.trim(),
        department: newSourceDept.trim() || newSourceName.trim(),
        url: newSourceUrl.trim(),
        method: newSourceMethod,
        region: newSourceRegion,
        defaultAutoCategory: newSourceCategory
      });
      applyPayload(payload);
      await notificationService.syncBackendStateToFirestore(payload);
      setNewSourceName('');
      setNewSourceDept('');
      setNewSourceUrl('');
      setShowAddSource(false);
      onNotify(
        source.connectionStatus === 'connected' ? 'success' : 'error',
        `स्रोत जोड़ा गया (${source.connectionStatus}): ${source.statusMessage}`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'नया स्रोत जोड़ने में त्रुटि।');
    } finally {
      setIsAddingSource(false);
    }
  };

  const openPreviewEditor = (item: DetectedNotification) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDesc(item.description || item.title);
    setEditAutoCat(item.autoCategory);
    setEditWebCat(item.websiteCategory);
    setEditLastDate(item.lastDate || '');
    setEditOfficialUrl(item.officialSourceUrl);
    setEditPdfUrl(item.pdfUrl || '');
    setEditApplyUrl(item.applyOnlineUrl || '');
  };

  const handleQuickApprove = async (item: DetectedNotification) => {
    setProcessingId(item.id);
    try {
      await notificationService.approveAndPublishNotification(item, {
        title: item.title,
        description: item.description || item.title,
        autoCategory: item.autoCategory,
        websiteCategory: item.websiteCategory,
        lastDate: item.lastDate || '',
        officialSourceUrl: item.officialSourceUrl,
        pdfUrl: item.pdfUrl || '',
        applyOnlineUrl: item.applyOnlineUrl || ''
      });
      setDetected((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: 'approved' } : d))
      );
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              publishedCount: prev.publishedCount + 1
            }
          : prev
      );
      onPostPublished();
      onNotify('success', 'अधिसूचना सत्यापित कर वेबसाइट पर प्रकाशित कर दी गई है!');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'प्रकाशन में त्रुटि हुई।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmEditedApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editTitle.trim() || !editOfficialUrl.trim()) {
      onNotify('error', 'शीर्षक और आधिकारिक स्रोत URL अनिवार्य हैं।');
      return;
    }

    setProcessingId(editingItem.id);
    try {
      await notificationService.approveAndPublishNotification(editingItem, {
        title: editTitle,
        description: editDesc,
        autoCategory: editAutoCat,
        websiteCategory: editWebCat,
        lastDate: editLastDate,
        officialSourceUrl: editOfficialUrl,
        pdfUrl: editPdfUrl,
        applyOnlineUrl: editApplyUrl
      });
      const editedId = editingItem.id;
      setDetected((prev) =>
        prev.map((d) =>
          d.id === editedId
            ? {
                ...d,
                title: editTitle,
                description: editDesc,
                autoCategory: editAutoCat,
                websiteCategory: editWebCat,
                lastDate: editLastDate,
                officialSourceUrl: editOfficialUrl,
                pdfUrl: editPdfUrl,
                applyOnlineUrl: editApplyUrl,
                status: 'approved'
              }
            : d
        )
      );
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              publishedCount: prev.publishedCount + 1
            }
          : prev
      );
      setEditingItem(null);
      onPostPublished();
      onNotify('success', 'संपादित अधिसूचना सत्यापित कर सफलतापूर्वक प्रकाशित कर दी गई है!');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'प्रकाशन में त्रुटि हुई।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: DetectedNotification) => {
    setProcessingId(item.id);
    try {
      await notificationService.rejectNotification(item);
      setDetected((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: 'rejected' } : d))
      );
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              pendingCount: Math.max(0, prev.pendingCount - 1),
              rejectedCount: prev.rejectedCount + 1
            }
          : prev
      );
      if (editingItem?.id === item.id) setEditingItem(null);
      onNotify('success', 'सूचना अस्वीकृत / डुप्लीकेट के रूप में चिह्नित की गई।');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'अस्वीकृत करने में त्रुटि।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleEmailAlerts = async () => {
    if (!summary) return;
    try {
      const updatedSummary = await notificationService.setEmailAlertsEnabled(
        !summary.emailAlertsEnabled
      );
      setSummary(updatedSummary);
      onNotify(
        'success',
        `ईमेल अलर्ट ${updatedSummary.emailAlertsEnabled ? 'सक्रिय' : 'बंद'} किए गए।`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'अलर्ट सेटिंग त्रुटि।');
    }
  };

  const handleTestEmailAlert = async () => {
    try {
      const res = await notificationService.sendTestEmailAlert();
      setLogs(res.logs);
      onNotify(res.ok ? 'success' : 'error', res.message);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'टेस्ट ईमेल त्रुटि।');
    }
  };

  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return detected.filter((item) => {
      if (item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.autoCategory !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q) ||
        item.notificationNumber.toLowerCase().includes(q)
      );
    });
  }, [detected, statusFilter, categoryFilter, queueSearch]);

  const connectedSources = useMemo(
    () => sources.filter((s) => s.connectionStatus === 'connected'),
    [sources]
  );
  const manualOrFailedSources = useMemo(
    () => sources.filter((s) => s.connectionStatus !== 'connected'),
    [sources]
  );

  if (isLoading && !summary) {
    return (
      <div className="py-12 text-center space-y-2">
        <Loader2 className="w-7 h-7 animate-spin text-[#BA0000] mx-auto" />
        <p className="text-xs font-semibold text-slate-600">
          स्वचालित सरकारी सूचना प्रणाली लोड हो रही है...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            स्वचालित सरकारी सूचना प्रणाली (Automatic Notifications)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            प्रत्येक {summary?.intervalMinutes || 30} मिनट में आधिकारिक पोर्टल्स की बैकएंड जाँच · नई सूचनाएँ बिना एडमिन स्वीकृति के सार्वजनिक नहीं होतीं
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunCheckAll}
          disabled={isRunningCheck}
          className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap min-h-[40px]"
        >
          <RefreshCw className={`w-4 h-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
          <span>{isRunningCheck ? 'सभी स्रोतों की जाँच जारी...' : 'अभी जाँच चलाएं (Run Check Now)'}</span>
        </button>
      </div>

      {/* 7 Required KPI Summary Grid (Tabular Numerals, Clean Borders) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 tabular-nums">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-500 block">मॉनिटर स्रोत</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {summary?.totalSources || 0}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {summary?.connectedCount || 0} लाइव कनेक्टेड
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-500 block">अंतिम जाँच समय</span>
          <span className="text-xs font-bold text-slate-900 mt-1.5 block leading-snug">
            {formatDateTime(summary?.lastCheckedAt || '')}
          </span>
          <span className="text-[10px] text-slate-500">
            हर {summary?.intervalMinutes || 30} मिनट
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-500 block">नई खोजी गईं</span>
          <span className="text-xl font-black text-blue-700 mt-1 block">
            {summary?.newlyDetectedLastRun || 0}
          </span>
          <span className="text-[11px] text-slate-500">अंतिम रन में</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-amber-800 block">लंबित स्वीकृति</span>
          <span className="text-xl font-black text-amber-900 mt-1 block">
            {summary?.pendingCount || 0}
          </span>
          <span className="text-[11px] text-amber-700">समीक्षा आवश्यक</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-emerald-800 block">प्रकाशित सूचनाएँ</span>
          <span className="text-xl font-black text-emerald-900 mt-1 block">
            {summary?.publishedCount || 0}
          </span>
          <span className="text-[11px] text-emerald-700">लाइव वेबसाइट पर</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-rose-800 block">असफल / मैनुअल</span>
          <span className="text-xl font-black text-rose-900 mt-1 block">
            {(summary?.failedSourcesCount || 0) + (summary?.manualConfigCount || 0)}
          </span>
          <span className="text-[11px] text-rose-700">कनेक्शन ध्यान दें</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-500 block">डुप्लीकेट छोड़ी गईं</span>
          <span className="text-xl font-black text-slate-800 mt-1 block">
            {summary?.duplicateCount || 0}
          </span>
          <span className="text-[11px] text-slate-500">स्वतः फ़िल्टर की गईं</span>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab('queue')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'queue'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          स्वीकृति कतार (Pending: {detected.filter((d) => d.status === 'pending').length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sources')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'sources'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          आधिकारिक स्रोत ({sources.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('logs')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'logs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          मॉनिटरिंग लॉग व ईमेल अलर्ट ({logs.length})
        </button>
      </div>

      {/* SUBTAB 1: ADMIN APPROVAL QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                {(['pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#001F3F] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'pending' && `लंबित (${detected.filter((d) => d.status === 'pending').length})`}
                    {st === 'approved' && `स्वीकृत (${detected.filter((d) => d.status === 'approved').length})`}
                    {st === 'rejected' && `अस्वीकृत (${detected.filter((d) => d.status === 'rejected').length})`}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | AutoNotificationCategory)
                }
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="all">सभी श्रेणियाँ (All 10 Categories)</option>
                {AUTO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="शीर्षक, विभाग या अधिसूचना नं. खोजें..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-8 text-center bg-slate-50 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                इस फ़िल्टर में कोई सूचना उपलब्ध नहीं है
              </p>
              <p className="text-xs text-slate-500">
                नए आधिकारिक अपडेट्स खोजने के लिए ऊपर "अभी जाँच चलाएं" बटन दबाएं या स्रोत सूची की जाँच करें।
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold tabular-nums">
                      <span className="text-[#BA0000] font-bold">{item.autoCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.department}</span>
                      {item.publishedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>प्रकाशन: {item.publishedDate}</span>
                        </>
                      )}
                      {item.notificationNumber && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">क्र.: {item.notificationNumber}</span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    {item.description && item.description !== item.title && (
                      <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <a
                        href={item.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>आधिकारिक स्रोत लिंक सत्यापित करें</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 font-semibold underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>आधिकारिक PDF देखें</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openPreviewEditor(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer whitespace-nowrap min-h-[38px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>प्रीव्यू व संपादन</span>
                    </button>

                    {item.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleQuickApprove(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer whitespace-nowrap min-h-[38px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>स्वीकृत व प्रकाशित</span>
                      </button>
                    )}

                    {item.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleReject(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer whitespace-nowrap min-h-[38px]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>अस्वीकार</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: OFFICIAL SOURCES MANAGEMENT */}
      {subTab === 'sources' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong className="text-emerald-700">{connectedSources.length} स्रोत लाइव कनेक्टेड</strong>
              {' · '}
              <strong className="text-amber-700">
                {manualOrFailedSources.length} स्रोत को मैनुअल कॉन्फ़िगरेशन या क्षेत्रीय नेटवर्क की आवश्यकता
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSource((prev) => !prev)}
              className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer whitespace-nowrap min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>नया सरकारी स्रोत जोड़ें</span>
            </button>
          </div>

          {showAddSource && (
            <form
              onSubmit={handleAddSourceSubmit}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-sm font-bold text-slate-900">
                नया आधिकारिक सरकारी स्रोत जोड़ें (RSS / Sitemap / API / HTML Notice Board)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    स्रोत का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="उदा. MP High Court Notices"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    विभाग का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSourceDept}
                    onChange={(e) => setNewSourceDept(e.target.value)}
                    placeholder="उदा. मध्य प्रदेश उच्च न्यायालय, जबलपुर"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    आधिकारिक RSS / API / Notice URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://example.gov.in/rss.xml"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    मॉनिटरिंग तरीका
                  </label>
                  <select
                    value={newSourceMethod}
                    onChange={(e) => setNewSourceMethod(e.target.value as SourceMonitorMethod)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="auto">Auto Detect (RSS / Sitemap / HTML / API / PDF)</option>
                    <option value="rss">Official RSS / Atom Feed</option>
                    <option value="sitemap">XML Sitemap</option>
                    <option value="api">Official JSON API</option>
                    <option value="html">HTML Notice Page</option>
                    <option value="pdf">Direct Official PDF Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">क्षेत्र (Region)</label>
                  <select
                    value={newSourceRegion}
                    onChange={(e) => setNewSourceRegion(e.target.value as 'MP' | 'Central' | 'State')}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="MP">Madhya Pradesh (MP)</option>
                    <option value="Central">Central Government</option>
                    <option value="State">Other State Dept</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    डिफ़ॉल्ट श्रेणी
                  </label>
                  <select
                    value={newSourceCategory}
                    onChange={(e) => setNewSourceCategory(e.target.value as AutoNotificationCategory)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {AUTO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSource(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isAddingSource}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {isAddingSource ? 'कनेक्शन जाँचा जा रहा है...' : 'स्रोत सहेजें व टेस्ट करें'}
                </button>
              </div>
            </form>
          )}

          {/* Sources Health Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-left text-xs text-slate-700 tabular-nums">
              <thead className="bg-slate-100 text-slate-900 font-bold text-[11px]">
                <tr>
                  <th className="p-3">आधिकारिक स्रोत / विभाग</th>
                  <th className="p-3">वास्तविक HTTP स्थिति व त्रुटि विवरण</th>
                  <th className="p-3">विधि / लेटेंसी</th>
                  <th className="p-3">जाँच इतिहास</th>
                  <th className="p-3 text-right">परीक्षण व मैनुअल कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50 align-top">
                    <td className="p-3 max-w-[270px]">
                      <div className="font-bold text-slate-900">{src.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{src.department}</div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-700 hover:underline truncate block mt-0.5"
                      >
                        {src.url}
                      </a>
                      {src.alternateUrl && (
                        <div className="text-[10px] text-indigo-700 truncate mt-0.5">
                          वैकल्पिक: {src.alternateUrl}
                        </div>
                      )}
                    </td>

                    <td className="p-3 max-w-[360px]">
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        {src.connectionStatus === 'connected' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Connected (HTTP {src.lastHttpStatus})</span>
                          </span>
                        )}
                        {src.connectionStatus === 'manual_config_needed' && (
                          <span className="inline-flex items-center gap-1 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Manual Config Required (HTTP {src.lastHttpStatus || 0}
                              {src.failureReason && src.failureReason !== 'NONE'
                                ? ` · ${src.failureReason}`
                                : ''}
                              )
                            </span>
                          </span>
                        )}
                        {src.connectionStatus === 'blocked_by_robots' && (
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>robots.txt प्रतिबंधित (ROBOTS_DISALLOWED)</span>
                          </span>
                        )}
                        {src.connectionStatus === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Failed (HTTP {src.lastHttpStatus || 0}
                              {src.failureReason && src.failureReason !== 'NONE'
                                ? ` · ${src.failureReason}`
                                : ''}
                              )
                            </span>
                          </span>
                        )}
                        {src.connectionStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>प्रतीक्षित (Pending)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1 leading-snug">
                        {src.statusMessage}
                      </p>
                      {src.lastErrorDetail && (
                        <p className="text-[10px] font-mono text-rose-700 mt-1 break-all">
                          Error: {src.lastErrorDetail}
                          {typeof src.retryCount === 'number' && src.retryCount > 0
                            ? ` (Retries: ${src.retryCount})`
                            : ''}
                        </p>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-800 uppercase">
                        {src.method}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {src.region} · {src.lastLatencyMs ? `${src.lastLatencyMs} ms` : '-'}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        सूचनाएँ मिलीं: <strong>{src.itemsDetectedLastRun}</strong>
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="text-[11px]">
                        <span className="text-slate-500">अंतिम जाँच:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(src.lastCheckedAt)}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5">
                        <span className="text-slate-500">अंतिम सफल:</span>{' '}
                        <span
                          className={`font-semibold ${
                            src.lastSuccessfulCheckAt ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {formatDateTime(src.lastSuccessfulCheckAt || '')}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={testingSourceId === src.id}
                          onClick={() => handleTestSingleSource(src.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold rounded text-[11px] cursor-pointer"
                          title="कनेक्शन, HTTP स्टेटस और robots.txt जाँचें"
                        >
                          <Wifi className="w-3 h-3" />
                          <span>{testingSourceId === src.id ? 'जाँच...' : 'कनेक्शन टेस्ट'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={extractingSourceId === src.id}
                          onClick={() => handleTestDataExtraction(src.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-800 border border-blue-200 font-bold rounded text-[11px] cursor-pointer"
                          title="डेटा पार्सिंग टेस्ट करें व सैंपल सूचनाएँ देखें"
                        >
                          <Database className="w-3 h-3" />
                          <span>
                            {extractingSourceId === src.id ? 'पार्सिंग...' : 'डेटा टेस्ट'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openManualConfig(src)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                            src.connectionStatus !== 'connected'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                          title="वैकल्पिक URL या मैनुअल सूचना दर्ज करें"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>मैनुअल कॉन्फ़िग</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSource(src)}
                          className={`px-2 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                            src.enabled
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {src.enabled ? 'सक्रिय' : 'बंद'}
                        </button>

                        {!src.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(src)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* SUBTAB 3: LOGS & OPTIONAL EMAIL ALERTS */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Mail className="w-4 h-4 text-[#BA0000]" />
                <span>वैकल्पिक एडमिन ईमेल अलर्ट ({AUTHORIZED_ADMIN_EMAIL})</span>
              </div>
              <p className="text-xs text-slate-600">
                {summary?.smtpConfigured
                  ? 'SMTP सर्वर कॉन्फ़िगर है — नई सूचना मिलने पर एडमिन को सारांश ईमेल भेजा जा सकता है।'
                  : 'ईमेल अलर्ट भेजने के लिए सर्वर Secrets/.env में SMTP_HOST, SMTP_USER और SMTP_PASS कॉन्फ़िगर करना आवश्यक है (वर्तमान में वेबसाइट पर रीयल-टाइम अलर्ट सक्रिय हैं)।'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleEmailAlerts}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  summary?.emailAlertsEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-800'
                }`}
              >
                {summary?.emailAlertsEnabled ? 'ईमेल अलर्ट चालू है' : 'ईमेल अलर्ट चालू करें'}
              </button>

              <button
                type="button"
                onClick={handleTestEmailAlert}
                className="px-3.5 py-2 rounded-lg bg-[#001F3F] hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                टेस्ट अलर्ट जाँचें
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
            <table className="w-full text-left text-xs text-slate-700 tabular-nums">
              <thead className="bg-slate-100 text-slate-900 font-bold text-[11px]">
                <tr>
                  <th className="p-3">समय</th>
                  <th className="p-3">प्रकार</th>
                  <th className="p-3">स्रोत</th>
                  <th className="p-3">स्थिति</th>
                  <th className="p-3">विवरण (नई / डुप्लीकेट / विफल)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-[11px] font-mono">
                      {formatDateTime(log.checkedAt)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-semibold uppercase text-[11px]">
                      {log.runType}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 max-w-[200px] truncate">
                      {log.sourceName || '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold">
                      {log.status === 'connected' && (
                        <span className="text-emerald-700">कनेक्टेड</span>
                      )}
                      {log.status === 'manual_config_needed' && (
                        <span className="text-amber-700">मैनुअल आवश्यक</span>
                      )}
                      {log.status === 'blocked_by_robots' && (
                        <span className="text-slate-600">robots.txt</span>
                      )}
                      {log.status === 'failed' && <span className="text-rose-700">विफल</span>}
                      {log.status === 'info' && <span className="text-blue-700">सूचना</span>}
                    </td>
                    <td className="p-3 max-w-[360px]">
                      <div className="text-slate-800">{log.message}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        नई: {log.newCount} · डुप्लीकेट: {log.duplicateCount} · विफल: {log.failedCount}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      अभी कोई लॉग उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREVIEW & EDIT BEFORE PUBLISHING MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#001F3F] text-white p-4 flex items-center justify-between border-b-2 border-[#BA0000]">
              <div>
                <h4 className="text-sm sm:text-base font-black">
                  अधिसूचना पूर्वावलोकन एवं सत्यापन (Admin Review)
                </h4>
                <p className="text-[11px] text-slate-300">
                  स्रोत: {editingItem.sourceName} · प्रकाशित करने से पहले आधिकारिक लिंक जाँचें
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditedApprove} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  शीर्षक (Notification Title) *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    स्वचालित श्रेणी (Auto Category)
                  </label>
                  <select
                    value={editAutoCat}
                    onChange={(e) => {
                      const val = e.target.value as AutoNotificationCategory;
                      setEditAutoCat(val);
                      setEditWebCat(mapAutoCategoryToWebsiteCategory(val, 'MP'));
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {AUTO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    वेबसाइट श्रेणी (Website Section)
                  </label>
                  <select
                    value={editWebCat}
                    onChange={(e) => setEditWebCat(e.target.value as PostCategory)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameHindi} ({c.nameEnglish})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  संक्षिप्त विवरण (Description)
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आधिकारिक स्रोत URL *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      required
                      value={editOfficialUrl}
                      onChange={(e) => setEditOfficialUrl(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <a
                      href={editOfficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-blue-700 flex items-center"
                      title="ब्राउज़र में सत्यापित करें"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आधिकारिक PDF लिंक (यदि उपलब्ध हो)
                  </label>
                  <input
                    type="url"
                    value={editPdfUrl}
                    onChange={(e) => setEditPdfUrl(e.target.value)}
                    placeholder="https://.../notice.pdf"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ऑनलाइन आवेदन लिंक (यदि उपलब्ध हो)
                  </label>
                  <input
                    type="url"
                    value={editApplyUrl}
                    onChange={(e) => setEditApplyUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    अंतिम तिथि (केवल यदि अधिसूचना में हो)
                  </label>
                  <input
                    type="text"
                    value={editLastDate}
                    onChange={(e) => setEditLastDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={processingId === editingItem.id}
                  onClick={() => handleReject(editingItem)}
                  className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                >
                  अस्वीकार करें (Reject)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    बंद करें
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === editingItem.id}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {processingId === editingItem.id
                        ? 'प्रकाशित हो रहा है...'
                        : 'सत्यापित कर प्रकाशित करें'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DATA EXTRACTION TEST PREVIEW MODAL */}
      {extractionPreview && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#001F3F] text-white p-4 flex items-center justify-between border-b-2 border-[#BA0000]">
              <div>
                <h4 className="text-sm sm:text-base font-black">
                  डेटा निष्कर्षण परीक्षण परिणाम (Test Data Extraction)
                </h4>
                <p className="text-[11px] text-slate-300">
                  {extractionPreview.source.name} · HTTP {extractionPreview.probe.httpStatus || 0} ·{' '}
                  {extractionPreview.probe.latencyMs} ms · Status:{' '}
                  {extractionPreview.probe.connectionStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtractionPreview(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 tabular-nums">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block">कुल पढ़ी गईं</span>
                  <span className="text-lg font-black text-slate-900">
                    {extractionPreview.extractedTotal}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[11px] text-emerald-800 block">नई Pending कतार में</span>
                  <span className="text-lg font-black text-emerald-900">
                    {extractionPreview.newlyQueuedCount}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[11px] text-amber-800 block">डुप्लीकेट छोड़ी गईं</span>
                  <span className="text-lg font-black text-amber-900">
                    {extractionPreview.duplicateSkippedCount}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-800">
                  निदान (Diagnostics): {extractionPreview.probe.failureReason}
                </div>
                <p className="text-slate-700">{extractionPreview.probe.statusMessage}</p>
                {extractionPreview.probe.errorDetail && (
                  <p className="font-mono text-[11px] text-rose-700 break-all">
                    {extractionPreview.probe.errorDetail}
                  </p>
                )}
              </div>

              {extractionPreview.sampleItems.length > 0 ? (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-[340px] overflow-y-auto">
                  {extractionPreview.sampleItems.map((it, idx) => (
                    <div key={`${it.officialSourceUrl}_${idx}`} className="p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#BA0000]">{it.autoCategory}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            it.isDuplicate
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {it.isDuplicate ? 'Duplicate (Skipped)' : 'New -> Queued Pending'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{it.title}</div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>प्रारूप: {it.sourceFormat.toUpperCase()}</span>
                        {it.publishedDate && <span>तिथि: {it.publishedDate}</span>}
                        {it.lastDate && <span>अंतिम तिथि: {it.lastDate}</span>}
                        {it.notificationNumber && <span>क्र.: {it.notificationNumber}</span>}
                        <a
                          href={it.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 underline inline-flex items-center gap-1"
                        >
                          <span>स्रोत खोलें</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {it.pdfUrl && (
                          <a
                            href={it.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-700 underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                  इस स्रोत से कोई पठनीय अधिसूचना नहीं निकली। इसलिए इसे Connected नहीं माना गया है। आप नीचे
                  "मैनुअल कॉन्फ़िग" से वैकल्पिक फ़ीड सेट कर सकते हैं या मैनुअल नोटिस जोड़ सकते हैं।
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {extractionPreview.sampleItems.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = extractionPreview.source;
                      setExtractionPreview(null);
                      openManualConfig(target);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    मैनुअल कॉन्फ़िगरेशन खोलें
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExtractionPreview(null)}
                  className="px-4 py-2 rounded-lg bg-[#001F3F] text-white font-bold cursor-pointer"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL SOURCE CONFIGURATION & MANUAL NOTICE INTAKE MODAL */}
      {configSource && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-[#001F3F] text-white p-4 flex items-center justify-between border-b-2 border-[#BA0000]">
              <div>
                <h4 className="text-sm sm:text-base font-black">
                  मैनुअल स्रोत कॉन्फ़िगरेशन (Manual Source Configuration)
                </h4>
                <p className="text-[11px] text-slate-300">
                  {configSource.name} · वर्तमान कारण: {configSource.failureReason || 'NONE'} (HTTP{' '}
                  {configSource.lastHttpStatus || 0})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfigSource(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {configSource.manualNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                  <strong>तकनीकी नोट:</strong> {configSource.manualNotes}
                </div>
              )}

              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setConfigTab('url')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    configTab === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  वैकल्पिक URL / फ़ीड सेट करें
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTab('notice')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    configTab === 'notice'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  मैनुअल सूचना जोड़ें (Pending Approval)
                </button>
              </div>

              {configTab === 'url' ? (
                <form
                  onSubmit={(e) => handleSaveManualConfig(e, false)}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      मुख्य आधिकारिक URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={cfgUrl}
                      onChange={(e) => setCfgUrl(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        वैकल्पिक आधिकारिक RSS / API / PDF URL (Alternate URL)
                      </label>
                      {configSource.id === 'src_rrb_bhopal' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCfgAlternateUrl('https://www.rrc-wr.com/');
                            setCfgMethod('html');
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          RRC पश्चिम रेलवे (rrc-wr.com) भरें
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={cfgAlternateUrl}
                      onChange={(e) => setCfgAlternateUrl(e.target.value)}
                      placeholder="https://... (वैकल्पिक यदि मुख्य पोर्टल ब्लॉक/टाइमआउट हो)"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">पार्सिंग विधि</label>
                    <select
                      value={cfgMethod}
                      onChange={(e) => setCfgMethod(e.target.value as SourceMonitorMethod)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="auto">Auto Detect (RSS / Atom / Sitemap / JSON / HTML / PDF)</option>
                      <option value="rss">Official RSS / Atom XML</option>
                      <option value="api">Official JSON API</option>
                      <option value="html">HTML Notice Page</option>
                      <option value="sitemap">XML Sitemap</option>
                      <option value="pdf">Direct PDF Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      एडमिन मैनुअल नोट्स
                    </label>
                    <textarea
                      rows={2}
                      value={cfgNotes}
                      onChange={(e) => setCfgNotes(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setConfigSource(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      बंद करें
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-4 py-2 rounded-lg bg-[#001F3F] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSavingConfig ? 'सहेजा जा रहा है...' : 'कॉन्फ़िगरेशन सहेजें'}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingConfig}
                      onClick={(e) => handleSaveManualConfig(e, true)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      सहेजें व कनेक्शन टेस्ट करें
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitManualNotice} className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    WAF या क्षेत्रीय IP प्रतिबंध वाले पोर्टल (जैसे MPESB / MPPSC / MP Rojgar / RRB Bhopal)
                    की आधिकारिक सूचना सीधे यहाँ दर्ज करें — यह डुप्लीकेट जाँच के बाद{' '}
                    <strong>Pending Approval</strong> कतार में जुड़ेगी।
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      अधिसूचना शीर्षक (Title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="उदा. MPESB Group-2 Sub Group-4 Recruitment 2026 Notification"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      आधिकारिक स्रोत URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={manualOfficialUrl}
                      onChange={(e) => setManualOfficialUrl(e.target.value)}
                      placeholder="https://esb.mp.gov.in/..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        आधिकारिक PDF URL (वैकल्पिक)
                      </label>
                      <input
                        type="url"
                        value={manualPdfUrl}
                        onChange={(e) => setManualPdfUrl(e.target.value)}
                        placeholder="https://.../rulebook.pdf"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        अंतिम तिथि (वैकल्पिक)
                      </label>
                      <input
                        type="text"
                        value={manualLastDate}
                        onChange={(e) => setManualLastDate(e.target.value)}
                        placeholder="DD-MM-YYYY"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      संक्षिप्त विवरण (वैकल्पिक)
                    </label>
                    <textarea
                      rows={2}
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setConfigSource(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                    >
                      बंद करें
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingManual}
                      className="px-4 py-2 rounded-lg bg-[#BA0000] hover:bg-red-800 text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingManual
                        ? 'जोड़ा जा रहा है...'
                        : 'Pending Approval में जोड़ें'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
