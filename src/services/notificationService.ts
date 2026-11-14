import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';
import { postService } from './postService';
import {
  ApprovedNotification,
  AutoNotificationCategory,
  DetectedNotification,
  GovernmentSource,
  MonitoringLog,
  MonitoringSummary,
  PostCategory,
  SourceMonitorMethod
} from '../types';

const SOURCES_COLLECTION = 'government_sources';
const DETECTED_COLLECTION = 'detected_notifications';
const APPROVED_COLLECTION = 'approved_notifications';
const LOGS_COLLECTION = 'monitoring_logs';

export interface BackendMonitorPayload {
  summary: MonitoringSummary;
  sources: GovernmentSource[];
  detected: DetectedNotification[];
  approved: ApprovedNotification[];
  logs: MonitoringLog[];
}

export interface SourceProbeDiagnostics {
  connectionStatus: GovernmentSource['connectionStatus'];
  failureReason: NonNullable<GovernmentSource['failureReason']>;
  httpStatus: number;
  latencyMs: number;
  retryCount: number;
  robotsAllowed: boolean;
  contentType: string;
  resolvedUrl: string;
  statusMessage: string;
  errorDetail: string;
  readableItemsCount?: number;
}

export interface ConnectionTestResult {
  source: GovernmentSource;
  probe: SourceProbeDiagnostics;
  summary: MonitoringSummary;
  sources: GovernmentSource[];
  logs: MonitoringLog[];
}

export interface ExtractionTestResult {
  extraction: {
    source: GovernmentSource;
    probe: SourceProbeDiagnostics;
    extractedTotal: number;
    newlyQueuedCount: number;
    duplicateSkippedCount: number;
    sampleItems: Array<{
      title: string;
      autoCategory: string;
      publishedDate: string;
      lastDate: string;
      notificationNumber: string;
      officialSourceUrl: string;
      pdfUrl: string;
      sourceFormat: string;
      isDuplicate: boolean;
    }>;
  };
  summary: MonitoringSummary;
  sources: GovernmentSource[];
  detected: DetectedNotification[];
  logs: MonitoringLog[];
}

export function mapAutoCategoryToWebsiteCategory(
  autoCategory: AutoNotificationCategory,
  region: 'MP' | 'Central' | 'State' = 'MP'
): PostCategory {
  switch (autoCategory) {
    case 'Latest Government Jobs':
    case 'MP Government Jobs':
    case 'Central Government Jobs':
      return 'latest-jobs';
    case 'Sarkari Yojana':
      return region === 'Central' ? 'central-schemes' : 'mp-schemes';
    case 'Admit Card':
      return 'admit-card';
    case 'Results':
      return 'results';
    case 'Answer Key':
      return 'answer-key';
    case 'Government Orders':
    case 'Exam Notifications':
    case 'Important Notices':
    default:
      return 'govt-updates';
  }
}

async function getAdminAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('कृपया पहले एडमिन खाते से लॉगिन करें।');
  }
  const token = await currentUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function sanitizeSourceDoc(s: GovernmentSource) {
  return {
    name: String(s.name || '').slice(0, 150),
    department: String(s.department || '').slice(0, 200),
    url: String(s.url || '').slice(0, 500),
    alternateUrl: String(s.alternateUrl || '').slice(0, 500),
    portalHomeUrl: String(s.portalHomeUrl || s.url || '').slice(0, 500),
    method: s.method || 'auto',
    region: s.region || 'MP',
    defaultAutoCategory: String(s.defaultAutoCategory || 'Important Notices').slice(0, 60),
    enabled: Boolean(s.enabled),
    isDefault: Boolean(s.isDefault),
    connectionStatus: s.connectionStatus || 'pending',
    failureReason: String(s.failureReason || 'NONE').slice(0, 40),
    statusMessage: String(s.statusMessage || '').slice(0, 500),
    lastErrorDetail: String(s.lastErrorDetail || '').slice(0, 500),
    lastCheckedAt: String(s.lastCheckedAt || '').slice(0, 64),
    lastSuccessfulCheckAt: String(s.lastSuccessfulCheckAt || '').slice(0, 64),
    lastHttpStatus: Number(s.lastHttpStatus || 0),
    lastLatencyMs: Number(s.lastLatencyMs || 0),
    retryCount: Number(s.retryCount || 0),
    itemsDetectedLastRun: Number(s.itemsDetectedLastRun || 0),
    robotsAllowed: Boolean(s.robotsAllowed),
    manualNotes: String(s.manualNotes || '').slice(0, 500),
    createdAt: String(s.createdAt || new Date().toISOString()).slice(0, 64),
    updatedAt: String(s.updatedAt || new Date().toISOString()).slice(0, 64)
  };
}

function sanitizeDetectedDoc(d: DetectedNotification) {
  return {
    fingerprint: String(d.fingerprint || '').slice(0, 128),
    sourceId: String(d.sourceId || '').slice(0, 128),
    sourceName: String(d.sourceName || '').slice(0, 150),
    department: String(d.department || '').slice(0, 200),
    title: String(d.title || '').slice(0, 400),
    description: String(d.description || '').slice(0, 2000),
    autoCategory: String(d.autoCategory || 'Important Notices').slice(0, 60),
    websiteCategory: String(d.websiteCategory || 'govt-updates').slice(0, 50),
    publishedDate: String(d.publishedDate || '').slice(0, 64),
    lastDate: String(d.lastDate || '').slice(0, 64),
    notificationNumber: String(d.notificationNumber || '').slice(0, 150),
    officialSourceUrl: String(d.officialSourceUrl || '').slice(0, 600),
    pdfUrl: String(d.pdfUrl || '').slice(0, 600),
    applyOnlineUrl: String(d.applyOnlineUrl || '').slice(0, 600),
    status: d.status || 'pending',
    detectedAt: String(d.detectedAt || new Date().toISOString()).slice(0, 64),
    reviewedAt: String(d.reviewedAt || '').slice(0, 64),
    reviewedBy: String(d.reviewedBy || '').slice(0, 150),
    publishedPostId: String(d.publishedPostId || '').slice(0, 128)
  };
}

function sanitizeApprovedDoc(a: ApprovedNotification) {
  return {
    detectedId: String(a.detectedId || '').slice(0, 128),
    fingerprint: String(a.fingerprint || '').slice(0, 128),
    sourceId: String(a.sourceId || '').slice(0, 128),
    sourceName: String(a.sourceName || '').slice(0, 150),
    department: String(a.department || '').slice(0, 200),
    title: String(a.title || '').slice(0, 400),
    description: String(a.description || '').slice(0, 2000),
    autoCategory: String(a.autoCategory || 'Important Notices').slice(0, 60),
    websiteCategory: String(a.websiteCategory || 'govt-updates').slice(0, 50),
    publishedDate: String(a.publishedDate || '').slice(0, 64),
    lastDate: String(a.lastDate || '').slice(0, 64),
    notificationNumber: String(a.notificationNumber || '').slice(0, 150),
    officialSourceUrl: String(a.officialSourceUrl || '').slice(0, 600),
    pdfUrl: String(a.pdfUrl || '').slice(0, 600),
    applyOnlineUrl: String(a.applyOnlineUrl || '').slice(0, 600),
    approvedBy: String(a.approvedBy || AUTHORIZED_ADMIN_EMAIL).slice(0, 150),
    approvedAt: String(a.approvedAt || new Date().toISOString()).slice(0, 64),
    linkedPostId: String(a.linkedPostId || '').slice(0, 128)
  };
}

function sanitizeLogDoc(log: MonitoringLog) {
  return {
    runType: log.runType || 'scheduled',
    sourceId: String(log.sourceId || '').slice(0, 128),
    sourceName: String(log.sourceName || '').slice(0, 150),
    status: log.status || 'info',
    message: String(log.message || '').slice(0, 600),
    newCount: Number(log.newCount || 0),
    duplicateCount: Number(log.duplicateCount || 0),
    failedCount: Number(log.failedCount || 0),
    checkedAt: String(log.checkedAt || new Date().toISOString()).slice(0, 64)
  };
}

function cleanDocId(rawId: string): string {
  const safe = rawId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return safe || `id_${Date.now()}`;
}

export const notificationService = {
  // Public subscription: ONLY admin-approved notifications in Firestore
  subscribeApprovedNotifications(
    onData: (items: ApprovedNotification[]) => void,
    onFallbackError?: (err: unknown) => void
  ): Unsubscribe {
    const q = query(
      collection(db, APPROVED_COLLECTION),
      orderBy('approvedAt', 'desc'),
      limit(40)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ApprovedNotification[] = [];
        snapshot.forEach((snap) => {
          const data = snap.data();
          items.push({
            id: snap.id,
            detectedId: data.detectedId || '',
            fingerprint: data.fingerprint || '',
            sourceId: data.sourceId || '',
            sourceName: data.sourceName || '',
            department: data.department || '',
            title: data.title || '',
            description: data.description || '',
            autoCategory: data.autoCategory || 'Important Notices',
            websiteCategory: data.websiteCategory || 'govt-updates',
            publishedDate: data.publishedDate || '',
            lastDate: data.lastDate || '',
            notificationNumber: data.notificationNumber || '',
            officialSourceUrl: data.officialSourceUrl || '',
            pdfUrl: data.pdfUrl || '',
            applyOnlineUrl: data.applyOnlineUrl || '',
            approvedBy: data.approvedBy || '',
            approvedAt: data.approvedAt || new Date().toISOString(),
            linkedPostId: data.linkedPostId || ''
          });
        });
        onData(items);
      },
      (error) => {
        if (onFallbackError) onFallbackError(error);
        handleFirestoreError(error, OperationType.GET, APPROVED_COLLECTION);
      }
    );
  },

  // Public fallback fetch from backend endpoint (approved items only)
  async fetchPublicApprovedFromBackend(): Promise<ApprovedNotification[]> {
    try {
      const res = await fetch('/api/notifications/public');
      if (!res.ok) return [];
      const data = (await res.json()) as { notifications?: ApprovedNotification[] };
      return data.notifications || [];
    } catch {
      return [];
    }
  },

  // Admin: Fetch state from backend Express monitoring engine
  async fetchBackendMonitorState(): Promise<BackendMonitorPayload> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/state', { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'मॉनिटरिंग स्टेट लोड करने में त्रुटि।');
    }
    return data as BackendMonitorPayload;
  },

  // Admin: Trigger live check of official sources via backend
  async triggerBackendCheck(sourceId?: string): Promise<BackendMonitorPayload> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/run', {
      method: 'POST',
      headers,
      body: JSON.stringify(sourceId ? { sourceId } : {})
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'स्वचालित जाँच चलाने में त्रुटि हुई।');
    }
    return data as BackendMonitorPayload;
  },

  // Admin: Synchronize backend monitoring state into Firestore collections safely
  async syncBackendStateToFirestore(payload: BackendMonitorPayload): Promise<void> {
    if (!auth.currentUser?.emailVerified) return;

    try {
      // Load existing Firestore detected IDs so admin-reviewed decisions in Firestore aren't overwritten
      const existingDetectedSnap = await getDocs(collection(db, DETECTED_COLLECTION));
      const existingStatuses = new Map<string, string>();
      existingDetectedSnap.forEach((d) => {
        existingStatuses.set(d.id, String(d.data().status || 'pending'));
      });

      const batch = writeBatch(db);
      let opCount = 0;

      for (const src of payload.sources.slice(0, 40)) {
        const docId = cleanDocId(src.id);
        batch.set(doc(db, SOURCES_COLLECTION, docId), sanitizeSourceDoc(src), { merge: true });
        opCount++;
      }

      for (const det of payload.detected.slice(0, 60)) {
        const docId = cleanDocId(det.id);
        const existingStatus = existingStatuses.get(docId);
        // Preserve already approved/rejected status in Firestore
        if (existingStatus === 'approved' || existingStatus === 'rejected') {
          continue;
        }
        batch.set(doc(db, DETECTED_COLLECTION, docId), sanitizeDetectedDoc(det), { merge: true });
        opCount++;
      }

      for (const log of payload.logs.slice(0, 35)) {
        const docId = cleanDocId(log.id);
        batch.set(doc(db, LOGS_COLLECTION, docId), sanitizeLogDoc(log), { merge: true });
        opCount++;
      }

      if (opCount > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'monitoring_sync');
    }
  },

  // Admin: Add new official government source
  async addSource(input: {
    name: string;
    department: string;
    url: string;
    portalHomeUrl?: string;
    method: SourceMonitorMethod;
    region: 'MP' | 'Central' | 'State';
    defaultAutoCategory: AutoNotificationCategory;
  }): Promise<{
    source: GovernmentSource;
    payload: BackendMonitorPayload;
  }> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/sources', {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'नया सरकारी स्रोत जोड़ने में त्रुटि हुई।');
    }

    const source = data.source as GovernmentSource;
    try {
      await setDoc(doc(db, SOURCES_COLLECTION, cleanDocId(source.id)), sanitizeSourceDoc(source));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${SOURCES_COLLECTION}/${source.id}`);
    }

    return {
      source,
      payload: {
        summary: data.summary,
        sources: data.sources,
        detected: data.detected,
        approved: data.approved || [],
        logs: data.logs || []
      }
    };
  },

  async toggleSourceEnabled(sourceId: string, enabled: boolean): Promise<GovernmentSource> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/sources/${encodeURIComponent(sourceId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'स्रोत अपडेट करने में त्रुटि हुई।');
    }
    const updated = data.source as GovernmentSource;
    try {
      await setDoc(doc(db, SOURCES_COLLECTION, cleanDocId(updated.id)), sanitizeSourceDoc(updated), {
        merge: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SOURCES_COLLECTION}/${sourceId}`);
    }
    return updated;
  },

  async updateSourceConfig(
    sourceId: string,
    updates: {
      url?: string;
      alternateUrl?: string;
      method?: SourceMonitorMethod;
      manualNotes?: string;
      enabled?: boolean;
    }
  ): Promise<GovernmentSource> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/sources/${encodeURIComponent(sourceId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'स्रोत कॉन्फ़िगरेशन सहेजने में त्रुटि हुई।');
    }
    const updated = data.source as GovernmentSource;
    try {
      await setDoc(doc(db, SOURCES_COLLECTION, cleanDocId(updated.id)), sanitizeSourceDoc(updated), {
        merge: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${SOURCES_COLLECTION}/${sourceId}`);
    }
    return updated;
  },

  async testSourceConnection(sourceId: string): Promise<ConnectionTestResult> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/sources/${encodeURIComponent(sourceId)}/test-connection`, {
      method: 'POST',
      headers
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'स्रोत कनेक्शन परीक्षण विफल रहा।');
    }
    const result = data as ConnectionTestResult;
    if (auth.currentUser?.emailVerified) {
      setDoc(
        doc(db, SOURCES_COLLECTION, cleanDocId(result.source.id)),
        sanitizeSourceDoc(result.source),
        { merge: true }
      ).catch((error) => {
        console.warn('Firestore source test-connection sync error:', error);
      });
    }
    return result;
  },

  async testSourceExtraction(sourceId: string): Promise<ExtractionTestResult> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/sources/${encodeURIComponent(sourceId)}/test-extraction`, {
      method: 'POST',
      headers
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'डेटा निष्कर्षण परीक्षण विफल रहा।');
    }
    const result = data as ExtractionTestResult;
    this.syncBackendStateToFirestore({
      summary: result.summary,
      sources: result.sources,
      detected: result.detected,
      approved: [],
      logs: result.logs
    }).catch((err) => {
      console.warn('Firestore extraction sync error:', err);
    });
    return result;
  },

  async submitManualNotice(input: {
    sourceId: string;
    title: string;
    description?: string;
    officialSourceUrl: string;
    pdfUrl?: string;
    lastDate?: string;
    publishedDate?: string;
  }): Promise<{
    detectedRecord: DetectedNotification;
    summary: MonitoringSummary;
    sources: GovernmentSource[];
    detected: DetectedNotification[];
    logs: MonitoringLog[];
  }> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/manual-notice', {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'मैनुअल अधिसूचना जोड़ने में त्रुटि हुई।');
    }
    const record = data.detectedRecord as DetectedNotification;
    if (auth.currentUser?.emailVerified) {
      try {
        await setDoc(
          doc(db, DETECTED_COLLECTION, cleanDocId(record.id)),
          sanitizeDetectedDoc(record),
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${DETECTED_COLLECTION}/${record.id}`);
      }
    }
    return data;
  },

  async deleteSource(sourceId: string): Promise<void> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/sources/${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'स्रोत हटाने में त्रुटि हुई।');
    }
    try {
      await deleteDoc(doc(db, SOURCES_COLLECTION, cleanDocId(sourceId)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${SOURCES_COLLECTION}/${sourceId}`);
    }
  },

  // Admin: Approve & publish detected notification into Firestore approved_notifications + posts
  async approveAndPublishNotification(
    item: DetectedNotification,
    edits: {
      title: string;
      description: string;
      autoCategory: AutoNotificationCategory;
      websiteCategory: PostCategory;
      lastDate: string;
      officialSourceUrl: string;
      pdfUrl: string;
      applyOnlineUrl: string;
    }
  ): Promise<ApprovedNotification> {
    const cleanTitle = edits.title.trim().slice(0, 300);
    const cleanDesc = edits.description.trim().slice(0, 1000) || cleanTitle;
    const cleanWebsiteUrl = edits.officialSourceUrl.trim().slice(0, 500);
    const cleanPdfUrl = edits.pdfUrl.trim().slice(0, 500);
    const cleanApplyUrl = edits.applyOnlineUrl.trim().slice(0, 500);
    const now = new Date().toISOString();

    // 1. Publish verified post in `posts` collection so it renders across categories & 3-col grids
    const createdPostId = await postService.createPost({
      title: cleanTitle,
      category: edits.websiteCategory,
      department: item.department.slice(0, 150),
      shortDescription: cleanDesc,
      fullDescription: [
        cleanDesc,
        '',
        `विभाग: ${item.department}`,
        `स्वचालित श्रेणी: ${edits.autoCategory}`,
        item.notificationNumber ? `अधिसूचना क्रमांक: ${item.notificationNumber}` : '',
        item.publishedDate ? `प्रकाशन तिथि: ${item.publishedDate}` : '',
        edits.lastDate ? `अंतिम तिथि: ${edits.lastDate}` : '',
        `आधिकारिक स्रोत लिंक: ${cleanWebsiteUrl}`,
        cleanPdfUrl ? `आधिकारिक PDF: ${cleanPdfUrl}` : ''
      ]
        .filter(Boolean)
        .join('\n'),
      startDate: item.publishedDate || '',
      lastDate: edits.lastDate || '',
      applyOnlineUrl: cleanApplyUrl,
      notificationPdfUrl: cleanPdfUrl,
      officialWebsiteUrl: cleanWebsiteUrl,
      thumbnailUrl: 'default',
      isFeatured: true,
      isUrgent: Boolean(edits.lastDate),
      authorEmail: AUTHORIZED_ADMIN_EMAIL,
      createdAt: now,
      updatedAt: now
    });

    // 2. Persist verified doc in `approved_notifications` & mark `detected_notifications` approved
    const approvedRecord: ApprovedNotification = {
      id: `app_${cleanDocId(item.id.replace(/^det_/, ''))}`,
      detectedId: item.id,
      fingerprint: item.fingerprint,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      department: item.department,
      title: cleanTitle,
      description: edits.description.trim().slice(0, 2000),
      autoCategory: edits.autoCategory,
      websiteCategory: edits.websiteCategory,
      publishedDate: item.publishedDate,
      lastDate: edits.lastDate.trim(),
      notificationNumber: item.notificationNumber,
      officialSourceUrl: cleanWebsiteUrl,
      pdfUrl: cleanPdfUrl,
      applyOnlineUrl: cleanApplyUrl,
      approvedBy: AUTHORIZED_ADMIN_EMAIL,
      approvedAt: now,
      linkedPostId: createdPostId
    };

    const updatedDetected: DetectedNotification = {
      ...item,
      title: cleanTitle,
      description: edits.description.trim().slice(0, 2000),
      autoCategory: edits.autoCategory,
      websiteCategory: edits.websiteCategory,
      lastDate: edits.lastDate.trim(),
      officialSourceUrl: cleanWebsiteUrl,
      pdfUrl: cleanPdfUrl,
      applyOnlineUrl: cleanApplyUrl,
      status: 'approved',
      reviewedAt: now,
      reviewedBy: AUTHORIZED_ADMIN_EMAIL,
      publishedPostId: createdPostId
    };

    try {
      await setDoc(
        doc(db, APPROVED_COLLECTION, cleanDocId(approvedRecord.id)),
        sanitizeApprovedDoc(approvedRecord)
      );
      await setDoc(
        doc(db, DETECTED_COLLECTION, cleanDocId(item.id)),
        sanitizeDetectedDoc(updatedDetected),
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${APPROVED_COLLECTION}/${approvedRecord.id}`);
    }

    // 3. Synchronize backend monitor store
    const headers = await getAdminAuthHeaders();
    await fetch(`/api/monitor/notifications/${encodeURIComponent(item.id)}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...edits,
        linkedPostId: createdPostId
      })
    });

    return approvedRecord;
  },

  // Admin: Reject notification (duplicate / irrelevant)
  async rejectNotification(item: DetectedNotification): Promise<void> {
    const now = new Date().toISOString();
    const updatedDetected: DetectedNotification = {
      ...item,
      status: 'rejected',
      reviewedAt: now,
      reviewedBy: AUTHORIZED_ADMIN_EMAIL
    };

    try {
      await setDoc(
        doc(db, DETECTED_COLLECTION, cleanDocId(item.id)),
        sanitizeDetectedDoc(updatedDetected),
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${DETECTED_COLLECTION}/${item.id}`);
    }

    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/monitor/notifications/${encodeURIComponent(item.id)}/reject`, {
      method: 'POST',
      headers
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'सूचना अस्वीकृत करने में त्रुटि हुई।');
    }
  },

  async setEmailAlertsEnabled(enabled: boolean): Promise<MonitoringSummary> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/settings', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ emailAlertsEnabled: enabled })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'अलर्ट सेटिंग सहेजने में त्रुटि।');
    }
    return data.summary as MonitoringSummary;
  },

  async sendTestEmailAlert(): Promise<{ ok: boolean; message: string; logs: MonitoringLog[] }> {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/monitor/test-email', {
      method: 'POST',
      headers
    });
    return (await res.json()) as { ok: boolean; message: string; logs: MonitoringLog[] };
  }
};
