import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  requireAuthorizedAdmin,
  type AuthenticatedAdminRequest
} from './server/authVerify.ts';
import {
  isSmtpConfigured,
  loadMonitorState,
  runMonitorCycle,
  saveMonitorState,
  sendAdminSummaryEmail,
  testSourceConnectionOnly,
  testSourceDataExtraction
} from './server/monitorEngine.ts';
import {
  classifyNotification,
  computeNotificationFingerprint,
  extractLastDate,
  extractNotificationNumber,
  extractPublishedDate,
  mapAutoCategoryToWebsiteCategory
} from './server/classifier.ts';
import type {
  ApprovedNotificationRecord,
  AutoNotificationCategory,
  DetectedNotificationRecord,
  GovernmentSourceRecord,
  SourceMonitorMethod
} from './server/types.ts';

const cliPortIdx = process.argv.indexOf('--port');
const cliPort = cliPortIdx !== -1 ? Number(process.argv[cliPortIdx + 1]) : 0;
const envPort = Number(process.env.PORT || '3000');
const nginxPort = process.env.NGINX_PORT ? Number(process.env.NGINX_PORT) : 0;
const PORT =
  cliPort > 0
    ? cliPort
    : nginxPort > 0 && envPort === nginxPort
      ? Number(process.env.DEFAULT_APP_PORT || '3000')
      : envPort;

function buildSummary(state: ReturnType<typeof loadMonitorState>) {
  const connectedCount = state.sources.filter((s) => s.connectionStatus === 'connected').length;
  const manualConfigCount = state.sources.filter(
    (s) => s.connectionStatus === 'manual_config_needed'
  ).length;
  const failedSourcesCount = state.sources.filter(
    (s) => s.connectionStatus === 'failed' || s.connectionStatus === 'blocked_by_robots'
  ).length;
  const pendingCount = state.detected.filter((d) => d.status === 'pending').length;
  const rejectedCount = state.detected.filter((d) => d.status === 'rejected').length;

  return {
    totalSources: state.sources.length,
    enabledSources: state.sources.filter((s) => s.enabled).length,
    connectedCount,
    manualConfigCount,
    failedSourcesCount,
    lastCheckedAt: state.lastRunAt,
    nextScheduledAt: state.nextScheduledAt,
    intervalMinutes: state.intervalMinutes,
    newlyDetectedLastRun: state.lastRunNewCount,
    pendingCount,
    publishedCount: state.approved.length,
    rejectedCount,
    duplicateCount: state.totalDuplicatesSkipped,
    lastRunDuplicateCount: state.lastRunDuplicateCount,
    emailAlertsEnabled: state.emailAlertsEnabled,
    smtpConfigured: isSmtpConfigured()
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    const state = loadMonitorState();
    res.json({
      ok: true,
      service: 'mp-sarkari-update-monitor',
      summary: buildSummary(state)
    });
  });

  // Public approved notifications endpoint (ONLY admin-verified approved notices)
  app.get('/api/notifications/public', (_req, res) => {
    const state = loadMonitorState();
    res.json({
      notifications: state.approved.slice(0, 50)
    });
  });

  // Admin: Get full monitoring dashboard state
  app.get('/api/monitor/state', requireAuthorizedAdmin, (_req, res) => {
    const state = loadMonitorState();
    res.json({
      summary: buildSummary(state),
      sources: state.sources,
      detected: state.detected,
      approved: state.approved,
      logs: state.logs
    });
  });

  // Admin: Trigger immediate check (all sources or one sourceId)
  app.post(
    '/api/monitor/run',
    requireAuthorizedAdmin,
    async (req: AuthenticatedAdminRequest, res) => {
      try {
        const sourceId =
          typeof req.body?.sourceId === 'string' ? req.body.sourceId.trim() : undefined;
        const state = await runMonitorCycle('manual', sourceId || undefined);
        res.json({
          ok: true,
          summary: buildSummary(state),
          sources: state.sources,
          detected: state.detected,
          approved: state.approved,
          logs: state.logs
        });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Monitoring run failed.'
        });
      }
    }
  );

  // Admin: Add new official government source
  app.post(
    '/api/monitor/sources',
    requireAuthorizedAdmin,
    async (req: AuthenticatedAdminRequest, res) => {
      const { name, department, url, portalHomeUrl, method, region, defaultAutoCategory } =
        req.body || {};

      if (typeof name !== 'string' || !name.trim() || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({ error: 'कृपया स्रोत का नाम और वैध आधिकारिक URL दर्ज करें।' });
        return;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url.trim());
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        res.status(400).json({ error: 'केवल वैध http/https सरकारी URL ही अनुमत हैं।' });
        return;
      }

      const state = loadMonitorState();
      const duplicateUrl = state.sources.some(
        (s) => s.url.trim().toLowerCase() === parsedUrl.toString().toLowerCase()
      );
      if (duplicateUrl) {
        res.status(409).json({ error: 'यह आधिकारिक स्रोत URL पहले से मॉनिटर सूची में मौजूद है।' });
        return;
      }

      const now = new Date().toISOString();
      const validMethod: SourceMonitorMethod = [
        'auto',
        'rss',
        'sitemap',
        'api',
        'html',
        'pdf'
      ].includes(method)
        ? method
        : 'auto';
      const validRegion: 'MP' | 'Central' | 'State' = ['MP', 'Central', 'State'].includes(region)
        ? region
        : 'MP';

      const newSource: GovernmentSourceRecord = {
        id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim().slice(0, 140),
        department:
          (typeof department === 'string' && department.trim()) || name.trim().slice(0, 180),
        url: parsedUrl.toString(),
        alternateUrl: '',
        portalHomeUrl:
          typeof portalHomeUrl === 'string' && portalHomeUrl.trim()
            ? portalHomeUrl.trim()
            : parsedUrl.origin,
        method: validMethod,
        region: validRegion,
        defaultAutoCategory:
          (defaultAutoCategory as AutoNotificationCategory) || 'Important Notices',
        enabled: true,
        isDefault: false,
        connectionStatus: 'pending',
        failureReason: 'NONE',
        statusMessage: 'कनेक्शन परीक्षण चल रहा है...',
        lastErrorDetail: '',
        lastCheckedAt: '',
        lastSuccessfulCheckAt: '',
        lastHttpStatus: 0,
        lastLatencyMs: 0,
        retryCount: 0,
        itemsDetectedLastRun: 0,
        robotsAllowed: true,
        manualNotes: '',
        createdAt: now,
        updatedAt: now
      };

      state.sources.unshift(newSource);
      saveMonitorState(state);

      // Immediately probe the newly added source so admin gets real status right away
      const updatedState = await runMonitorCycle('manual', newSource.id);
      const savedSource = updatedState.sources.find((s) => s.id === newSource.id) || newSource;

      res.status(201).json({
        ok: true,
        source: savedSource,
        summary: buildSummary(updatedState),
        sources: updatedState.sources,
        detected: updatedState.detected,
        logs: updatedState.logs
      });
    }
  );

  // Admin: Toggle or update source
  app.patch('/api/monitor/sources/:id', requireAuthorizedAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const state = loadMonitorState();
    const idx = state.sources.findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'सरकारी स्रोत नहीं मिला।' });
      return;
    }

    const current = state.sources[idx];
    const updates = req.body || {};

    if (typeof updates.url === 'string' && updates.url.trim()) {
      try {
        const u = new URL(updates.url.trim());
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          current.url = u.toString();
        }
      } catch {
        res.status(400).json({ error: 'अमान्य URL प्रारूप।' });
        return;
      }
    }

    if (typeof updates.alternateUrl === 'string') {
      const alt = updates.alternateUrl.trim();
      if (!alt) {
        current.alternateUrl = '';
      } else {
        try {
          const u = new URL(alt);
          if (u.protocol === 'http:' || u.protocol === 'https:') {
            current.alternateUrl = u.toString();
          }
        } catch {
          res.status(400).json({ error: 'अमान्य वैकल्पिक URL प्रारूप।' });
          return;
        }
      }
    }

    if (typeof updates.enabled === 'boolean') current.enabled = updates.enabled;
    if (typeof updates.name === 'string' && updates.name.trim()) {
      current.name = updates.name.trim().slice(0, 140);
    }
    if (typeof updates.department === 'string' && updates.department.trim()) {
      current.department = updates.department.trim().slice(0, 180);
    }
    if (typeof updates.manualNotes === 'string') {
      current.manualNotes = updates.manualNotes.trim().slice(0, 500);
    }
    if (['auto', 'rss', 'sitemap', 'api', 'html', 'pdf'].includes(updates.method)) {
      current.method = updates.method;
    }
    current.updatedAt = new Date().toISOString();

    state.sources[idx] = current;
    saveMonitorState(state);

    res.json({
      ok: true,
      source: current,
      summary: buildSummary(state),
      sources: state.sources
    });
  });

  // Admin: Delete a source
  app.delete('/api/monitor/sources/:id', requireAuthorizedAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const state = loadMonitorState();
    const before = state.sources.length;
    state.sources = state.sources.filter((s) => s.id !== id);
    if (state.sources.length === before) {
      res.status(404).json({ error: 'स्रोत नहीं मिला।' });
      return;
    }
    saveMonitorState(state);
    res.json({
      ok: true,
      summary: buildSummary(state),
      sources: state.sources
    });
  });

  // Admin: Legacy test endpoint (alias to full check of one source)
  app.post('/api/monitor/sources/:id/test', requireAuthorizedAdmin, async (req, res) => {
    const id = String(req.params.id || '');
    const state = loadMonitorState();
    if (!state.sources.some((s) => s.id === id)) {
      res.status(404).json({ error: 'स्रोत नहीं मिला।' });
      return;
    }
    const updated = await runMonitorCycle('manual', id);
    res.json({
      ok: true,
      source: updated.sources.find((s) => s.id === id),
      summary: buildSummary(updated),
      sources: updated.sources,
      detected: updated.detected,
      logs: updated.logs
    });
  });

  // Admin: Test Connection Only (HTTP status, robots.txt, retry diagnostics, lastSuccessfulCheckAt)
  app.post('/api/monitor/sources/:id/test-connection', requireAuthorizedAdmin, async (req, res) => {
    try {
      const id = String(req.params.id || '');
      const { state, source, outcome } = await testSourceConnectionOnly(id);
      res.json({
        ok: true,
        source,
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
          errorDetail: outcome.errorDetail,
          readableItemsCount: outcome.items.length
        },
        summary: buildSummary(state),
        sources: state.sources,
        logs: state.logs
      });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'स्रोत कनेक्शन परीक्षण विफल रहा।'
      });
    }
  });

  // Admin: Test Data Extraction (extracts items, deduplicates, queues new items into Pending Approval, returns preview)
  app.post('/api/monitor/sources/:id/test-extraction', requireAuthorizedAdmin, async (req, res) => {
    try {
      const id = String(req.params.id || '');
      const { state, extraction } = await testSourceDataExtraction(id);
      res.json({
        ok: true,
        extraction,
        summary: buildSummary(state),
        sources: state.sources,
        detected: state.detected,
        logs: state.logs
      });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'डेटा निष्कर्षण परीक्षण विफल रहा।'
      });
    }
  });

  // Admin: Manual Notice Intake for WAF/Geo-fenced portals (queues cleanly into Pending Approval with duplicate check)
  app.post('/api/monitor/manual-notice', requireAuthorizedAdmin, (req, res) => {
    const { sourceId, title, description, officialSourceUrl, pdfUrl, lastDate, publishedDate } =
      req.body || {};

    if (
      typeof sourceId !== 'string' ||
      typeof title !== 'string' ||
      !title.trim() ||
      typeof officialSourceUrl !== 'string' ||
      !officialSourceUrl.trim()
    ) {
      res.status(400).json({ error: 'कृपया शीर्षक और आधिकारिक स्रोत URL दर्ज करें।' });
      return;
    }

    let validOfficialUrl: string;
    try {
      const u = new URL(officialSourceUrl.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Invalid protocol');
      validOfficialUrl = u.toString();
    } catch {
      res.status(400).json({ error: 'कृपया वैध https/http सरकारी URL दर्ज करें।' });
      return;
    }

    const state = loadMonitorState();
    const source = state.sources.find((s) => s.id === sourceId);
    if (!source) {
      res.status(404).json({ error: 'चयनित सरकारी स्रोत नहीं मिला।' });
      return;
    }

    const cleanTitle = title.trim().slice(0, 380);
    const cleanDesc =
      (typeof description === 'string' && description.trim().slice(0, 1800)) || cleanTitle;
    const fp = computeNotificationFingerprint(validOfficialUrl, cleanTitle);
    const isDuplicate =
      state.detected.some((d) => d.fingerprint === fp) ||
      state.approved.some((a) => a.fingerprint === fp);

    if (isDuplicate) {
      state.totalDuplicatesSkipped += 1;
      saveMonitorState(state);
      res.status(409).json({
        error: 'यह सूचना पहले से सिस्टम में मौजूद है (Duplicate Notification रोक दी गई)।'
      });
      return;
    }

    const now = new Date().toISOString();
    const classified = classifyNotification(
      cleanTitle,
      cleanDesc,
      source.region,
      source.defaultAutoCategory
    );
    const combinedText = `${cleanTitle} ${cleanDesc}`;
    const cleanPdf =
      typeof pdfUrl === 'string' && pdfUrl.trim()
        ? pdfUrl.trim()
        : validOfficialUrl.toLowerCase().includes('.pdf')
          ? validOfficialUrl
          : '';

    const record: DetectedNotificationRecord = {
      id: `det_${fp.slice(0, 16)}`,
      fingerprint: fp,
      sourceId: source.id,
      sourceName: source.name,
      department: source.department,
      title: cleanTitle,
      description: cleanDesc,
      autoCategory: classified.autoCategory,
      websiteCategory: classified.websiteCategory,
      publishedDate:
        (typeof publishedDate === 'string' && publishedDate.trim()) ||
        extractPublishedDate('', combinedText, validOfficialUrl),
      lastDate:
        (typeof lastDate === 'string' && lastDate.trim()) || extractLastDate(combinedText),
      notificationNumber: extractNotificationNumber(combinedText),
      officialSourceUrl: validOfficialUrl,
      pdfUrl: cleanPdf,
      applyOnlineUrl: '',
      status: 'pending',
      detectedAt: now
    };

    state.detected.unshift(record);
    state.detected = state.detected.slice(0, 400);
    state.logs.unshift({
      id: `log_man_${Date.now()}`,
      runType: 'manual',
      sourceId: source.id,
      sourceName: source.name,
      status: 'info',
      message: `मैनुअल स्रोत प्रविष्टि "${cleanTitle.slice(0, 70)}" Pending Approval कतार में जोड़ी गई।`,
      newCount: 1,
      duplicateCount: 0,
      failedCount: 0,
      checkedAt: now
    });
    state.logs = state.logs.slice(0, 250);
    saveMonitorState(state);

    res.status(201).json({
      ok: true,
      detectedRecord: record,
      summary: buildSummary(state),
      sources: state.sources,
      detected: state.detected,
      logs: state.logs
    });
  });

  // Admin: Approve & mark notification published (also paired with Firestore write on client)
  app.post(
    '/api/monitor/notifications/:id/approve',
    requireAuthorizedAdmin,
    (req: AuthenticatedAdminRequest, res) => {
      const id = String(req.params.id || '');
      const state = loadMonitorState();
      const idx = state.detected.findIndex((d) => d.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'सूचना नहीं मिली।' });
        return;
      }

      const item = state.detected[idx];
      const edits = req.body || {};
      const now = new Date().toISOString();

      const updatedTitle =
        typeof edits.title === 'string' && edits.title.trim()
          ? edits.title.trim().slice(0, 380)
          : item.title;
      const updatedDesc =
        typeof edits.description === 'string'
          ? edits.description.trim().slice(0, 1900)
          : item.description;
      const updatedAutoCategory: AutoNotificationCategory =
        edits.autoCategory || item.autoCategory;
      const updatedWebsiteCategory =
        edits.websiteCategory ||
        mapAutoCategoryToWebsiteCategory(updatedAutoCategory, 'MP');
      const updatedOfficialUrl =
        typeof edits.officialSourceUrl === 'string' && edits.officialSourceUrl.trim()
          ? edits.officialSourceUrl.trim()
          : item.officialSourceUrl;
      const updatedPdfUrl =
        typeof edits.pdfUrl === 'string' ? edits.pdfUrl.trim() : item.pdfUrl;
      const updatedApplyUrl =
        typeof edits.applyOnlineUrl === 'string'
          ? edits.applyOnlineUrl.trim()
          : item.applyOnlineUrl;
      const updatedLastDate =
        typeof edits.lastDate === 'string' ? edits.lastDate.trim() : item.lastDate;
      const linkedPostId =
        typeof edits.linkedPostId === 'string' ? edits.linkedPostId.trim() : item.publishedPostId || '';

      state.detected[idx] = {
        ...item,
        title: updatedTitle,
        description: updatedDesc,
        autoCategory: updatedAutoCategory,
        websiteCategory: updatedWebsiteCategory,
        officialSourceUrl: updatedOfficialUrl,
        pdfUrl: updatedPdfUrl,
        applyOnlineUrl: updatedApplyUrl,
        lastDate: updatedLastDate,
        status: 'approved',
        reviewedAt: now,
        reviewedBy: req.adminEmail || 'nareshkumarbaiga260@gmail.com',
        publishedPostId: linkedPostId
      };

      const approvedRecord: ApprovedNotificationRecord = {
        id: `app_${item.id.replace(/^det_/, '')}`,
        detectedId: item.id,
        fingerprint: item.fingerprint,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        department: item.department,
        title: updatedTitle,
        description: updatedDesc,
        autoCategory: updatedAutoCategory,
        websiteCategory: updatedWebsiteCategory,
        publishedDate: item.publishedDate,
        lastDate: updatedLastDate,
        notificationNumber: item.notificationNumber,
        officialSourceUrl: updatedOfficialUrl,
        pdfUrl: updatedPdfUrl,
        applyOnlineUrl: updatedApplyUrl,
        approvedBy: req.adminEmail || 'nareshkumarbaiga260@gmail.com',
        approvedAt: now,
        linkedPostId
      };

      state.approved = [
        approvedRecord,
        ...state.approved.filter((a) => a.fingerprint !== approvedRecord.fingerprint)
      ].slice(0, 200);

      saveMonitorState(state);

      res.json({
        ok: true,
        approvedItem: approvedRecord,
        summary: buildSummary(state),
        detected: state.detected,
        approved: state.approved
      });
    }
  );

  // Admin: Reject notification (irrelevant or duplicate)
  app.post(
    '/api/monitor/notifications/:id/reject',
    requireAuthorizedAdmin,
    (req: AuthenticatedAdminRequest, res) => {
      const id = String(req.params.id || '');
      const state = loadMonitorState();
      const idx = state.detected.findIndex((d) => d.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'सूचना नहीं मिली।' });
        return;
      }

      state.detected[idx] = {
        ...state.detected[idx],
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.adminEmail || 'nareshkumarbaiga260@gmail.com'
      };
      saveMonitorState(state);

      res.json({
        ok: true,
        summary: buildSummary(state),
        detected: state.detected
      });
    }
  );

  // Admin: Update alert settings
  app.patch('/api/monitor/settings', requireAuthorizedAdmin, (req, res) => {
    const state = loadMonitorState();
    if (typeof req.body?.emailAlertsEnabled === 'boolean') {
      state.emailAlertsEnabled = req.body.emailAlertsEnabled;
      saveMonitorState(state);
    }
    res.json({
      ok: true,
      summary: buildSummary(state)
    });
  });

  // Admin: Send test email alert
  app.post('/api/monitor/test-email', requireAuthorizedAdmin, async (_req, res) => {
    const state = loadMonitorState();
    const result = await sendAdminSummaryEmail([], true);
    state.logs.unshift({
      id: `log_test_email_${Date.now()}`,
      runType: 'alert',
      sourceName: 'Admin Email Alert',
      status: result.sent ? 'connected' : 'info',
      message: result.message,
      newCount: 0,
      duplicateCount: 0,
      failedCount: result.sent ? 0 : 1,
      checkedAt: new Date().toISOString()
    });
    state.logs = state.logs.slice(0, 250);
    saveMonitorState(state);
    res.json({
      ok: result.sent,
      message: result.message,
      logs: state.logs
    });
  });

  // Mount Vite middleware in dev OR serve built SPA from dist/ in production
  const distPath = path.resolve(process.cwd(), 'dist');
  const useProdStatic = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (useProdStatic) {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MP SARKARI UPDATE server listening on http://0.0.0.0:${PORT}`);

    // Real backend 30-minute scheduler
    const initialState = loadMonitorState();
    const intervalMs = initialState.intervalMinutes * 60 * 1000;

    setInterval(() => {
      runMonitorCycle('scheduled').catch((err) => {
        console.error('Scheduled monitor run error:', err);
      });
    }, intervalMs);

    // Run initial baseline check shortly after startup if stale (> 25 mins) or never run
    const lastMs = initialState.lastRunAt ? new Date(initialState.lastRunAt).getTime() : 0;
    if (!lastMs || Date.now() - lastMs > 25 * 60 * 1000) {
      setTimeout(() => {
        runMonitorCycle('scheduled').catch((err) => {
          console.error('Initial startup monitor run error:', err);
        });
      }, 3500);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start MP SARKARI UPDATE server:', err);
  process.exit(1);
});
