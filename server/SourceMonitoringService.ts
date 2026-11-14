import {
  parseAtomFeed,
  parseHtmlNoticePage,
  parseJsonApiResponse,
  parsePdfDocumentResponse,
  parseRssFeed,
  parseSitemapXml,
  type ParsedCandidateItem
} from './parsers.ts';
import type {
  GovernmentSourceRecord,
  SourceConnectionStatus,
  SourceFailureReason
} from './types.ts';

const CLEAN_FETCH_HEADERS = {
  'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
};

export interface SourceMonitorProfile {
  sourceId: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  acceptHeader?: string;
  problemSummaryHindi: string;
}

export interface SourceProbeResult {
  connectionStatus: SourceConnectionStatus;
  failureReason: SourceFailureReason;
  statusMessage: string;
  errorDetail: string;
  httpStatus: number;
  latencyMs: number;
  retryCount: number;
  robotsAllowed: boolean;
  resolvedUrl: string;
  contentType: string;
  items: ParsedCandidateItem[];
}

/**
 * Per-source backend monitoring policy (timeouts, retries, headers, and root-cause hints)
 * for all 14 configured Indian government portals.
 */
export const SOURCE_MONITOR_PROFILES: Record<string, SourceMonitorProfile> = {
  src_mpesb: {
    sourceId: 'src_mpesb',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'MPESB सर्वर (esb.mp.gov.in) भारतीय राज्य डेटा सेंटर (SDC) फ़ायरवॉल के कारण बाहरी क्लाउड नेटवर्क पर टाइमआउट कर रहा है — मैनुअल कॉन्फ़िगरेशन या भारतीय प्रॉक्सी/रिले आवश्यक।'
  },
  src_mppsc: {
    sourceId: 'src_mppsc',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'MPPSC पोर्टल (mppsc.mp.gov.in) बाहरी सर्वर अनुरोधों पर TCP टाइमआउट दे रहा है — मैनुअल RSS/नोटिस प्रविष्टि विकल्प उपलब्ध।'
  },
  src_mp_info: {
    sourceId: 'src_mp_info',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'MP जनसंपर्क (mpinfo.org) बाहरी नेटवर्क से कनेक्ट टाइमआउट कर रहा है — मैनुअल कॉन्फ़िगरेशन या MP MyGov RSS का उपयोग करें।'
  },
  src_mp_rojgar: {
    sourceId: 'src_mp_rojgar',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'MP रोजगार पोर्टल (mprojgar.gov.in) भारतीय क्षेत्रीय IP प्रतिबंध के कारण टाइमआउट हो रहा है — मैनुअल कॉन्फ़िगरेशन आवश्यक।'
  },
  src_mp_state_portal: {
    sourceId: 'src_mp_state_portal',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'MP राज्य शासन पोर्टल (mp.gov.in) बाहरी क्लाउड IP से टाइमआउट हो रहा है — MP MyGov RSS सक्रिय है या मैनुअल कॉन्फ़िगरेशन करें।'
  },
  src_ssc: {
    sourceId: 'src_ssc',
    timeoutMs: 9000,
    maxRetries: 2,
    retryDelayMs: 500,
    acceptHeader: 'application/json, text/plain, */*',
    problemSummaryHindi:
      'SSC मुख्य पेज Angular JavaScript SPA है; इसके स्थान पर SSC की अधिकृत सार्वजनिक Notice-Boards JSON API से लाइव डेटा व PDF निकाले जा रहे हैं।'
  },
  src_upsc: {
    sourceId: 'src_upsc',
    timeoutMs: 9000,
    maxRetries: 2,
    retryDelayMs: 500,
    problemSummaryHindi:
      'upsc.gov.in/rss.xml टाइमआउट होता है; www.upsc.gov.in/whats-new (आधिकारिक CDN पेज) से लाइव अधिसूचनाएँ पढ़ी जा रही हैं।'
  },
  src_rrb_bhopal: {
    sourceId: 'src_rrb_bhopal',
    timeoutMs: 8500,
    maxRetries: 2,
    retryDelayMs: 600,
    problemSummaryHindi:
      'rrbbhopal.gov.in DNS/नेटवर्क स्तर (EAI_AGAIN) पर विफल है। मैनुअल कॉन्फ़िगरेशन से वैकल्पिक आधिकारिक रेलवे RRC पश्चिम रेलवे (rrc-wr.com) PDF स्रोत जोड़ा जा सकता है।'
  },
  src_pib_central: {
    sourceId: 'src_pib_central',
    timeoutMs: 9000,
    maxRetries: 1,
    retryDelayMs: 500,
    acceptHeader: 'application/rss+xml, application/xml, text/xml, */*',
    problemSummaryHindi:
      'pib.gov.in/allRel.aspx पर WAF सुरक्षा प्रतिबंध लागू है (कोई बाईपास नहीं किया जाता); इसके बजाय PIB की अधिकृत सार्वजनिक RSS XML फ़ीड (www.pib.gov.in/RssMain.aspx) का उपयोग किया गया है।'
  }
};

const robotsCache = new Map<string, { disallowPaths: string[]; fetchedAt: number }>();

function parseRobotsDisallow(robotsTxt: string): string[] {
  const lines = robotsTxt.split(/\r?\n/);
  const disallowed: string[] = [];
  let inRelevantBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const uaMatch = line.match(/^User-agent:\s*(.+)$/i);
    if (uaMatch) {
      const agent = uaMatch[1].trim().toLowerCase();
      inRelevantBlock = agent === '*' || agent.includes('mpsarkariupdatemonitor');
      continue;
    }
    if (inRelevantBlock) {
      const disallowMatch = line.match(/^Disallow:\s*(.*)$/i);
      if (disallowMatch) {
        const pathRule = disallowMatch[1].trim();
        if (pathRule) disallowed.push(pathRule);
      }
    }
  }
  return disallowed;
}

function classifyNetworkFailure(err: unknown): {
  failureReason: SourceFailureReason;
  errorDetail: string;
} {
  const errObj = err as Error & { cause?: { code?: string; message?: string } };
  const code = errObj?.cause?.code || '';
  const msg = errObj?.message || String(err);
  const combined = `${msg} ${code}`.trim();

  if (
    /timeout|aborted|UND_ERR_CONNECT_TIMEOUT|ETIMEDOUT|TimeoutError/i.test(combined)
  ) {
    return {
      failureReason: 'TIMEOUT',
      errorDetail: `Connection Timeout (${code || msg})`
    };
  }
  if (/EAI_AGAIN|ENOTFOUND|DNS/i.test(combined)) {
    return {
      failureReason: 'DNS_FAILED',
      errorDetail: `DNS/Host Resolution Failed (${code || msg})`
    };
  }
  if (/CERT_|TLS|SSL|UNABLE_TO_VERIFY/i.test(combined)) {
    return {
      failureReason: 'TLS_ERROR',
      errorDetail: `TLS/SSL Certificate Validation Error (${code || msg})`
    };
  }
  return {
    failureReason: 'TIMEOUT',
    errorDetail: `Network Fetch Error (${combined})`
  };
}

function isRetryableNetworkError(failureReason: SourceFailureReason): boolean {
  return failureReason === 'TIMEOUT' || failureReason === 'DNS_FAILED';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SourceMonitoringService {
  async checkRobotsTxt(targetUrl: string): Promise<{ allowed: boolean; reason: string }> {
    try {
      const u = new URL(targetUrl);
      const origin = u.origin;
      const cached = robotsCache.get(origin);
      let disallowPaths: string[] = [];

      if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
        disallowPaths = cached.disallowPaths;
      } else {
        try {
          const res = await fetch(`${origin}/robots.txt`, {
            headers: CLEAN_FETCH_HEADERS,
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) {
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const body = await res.text();
            if (ct.includes('text/plain') || /^\s*user-agent:/im.test(body)) {
              disallowPaths = parseRobotsDisallow(body);
            }
          }
        } catch {
          disallowPaths = [];
        }
        robotsCache.set(origin, { disallowPaths, fetchedAt: Date.now() });
      }

      const reqPath = u.pathname + u.search;
      for (const rule of disallowPaths) {
        if (rule === '/') {
          return {
            allowed: false,
            reason: `robots.txt द्वारा संपूर्ण डोमेन (${origin}) पर स्वचालित क्रॉलिंग प्रतिबंधित (Disallow: /) है।`
          };
        }
        if (reqPath.startsWith(rule)) {
          return {
            allowed: false,
            reason: `robots.txt नियम "Disallow: ${rule}" के कारण इस URL की स्वचालित जाँच छोड़ी गई।`
          };
        }
      }
      return { allowed: true, reason: 'Permitted by robots.txt' };
    } catch {
      return { allowed: true, reason: 'Robots check skipped' };
    }
  }

  private async fetchWithRetry(
    url: string,
    profile: SourceMonitorProfile
  ): Promise<
    | { ok: true; response: Response; retriesUsed: number }
    | {
        ok: false;
        failureReason: SourceFailureReason;
        errorDetail: string;
        httpStatus: number;
        retriesUsed: number;
      }
  > {
    const attempts = Math.max(1, profile.maxRetries + 1);
    let lastReason: SourceFailureReason = 'TIMEOUT';
    let lastDetail = '';
    let lastHttpStatus = 0;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const attemptTimeoutMs = profile.timeoutMs + attempt * 2000;
      try {
        const res = await fetch(url, {
          headers: {
            Accept:
              profile.acceptHeader ||
              'application/rss+xml, application/atom+xml, application/xml, application/json, application/pdf, text/html, */*',
            ...CLEAN_FETCH_HEADERS
          },
          signal: AbortSignal.timeout(attemptTimeoutMs)
        });

        // Never retry WAF/permission blocks (403/401) or missing resources (404)
        if (res.status === 403 || res.status === 401) {
          return {
            ok: false,
            failureReason: 'WAF_FORBIDDEN_403',
            errorDetail: `HTTP ${res.status} Forbidden / WAF Access Policy`,
            httpStatus: res.status,
            retriesUsed: attempt
          };
        }

        if (res.status >= 502 && res.status <= 504 && attempt < attempts - 1) {
          lastHttpStatus = res.status;
          lastReason = 'HTTP_ERROR';
          lastDetail = `HTTP ${res.status} Gateway/Upstream Timeout`;
          await delay(profile.retryDelayMs * (attempt + 1));
          continue;
        }

        return { ok: true, response: res, retriesUsed: attempt };
      } catch (err) {
        const classified = classifyNetworkFailure(err);
        lastReason = classified.failureReason;
        lastDetail = classified.errorDetail;
        lastHttpStatus = 0;

        if (!isRetryableNetworkError(classified.failureReason) || attempt >= attempts - 1) {
          return {
            ok: false,
            failureReason: lastReason,
            errorDetail: lastDetail,
            httpStatus: lastHttpStatus,
            retriesUsed: attempt
          };
        }
        await delay(profile.retryDelayMs * (attempt + 1));
      }
    }

    return {
      ok: false,
      failureReason: lastReason,
      errorDetail: lastDetail || 'Max retry attempts exhausted',
      httpStatus: lastHttpStatus,
      retriesUsed: attempts - 1
    };
  }

  private async tryEndpointAndParse(
    source: GovernmentSourceRecord,
    targetUrl: string,
    profile: SourceMonitorProfile
  ): Promise<SourceProbeResult> {
    const startMs = Date.now();
    const robots = await this.checkRobotsTxt(targetUrl);
    if (!robots.allowed) {
      return {
        connectionStatus: 'blocked_by_robots',
        failureReason: 'ROBOTS_DISALLOWED',
        statusMessage: robots.reason,
        errorDetail: robots.reason,
        httpStatus: 0,
        latencyMs: Date.now() - startMs,
        retryCount: 0,
        robotsAllowed: false,
        resolvedUrl: targetUrl,
        contentType: '',
        items: []
      };
    }

    const fetchResult = await this.fetchWithRetry(targetUrl, profile);
    const latencyMs = Date.now() - startMs;

    if (!fetchResult.ok) {
      if (fetchResult.failureReason === 'WAF_FORBIDDEN_403') {
        return {
          connectionStatus: 'manual_config_needed',
          failureReason: 'WAF_FORBIDDEN_403',
          statusMessage: `HTTP ${fetchResult.httpStatus} WAF/सुरक्षा प्रतिबंध — बाईपास नहीं किया जाएगा। कृपया अधिकृत RSS/API URL या मैनुअल कॉन्फ़िगरेशन का उपयोग करें।`,
          errorDetail: fetchResult.errorDetail,
          httpStatus: fetchResult.httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: '',
          items: []
        };
      }

      if (fetchResult.failureReason === 'TIMEOUT') {
        return {
          connectionStatus: 'manual_config_needed',
          failureReason: 'TIMEOUT',
          statusMessage: `${fetchResult.retriesUsed + 1} प्रयासों के बाद कनेक्शन टाइमआउट (${profile.problemSummaryHindi || 'क्षेत्रीय IP या धीमा सरकारी सर्वर'})। मैनुअल कॉन्फ़िगरेशन उपलब्ध है।`,
          errorDetail: fetchResult.errorDetail,
          httpStatus: fetchResult.httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: '',
          items: []
        };
      }

      if (fetchResult.failureReason === 'DNS_FAILED') {
        return {
          connectionStatus: 'manual_config_needed',
          failureReason: 'DNS_FAILED',
          statusMessage: `डोमेन DNS रिज़ॉल्व नहीं हो सका (${fetchResult.errorDetail}) — मैनुअल कॉन्फ़िगरेशन से वैकल्पिक आधिकारिक URL सेट करें।`,
          errorDetail: fetchResult.errorDetail,
          httpStatus: 0,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: '',
          items: []
        };
      }

      return {
        connectionStatus: 'failed',
        failureReason: fetchResult.failureReason,
        statusMessage: `कनेक्शन विफल: ${fetchResult.errorDetail}`,
        errorDetail: fetchResult.errorDetail,
        httpStatus: fetchResult.httpStatus,
        latencyMs,
        retryCount: fetchResult.retriesUsed,
        robotsAllowed: true,
        resolvedUrl: targetUrl,
        contentType: '',
        items: []
      };
    }

    const res = fetchResult.response;
    const httpStatus = res.status;
    const ct = (res.headers.get('content-type') || '').toLowerCase();

    if (!res.ok) {
      return {
        connectionStatus: 'failed',
        failureReason: 'HTTP_ERROR',
        statusMessage: `HTTP ${httpStatus} त्रुटि प्राप्त हुई (${res.statusText || 'Error'})।`,
        errorDetail: `HTTP ${httpStatus} ${res.statusText || ''}`.trim(),
        httpStatus,
        latencyMs,
        retryCount: fetchResult.retriesUsed,
        robotsAllowed: true,
        resolvedUrl: targetUrl,
        contentType: ct,
        items: []
      };
    }

    // 1. Direct PDF Parser
    if (
      ct.includes('application/pdf') ||
      source.method === 'pdf' ||
      targetUrl.toLowerCase().split('?')[0].endsWith('.pdf')
    ) {
      const buf = await res.arrayBuffer();
      const items = parsePdfDocumentResponse(res.headers, buf, targetUrl, source.name);
      if (items.length > 0) {
        return {
          connectionStatus: 'connected',
          failureReason: 'NONE',
          statusMessage: `आधिकारिक PDF दस्तावेज़ सफलतापूर्वक पढ़ा गया (HTTP ${httpStatus})।`,
          errorDetail: '',
          httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: ct,
          items
        };
      }
      return {
        connectionStatus: 'manual_config_needed',
        failureReason: 'PARSE_EMPTY',
        statusMessage: 'PDF डेटा मान्य %PDF हेडर के रूप में नहीं मिला; कृपया सही आधिकारिक लिंक जांचें।',
        errorDetail: 'Invalid or non-PDF payload',
        httpStatus,
        latencyMs,
        retryCount: fetchResult.retriesUsed,
        robotsAllowed: true,
        resolvedUrl: targetUrl,
        contentType: ct,
        items: []
      };
    }

    const rawBody = await res.text();

    // 2. JSON API Parser (e.g., SSC official notice-boards API)
    if (
      ct.includes('application/json') ||
      source.method === 'api' ||
      rawBody.trimStart().startsWith('{') ||
      rawBody.trimStart().startsWith('[')
    ) {
      try {
        const items = parseJsonApiResponse(rawBody, targetUrl, source.portalHomeUrl);
        if (items.length > 0) {
          return {
            connectionStatus: 'connected',
            failureReason: 'NONE',
            statusMessage: `अधिकृत JSON API सफलतापूर्वक कनेक्टेड (${items.length} सूचनाएँ पढ़ी गईं, HTTP ${httpStatus})।`,
            errorDetail: '',
            httpStatus,
            latencyMs,
            retryCount: fetchResult.retriesUsed,
            robotsAllowed: true,
            resolvedUrl: targetUrl,
            contentType: ct,
            items
          };
        }
        return {
          connectionStatus: 'manual_config_needed',
          failureReason: 'PARSE_EMPTY',
          statusMessage:
            'JSON API ने HTTP 200 दिया, पर कोई भी पठनीय सूचना आइटम नहीं मिला — मैनुअल फ़ील्ड/URL जांचें।',
          errorDetail: 'HTTP 200 JSON contained 0 extractable notification records',
          httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: ct,
          items: []
        };
      } catch (err) {
        if (source.method === 'api') {
          return {
            connectionStatus: 'manual_config_needed',
            failureReason: 'PARSE_EMPTY',
            statusMessage: 'JSON पार्स करने में त्रुटि — पोर्टल ने HTML या अमान्य JSON भेजा।',
            errorDetail: err instanceof Error ? err.message : 'Invalid JSON',
            httpStatus,
            latencyMs,
            retryCount: fetchResult.retriesUsed,
            robotsAllowed: true,
            resolvedUrl: targetUrl,
            contentType: ct,
            items: []
          };
        }
      }
    }

    // 3. Dedicated RSS / Atom / XML Sitemap Parsers
    const trimmed = rawBody.trimStart();
    const looksXml =
      ct.includes('xml') ||
      ct.includes('rss') ||
      ct.includes('atom') ||
      trimmed.startsWith('<?xml') ||
      trimmed.includes('<rss') ||
      trimmed.includes('<feed') ||
      trimmed.includes('<urlset');

    if (looksXml) {
      let items: ParsedCandidateItem[] = [];
      let label = 'RSS XML';
      if (trimmed.includes('<feed') && trimmed.includes('<entry')) {
        items = parseAtomFeed(rawBody, targetUrl);
        label = 'Atom XML';
      } else if (trimmed.includes('<urlset')) {
        items = parseSitemapXml(rawBody, targetUrl);
        label = 'XML Sitemap';
      } else {
        items = parseRssFeed(rawBody, targetUrl);
        if (items.length === 0) items = parseAtomFeed(rawBody, targetUrl);
      }

      if (items.length > 0) {
        return {
          connectionStatus: 'connected',
          failureReason: 'NONE',
          statusMessage: `आधिकारिक ${label} फ़ीड कनेक्टेड (${items.length} सूचनाएँ पढ़ी गईं, HTTP ${httpStatus})।`,
          errorDetail: '',
          httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: ct,
          items
        };
      }

      // If strict RSS/sitemap returned 0 items and isn't HTML, mark manual config needed cleanly
      if (!ct.includes('html') && !trimmed.toLowerCase().includes('<html')) {
        return {
          connectionStatus: 'manual_config_needed',
          failureReason: 'PARSE_EMPTY',
          statusMessage: `फ़ीड HTTP ${httpStatus} पर खुली, पर इसमें कोई वैध सूचना आइटम उपलब्ध नहीं था।`,
          errorDetail: `${label} contained 0 valid notice items`,
          httpStatus,
          latencyMs,
          retryCount: fetchResult.retriesUsed,
          robotsAllowed: true,
          resolvedUrl: targetUrl,
          contentType: ct,
          items: []
        };
      }
    }

    // 4. Dedicated HTML Notice Board Parser
    const htmlParsed = parseHtmlNoticePage(rawBody, targetUrl);
    if (htmlParsed.looksLikeClientSpa) {
      return {
        connectionStatus: 'manual_config_needed',
        failureReason: 'SPA_JS_ONLY',
        statusMessage:
          'HTTP 200 मिला, लेकिन यह JavaScript आधारित वेबसाइट (SPA) है जहाँ स्थिर HTML/RSS नोटिस उपलब्ध नहीं हैं — कृपया अधिकृत API/RSS URL या मैनुअल कॉन्फ़िगरेशन का उपयोग करें।',
        errorDetail: 'HTTP 200 JavaScript-heavy SPA shell without static notice links',
        httpStatus,
        latencyMs,
        retryCount: fetchResult.retriesUsed,
        robotsAllowed: true,
        resolvedUrl: targetUrl,
        contentType: ct,
        items: []
      };
    }

    if (htmlParsed.items.length === 0) {
      return {
        connectionStatus: 'manual_config_needed',
        failureReason: 'PARSE_EMPTY',
        statusMessage:
          'वेबसाइट HTTP 200 पर उपलब्ध है, पर कोई पठनीय सरकारी नोटिस/PDF नहीं मिला (तभी Connected माना जाएगा जब वास्तविक डेटा पढ़ा जा सके)।',
        errorDetail: 'HTTP 200 HTML returned 0 readable notice items',
        httpStatus,
        latencyMs,
        retryCount: fetchResult.retriesUsed,
        robotsAllowed: true,
        resolvedUrl: targetUrl,
        contentType: ct,
        items: []
      };
    }

    return {
      connectionStatus: 'connected',
      failureReason: 'NONE',
      statusMessage: `आधिकारिक पोर्टल से ${htmlParsed.items.length} सूचनाएँ व PDF लिंक सफलतापूर्वक पढ़े गए (HTTP ${httpStatus})।`,
      errorDetail: '',
      httpStatus,
      latencyMs,
      retryCount: fetchResult.retriesUsed,
      robotsAllowed: true,
      resolvedUrl: targetUrl,
      contentType: ct,
      items: htmlParsed.items
    };
  }

  async probeAndExtractSource(source: GovernmentSourceRecord): Promise<SourceProbeResult> {
    const profile: SourceMonitorProfile = SOURCE_MONITOR_PROFILES[source.id] || {
      sourceId: source.id,
      timeoutMs: 9000,
      maxRetries: 2,
      retryDelayMs: 600,
      problemSummaryHindi: ''
    };

    const primaryOutcome = await this.tryEndpointAndParse(source, source.url, profile);

    // If primary succeeded with actual readable data, return immediately
    if (primaryOutcome.connectionStatus === 'connected') {
      return primaryOutcome;
    }

    // Never fall back if blocked by robots.txt
    if (primaryOutcome.connectionStatus === 'blocked_by_robots') {
      return primaryOutcome;
    }

    // If admin explicitly saved an alternateUrl, try it automatically when primary fails
    if (source.alternateUrl && source.alternateUrl.trim() && source.alternateUrl !== source.url) {
      const altOutcome = await this.tryEndpointAndParse(
        source,
        source.alternateUrl.trim(),
        profile
      );
      if (altOutcome.connectionStatus === 'connected') {
        return {
          ...altOutcome,
          statusMessage: `वैकल्पिक आधिकारिक URL से कनेक्टेड: ${altOutcome.statusMessage}`
        };
      }
    }

    return primaryOutcome;
  }
}

export const sourceMonitoringService = new SourceMonitoringService();
