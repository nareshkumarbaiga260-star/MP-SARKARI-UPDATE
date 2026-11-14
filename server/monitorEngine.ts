import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import {
  createDefaultSources,
  LEGACY_SOURCE_URL_MIGRATIONS
} from './defaultSources.ts';
import {
  classifyNotification,
  computeNotificationFingerprint,
  extractLastDate,
  extractNotificationNumber,
  extractPublishedDate
} from './classifier.ts';
import {
  sourceMonitoringService,
  type SourceProbeResult
} from './SourceMonitoringService.ts';
import type { ParsedCandidateItem } from './parsers.ts';
import type {
  DetectedNotificationRecord,
  GovernmentSourceRecord,
  MonitorStoreState,
  MonitoringLogRecord
} from './types.ts';

const DEFAULT_INTERVAL_MINUTES = Math.max(
  5,
  Number(process.env.MONITOR_INTERVAL_MINUTES || '30') || 30
);
const DATA_DIR = path.resolve(process.cwd(), '.monitor-data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

export interface ExtractionTestResult {
  source: GovernmentSourceRecord;
  probe: {
    connectionStatus: SourceProbeResult['connectionStatus'];
    failureReason: SourceProbeResult['failureReason'];
    httpStatus: number;
    latencyMs: number;
    retryCount: number;
    robotsAllowed: boolean;
    contentType: string;
    resolvedUrl: string;
    statusMessage: string;
    errorDetail: string;
  };
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
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadMonitorState(): MonitorStoreState {
  ensureDataDir();
  if (fs.existsSync(STATE_FILE)) {
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<MonitorStoreState>;
      const defaultSources = createDefaultSources();
      const existingSources = Array.isArray(parsed.sources) ? parsed.sources : [];
      const existingIds = new Set(existingSources.map((s) => s.id));

      // Upgrade legacy broken default endpoints (SSC SPA, UPSC apex timeout, PIB 403) transparently
      const upgradedSources: GovernmentSourceRecord[] = existingSources.map((src) => {
        const migration = LEGACY_SOURCE_URL_MIGRATIONS[src.id];
        const def = defaultSources.find((d) => d.id === src.id);
        const mergedBase: GovernmentSourceRecord = {
          ...src,
          failureReason: src.failureReason || 'NONE',
          lastErrorDetail: src.lastErrorDetail || '',
          lastSuccessfulCheckAt:
            src.lastSuccessfulCheckAt ||
            (src.connectionStatus === 'connected' ? src.lastCheckedAt : ''),
          retryCount: src.retryCount ?? 0,
          alternateUrl: src.alternateUrl || def?.alternateUrl || '',
          manualNotes: src.manualNotes || def?.manualNotes || ''
        };
        if (migration && mergedBase.url === migration.oldUrl) {
          return {
            ...mergedBase,
            name: def?.name || mergedBase.name,
            url: migration.newUrl,
            method: migration.newMethod,
            connectionStatus: 'pending',
            failureReason: 'NONE',
            statusMessage: 'अद्यतन आधिकारिक फ़ीड सेट — प्रारंभिक जाँच प्रतीक्षित',
            lastErrorDetail: '',
            manualNotes: migration.notes,
            updatedAt: new Date().toISOString()
          };
        }
        return mergedBase;
      });

      for (const def of defaultSources) {
        if (!existingIds.has(def.id)) {
          upgradedSources.push(def);
        }
      }

      return {
        sources: upgradedSources,
        detected: Array.isArray(parsed.detected) ? parsed.detected : [],
        approved: Array.isArray(parsed.approved) ? parsed.approved : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        lastRunAt: parsed.lastRunAt || '',
        nextScheduledAt:
          parsed.nextScheduledAt ||
          new Date(Date.now() + DEFAULT_INTERVAL_MINUTES * 60 * 1000).toISOString(),
        intervalMinutes: DEFAULT_INTERVAL_MINUTES,
        lastRunNewCount: parsed.lastRunNewCount || 0,
        lastRunDuplicateCount: parsed.lastRunDuplicateCount || 0,
        lastRunFailedCount: parsed.lastRunFailedCount || 0,
        totalDuplicatesSkipped: parsed.totalDuplicatesSkipped || 0,
        emailAlertsEnabled: Boolean(parsed.emailAlertsEnabled)
      };
    } catch (err) {
      console.warn('Could not parse existing monitor state, initializing clean store:', err);
    }
  }

  const initial: MonitorStoreState = {
    sources: createDefaultSources(),
    detected: [],
    approved: [],
    logs: [],
    lastRunAt: '',
    nextScheduledAt: new Date(Date.now() + DEFAULT_INTERVAL_MINUTES * 60 * 1000).toISOString(),
    intervalMinutes: DEFAULT_INTERVAL_MINUTES,
    lastRunNewCount: 0,
    lastRunDuplicateCount: 0,
    lastRunFailedCount: 0,
    totalDuplicatesSkipped: 0,
    emailAlertsEnabled: false
  };
  saveMonitorState(initial);
  return initial;
}

export function saveMonitorState(state: MonitorStoreState): void {
  ensureDataDir();
  const tmpFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, STATE_FILE);
}

function buildDetectedRecord(
  source: GovernmentSourceRecord,
  item: ParsedCandidateItem,
  fp: string,
  checkedAt: string
): DetectedNotificationRecord {
  const classified = classifyNotification(
    item.title,
    item.description,
    source.region,
    source.defaultAutoCategory
  );
  const combinedText = `${item.title} ${item.description}`;
  const publishedDate = extractPublishedDate(
    item.rawPubDate,
    combinedText,
    item.officialSourceUrl
  );
  const lastDate = extractLastDate(combinedText);
  const notificationNumber = extractNotificationNumber(combinedText);

  return {
    id: `det_${fp.slice(0, 16)}`,
    fingerprint: fp,
    sourceId: source.id,
    sourceName: source.name,
    department: source.department,
    title: item.title,
    description: item.description,
    autoCategory: classified.autoCategory,
    websiteCategory: classified.websiteCategory,
    publishedDate,
    lastDate,
    notificationNumber,
    officialSourceUrl: item.officialSourceUrl,
    pdfUrl: item.pdfUrl,
    applyOnlineUrl: item.applyOnlineUrl,
    status: 'pending',
    detectedAt: checkedAt
  };
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendAdminSummaryEmail(
  newItems: DetectedNotificationRecord[],
  isTest = false
): Promise<{ sent: boolean; message: string }> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'nareshkumarbaiga260@gmail.com';
  if (!isSmtpConfigured()) {
    return {
      sent: false,
      message:
        'SMTP क्रेडेंशियल (.env / Secrets में SMTP_HOST, SMTP_USER, SMTP_PASS) कॉन्फ़िगर नहीं हैं, इसलिए ईमेल अलर्ट नहीं भेजा गया।'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || '587'),
      secure: Number(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const subject = isTest
      ? 'MP SARKARI UPDATE — टेस्ट एडमिन नोटिफिकेशन अलर्ट'
      : `MP SARKARI UPDATE: ${newItems.length} नई सरकारी सूचनाएँ एडमिन स्वीकृति के लिए लंबित`;

    const lines = isTest
      ? [
          'नमस्ते एडमिन,',
          'यह MP SARKARI UPDATE स्वचालित सरकारी सूचना प्रणाली का परीक्षण ईमेल अलर्ट है।',
          `समय: ${new Date().toLocaleString('en-IN')}`
        ]
      : [
          `कुल ${newItems.length} नई आधिकारिक सरकारी सूचनाएँ खोजी गई हैं (प्रकाशित करने से पहले Admin Dashboard में सत्यापित करें):`,
          '',
          ...newItems
            .slice(0, 15)
            .map(
              (item, idx) =>
                `${idx + 1}. [${item.autoCategory}] ${item.title}\n   विभाग: ${item.department}\n   स्रोत: ${item.officialSourceUrl}`
            )
        ];

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject,
      text: lines.join('\n')
    });

    return {
      sent: true,
      message: `${adminEmail} पर ईमेल अलर्ट सफलतापूर्वक भेजा गया।`
    };
  } catch (err) {
    return {
      sent: false,
      message: `ईमेल भेजने में त्रुटि: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

let activeRunPromise: Promise<MonitorStoreState> | null = null;

function applyOutcomeToSource(
  prev: GovernmentSourceRecord,
  outcome: SourceProbeResult,
  checkedAt: string,
  itemsDetectedCount: number
): GovernmentSourceRecord {
  const isNowConnected = outcome.connectionStatus === 'connected';
  return {
    ...prev,
    connectionStatus: outcome.connectionStatus,
    failureReason: outcome.failureReason,
    statusMessage: outcome.statusMessage,
    lastErrorDetail: outcome.errorDetail,
    lastCheckedAt: checkedAt,
    lastSuccessfulCheckAt: isNowConnected
      ? checkedAt
      : prev.lastSuccessfulCheckAt || '',
    lastHttpStatus: outcome.httpStatus,
    lastLatencyMs: outcome.latencyMs,
    retryCount: outcome.retryCount,
    itemsDetectedLastRun: itemsDetectedCount,
    robotsAllowed: outcome.robotsAllowed,
    updatedAt: checkedAt
  };
}

/**
 * Test Connection only (checks robots.txt, HTTP status, retry/timeout behavior, and readability without mutating pending queue)
 */
export async function testSourceConnectionOnly(sourceId: string): Promise<{
  state: MonitorStoreState;
  source: GovernmentSourceRecord;
  outcome: SourceProbeResult;
}> {
  const state = loadMonitorState();
  const idx = state.sources.findIndex((s) => s.id === sourceId);
  if (idx === -1) {
    throw new Error('स्रोत नहीं मिला।');
  }

  const checkedAt = new Date().toISOString();
  const source = state.sources[idx];
  const outcome = await sourceMonitoringService.probeAndExtractSource(source);

  const updatedSource = applyOutcomeToSource(
    source,
    outcome,
    checkedAt,
    outcome.items.length
  );
  state.sources[idx] = updatedSource;

  state.logs.unshift({
    id: `log_conn_${Date.now()}_${source.id.slice(0, 16)}`,
    runType: 'manual',
    sourceId: source.id,
    sourceName: source.name,
    status: outcome.connectionStatus === 'pending' ? 'info' : outcome.connectionStatus,
    message: `[Test Connection] ${outcome.statusMessage}`,
    newCount: 0,
    duplicateCount: 0,
    failedCount: outcome.connectionStatus === 'connected' ? 0 : 1,
    checkedAt
  });
  state.logs = state.logs.slice(0, 250);
  saveMonitorState(state);

  return { state, source: updatedSource, outcome };
}

/**
 * Test Data Extraction (probes, runs RSS/Atom/HTML/API/PDF parser, deduplicates, queues new notices into Pending Approval, and returns preview)
 */
export async function testSourceDataExtraction(sourceId: string): Promise<{
  state: MonitorStoreState;
  extraction: ExtractionTestResult;
}> {
  const state = loadMonitorState();
  const idx = state.sources.findIndex((s) => s.id === sourceId);
  if (idx === -1) {
    throw new Error('स्रोत नहीं मिला।');
  }

  const checkedAt = new Date().toISOString();
  const source = state.sources[idx];
  const outcome = await sourceMonitoringService.probeAndExtractSource(source);

  const knownFingerprints = new Set<string>([
    ...state.detected.map((d) => d.fingerprint),
    ...state.approved.map((a) => a.fingerprint)
  ]);

  const newlyAddedItems: DetectedNotificationRecord[] = [];
  const sampleItems: ExtractionTestResult['sampleItems'] = [];
  let dupCount = 0;

  for (const item of outcome.items) {
    const fp = computeNotificationFingerprint(item.officialSourceUrl, item.title);
    const isDuplicate = knownFingerprints.has(fp);
    const record = buildDetectedRecord(source, item, fp, checkedAt);

    sampleItems.push({
      title: record.title,
      autoCategory: record.autoCategory,
      publishedDate: record.publishedDate,
      lastDate: record.lastDate,
      notificationNumber: record.notificationNumber,
      officialSourceUrl: record.officialSourceUrl,
      pdfUrl: record.pdfUrl,
      sourceFormat: item.sourceFormat,
      isDuplicate
    });

    if (isDuplicate) {
      dupCount++;
    } else {
      knownFingerprints.add(fp);
      newlyAddedItems.push(record);
    }
  }

  if (newlyAddedItems.length > 0) {
    state.detected = [...newlyAddedItems, ...state.detected].slice(0, 400);
  }
  state.totalDuplicatesSkipped += dupCount;

  const updatedSource = applyOutcomeToSource(
    source,
    outcome,
    checkedAt,
    outcome.items.length
  );
  state.sources[idx] = updatedSource;

  state.logs.unshift({
    id: `log_ext_${Date.now()}_${source.id.slice(0, 16)}`,
    runType: 'manual',
    sourceId: source.id,
    sourceName: source.name,
    status: outcome.connectionStatus === 'pending' ? 'info' : outcome.connectionStatus,
    message: `[Test Extraction] ${outcome.statusMessage}`,
    newCount: newlyAddedItems.length,
    duplicateCount: dupCount,
    failedCount: outcome.connectionStatus === 'connected' ? 0 : 1,
    checkedAt
  });
  state.logs = state.logs.slice(0, 250);
  saveMonitorState(state);

  return {
    state,
    extraction: {
      source: updatedSource,
      probe: {
        connectionStatus: outcome.connectionStatus,
        failureReason: outcome.failureReason,
        httpStatus: outcome.httpStatus,
        latencyMs: outcome.latencyMs,
        retryCount: outcome.retryCount,
        robotsAllowed: outcome.robotsAllowed,
        contentType: outcome.contentType,
        resolvedUrl: outcome.resolvedUrl,
        statusMessage: outcome.statusMessage,
        errorDetail: outcome.errorDetail
      },
      extractedTotal: outcome.items.length,
      newlyQueuedCount: newlyAddedItems.length,
      duplicateSkippedCount: dupCount,
      sampleItems
    }
  };
}

export async function runMonitorCycle(
  runType: 'scheduled' | 'manual',
  specificSourceId?: string
): Promise<MonitorStoreState> {
  if (activeRunPromise) {
    return activeRunPromise;
  }

  activeRunPromise = (async () => {
    const state = loadMonitorState();
    const checkedAt = new Date().toISOString();

    const knownFingerprints = new Set<string>([
      ...state.detected.map((d) => d.fingerprint),
      ...state.approved.map((a) => a.fingerprint)
    ]);

    const targets = state.sources.filter((src) =>
      specificSourceId ? src.id === specificSourceId : src.enabled
    );

    let newCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const newlyAddedItems: DetectedNotificationRecord[] = [];
    const newLogs: MonitoringLogRecord[] = [];

    for (let i = 0; i < targets.length; i += 4) {
      const batch = targets.slice(i, i + 4);
      const outcomes = await Promise.all(
        batch.map(async (src) => ({
          source: src,
          outcome: await sourceMonitoringService.probeAndExtractSource(src)
        }))
      );

      for (const { source, outcome } of outcomes) {
        let srcNew = 0;
        let srcDup = 0;

        for (const item of outcome.items) {
          const fp = computeNotificationFingerprint(item.officialSourceUrl, item.title);
          if (knownFingerprints.has(fp)) {
            srcDup++;
            duplicateCount++;
            continue;
          }
          knownFingerprints.add(fp);

          const detectedRecord = buildDetectedRecord(source, item, fp, checkedAt);
          newlyAddedItems.push(detectedRecord);
          srcNew++;
          newCount++;
        }

        const idx = state.sources.findIndex((s) => s.id === source.id);
        if (idx !== -1) {
          state.sources[idx] = applyOutcomeToSource(
            state.sources[idx],
            outcome,
            checkedAt,
            outcome.items.length
          );
        }

        if (outcome.connectionStatus !== 'connected') {
          failedCount++;
        }

        newLogs.push({
          id: `log_${Date.now()}_${source.id.slice(0, 18)}_${Math.random().toString(36).slice(2, 6)}`,
          runType,
          sourceId: source.id,
          sourceName: source.name,
          status: outcome.connectionStatus === 'pending' ? 'info' : outcome.connectionStatus,
          message: outcome.statusMessage,
          newCount: srcNew,
          duplicateCount: srcDup,
          failedCount: outcome.connectionStatus !== 'connected' ? 1 : 0,
          checkedAt
        });
      }
    }

    if (newlyAddedItems.length > 0) {
      state.detected = [...newlyAddedItems, ...state.detected].slice(0, 400);
    }

    if (state.emailAlertsEnabled && newlyAddedItems.length > 0) {
      const emailResult = await sendAdminSummaryEmail(newlyAddedItems, false);
      newLogs.unshift({
        id: `log_alert_${Date.now()}`,
        runType: 'alert',
        sourceName: 'Admin Email Alert',
        status: emailResult.sent ? 'connected' : 'info',
        message: emailResult.message,
        newCount: newlyAddedItems.length,
        duplicateCount: 0,
        failedCount: emailResult.sent ? 0 : 1,
        checkedAt
      });
    }

    state.logs = [...newLogs, ...state.logs].slice(0, 250);
    if (!specificSourceId) {
      state.lastRunAt = checkedAt;
      state.nextScheduledAt = new Date(
        Date.now() + state.intervalMinutes * 60 * 1000
      ).toISOString();
      state.lastRunNewCount = newCount;
      state.lastRunDuplicateCount = duplicateCount;
      state.lastRunFailedCount = failedCount;
    } else {
      state.lastRunNewCount = newCount;
      state.lastRunDuplicateCount = duplicateCount;
    }
    state.totalDuplicatesSkipped += duplicateCount;

    saveMonitorState(state);
    return state;
  })();

  try {
    return await activeRunPromise;
  } finally {
    activeRunPromise = null;
  }
}
