import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

export interface ParsedCandidateItem {
  title: string;
  description: string;
  officialSourceUrl: string;
  pdfUrl: string;
  applyOnlineUrl: string;
  rawPubDate: string;
  sourceFormat: 'rss' | 'atom' | 'sitemap' | 'api' | 'html' | 'pdf';
}

export function cleanText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveAbsoluteUrl(href: string, baseUrl: string): string {
  try {
    const clean = href.trim().replace(/\\/g, '/');
    return new URL(clean, baseUrl).toString();
  } catch {
    return '';
  }
}

function getXmlNodeText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return cleanText(String(node));
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeof obj['#text'] === 'string' || typeof obj['#text'] === 'number') {
      return cleanText(String(obj['#text']));
    }
    if (typeof obj.__cdata === 'string') {
      return cleanText(obj.__cdata);
    }
  }
  return '';
}

/**
 * 1. Dedicated RSS 2.0 / RDF Feed Parser
 */
export function parseRssFeed(xmlText: string, baseUrl: string): ParsedCandidateItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true
  });
  const doc = parser.parse(xmlText) as Record<string, unknown>;
  const results: ParsedCandidateItem[] = [];

  const rss = doc.rss as { channel?: { item?: unknown } } | undefined;
  const rdf = doc['rdf:RDF'] as { item?: unknown } | undefined;
  const rawItems = rss?.channel?.item || rdf?.item;
  if (!rawItems) return results;

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  for (const raw of items.slice(0, 30)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const title = getXmlNodeText(item.title);
    const rawLink = getXmlNodeText(item.link) || getXmlNodeText(item.guid);
    const link = resolveAbsoluteUrl(rawLink, baseUrl);
    const desc =
      getXmlNodeText(item.description) ||
      getXmlNodeText(item['content:encoded']) ||
      title;
    const pubDate = getXmlNodeText(item.pubDate) || getXmlNodeText(item['dc:date']);

    const enclosure = item.enclosure as Record<string, unknown> | undefined;
    const enclosureUrl =
      enclosure && typeof enclosure['@_url'] === 'string'
        ? resolveAbsoluteUrl(enclosure['@_url'], baseUrl)
        : '';

    if (title && link) {
      const pdfUrl = enclosureUrl.toLowerCase().includes('.pdf')
        ? enclosureUrl
        : link.toLowerCase().includes('.pdf')
          ? link
          : '';
      results.push({
        title: title.slice(0, 380),
        description: (desc || title).slice(0, 1800),
        officialSourceUrl: link,
        pdfUrl,
        applyOnlineUrl: '',
        rawPubDate: pubDate,
        sourceFormat: 'rss'
      });
    }
  }
  return results;
}

/**
 * 2. Dedicated Atom 1.0 Feed Parser
 */
export function parseAtomFeed(xmlText: string, baseUrl: string): ParsedCandidateItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true
  });
  const doc = parser.parse(xmlText) as Record<string, unknown>;
  const results: ParsedCandidateItem[] = [];

  const feed = doc.feed as { entry?: unknown } | undefined;
  if (!feed?.entry) return results;

  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  for (const raw of entries.slice(0, 30)) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;
    const title = getXmlNodeText(entry.title);
    let linkHref = '';
    let pdfHref = '';

    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : [];
    for (const l of links) {
      if (typeof l === 'string') {
        if (!linkHref) linkHref = l;
      } else if (l && typeof l === 'object') {
        const lObj = l as Record<string, unknown>;
        const href = typeof lObj['@_href'] === 'string' ? lObj['@_href'] : '';
        const rel = typeof lObj['@_rel'] === 'string' ? lObj['@_rel'] : 'alternate';
        const type = typeof lObj['@_type'] === 'string' ? lObj['@_type'] : '';
        if (href && (type.includes('pdf') || href.toLowerCase().endsWith('.pdf'))) {
          pdfHref = resolveAbsoluteUrl(href, baseUrl);
        }
        if (href && (rel === 'alternate' || !linkHref)) {
          linkHref = resolveAbsoluteUrl(href, baseUrl);
        }
      }
    }

    const link = linkHref || resolveAbsoluteUrl(getXmlNodeText(entry.id), baseUrl);
    const desc = getXmlNodeText(entry.summary) || getXmlNodeText(entry.content) || title;
    const pubDate = getXmlNodeText(entry.published) || getXmlNodeText(entry.updated);

    if (title && link) {
      results.push({
        title: title.slice(0, 380),
        description: (desc || title).slice(0, 1800),
        officialSourceUrl: link,
        pdfUrl: pdfHref || (link.toLowerCase().includes('.pdf') ? link : ''),
        applyOnlineUrl: '',
        rawPubDate: pubDate,
        sourceFormat: 'atom'
      });
    }
  }
  return results;
}

/**
 * 3. Dedicated XML Sitemap Parser
 */
export function parseSitemapXml(xmlText: string, baseUrl: string): ParsedCandidateItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  const doc = parser.parse(xmlText) as Record<string, unknown>;
  const results: ParsedCandidateItem[] = [];

  const urlset = doc.urlset as { url?: unknown } | undefined;
  if (!urlset?.url) return results;

  const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
  for (const raw of urls) {
    if (results.length >= 25) break;
    if (!raw || typeof raw !== 'object') continue;
    const u = raw as Record<string, unknown>;
    const loc = getXmlNodeText(u.loc);
    const lastmod = getXmlNodeText(u.lastmod);
    if (!loc) continue;
    if (
      !/(notice|recruit|vacancy|result|admit|exam|order|circular|yojana|scheme|advt|\.pdf)/i.test(
        loc
      )
    ) {
      continue;
    }

    const slug = loc.split('/').filter(Boolean).pop() || loc;
    const derivedTitle = decodeURIComponent(slug)
      .replace(/\.pdf$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    if (derivedTitle.length >= 8) {
      const resolved = resolveAbsoluteUrl(loc, baseUrl);
      results.push({
        title: derivedTitle.slice(0, 380),
        description: derivedTitle.slice(0, 1800),
        officialSourceUrl: resolved,
        pdfUrl: resolved.toLowerCase().includes('.pdf') ? resolved : '',
        applyOnlineUrl: '',
        rawPubDate: lastmod,
        sourceFormat: 'sitemap'
      });
    }
  }

  return results;
}

/**
 * 4. Dedicated Official JSON API Parser (supports SSC API, WordPress REST API, and generic arrays)
 */
export function parseJsonApiResponse(
  rawBody: string,
  sourceUrl: string,
  portalHomeUrl: string
): ParsedCandidateItem[] {
  const jsonData = JSON.parse(rawBody) as unknown;
  const arr = Array.isArray(jsonData)
    ? jsonData
    : typeof jsonData === 'object' && jsonData !== null
      ? (Object.values(jsonData).find((v) => Array.isArray(v)) as unknown[]) || []
      : [];

  const origin = (() => {
    try {
      return new URL(sourceUrl).origin;
    } catch {
      return portalHomeUrl;
    }
  })();

  const items: ParsedCandidateItem[] = [];
  for (const row of arr.slice(0, 25)) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;

    // WordPress title.rendered or standard headline/title
    const wpTitle =
      r.title && typeof r.title === 'object'
        ? (r.title as Record<string, unknown>).rendered
        : r.title;
    const wpExcerpt =
      r.excerpt && typeof r.excerpt === 'object'
        ? (r.excerpt as Record<string, unknown>).rendered
        : r.description || r.summary;

    const title = cleanText(
      r.headline || wpTitle || r.examName || r.name || r.subject || r.hExamName
    );
    if (!title || title.length < 6) continue;

    // Resolve SSC attachment paths (`uploads\\masterData\\NoticeBoards\\...pdf` -> `https://ssc.gov.in/api/attachment/...`)
    let attachmentPdf = '';
    if (Array.isArray(r.attachments) && r.attachments.length > 0) {
      const firstAtt = r.attachments[0] as Record<string, unknown> | undefined;
      if (firstAtt && typeof firstAtt.path === 'string' && firstAtt.path.trim()) {
        const normalizedPath = firstAtt.path.replace(/\\/g, '/').replace(/^\/+/, '');
        if (origin.includes('ssc.gov.in')) {
          attachmentPdf = `${origin}/api/attachment/${normalizedPath}`;
        } else {
          attachmentPdf = resolveAbsoluteUrl(normalizedPath, origin);
        }
      }
    }

    const rawDirectUrl = cleanText(
      r.redirectUrl || r.url || r.link || r.pdfUrl || r.file || r.navigationUrl
    );
    const resolvedDirect = rawDirectUrl ? resolveAbsoluteUrl(rawDirectUrl, origin) : '';
    const officialUrl =
      attachmentPdf ||
      resolvedDirect ||
      portalHomeUrl ||
      origin;

    const pdfUrl =
      attachmentPdf ||
      (officialUrl.toLowerCase().includes('.pdf')
        ? officialUrl
        : cleanText(r.pdfUrl)
          ? resolveAbsoluteUrl(cleanText(r.pdfUrl), origin)
          : '');

    const desc = cleanText(wpExcerpt || r.contentType || title);
    const rawPubDate = cleanText(
      String(r.createdAt || r.pubDate || r.publishedAt || r.date || r.startDate || '')
    );

    items.push({
      title: title.slice(0, 380),
      description: (desc || title).slice(0, 1800),
      officialSourceUrl: officialUrl,
      pdfUrl,
      applyOnlineUrl:
        typeof r.navigationUrl === 'string' && r.navigationUrl.trim()
          ? resolveAbsoluteUrl(r.navigationUrl, origin)
          : cleanText(r.applyUrl || r.applyOnlineUrl),
      rawPubDate,
      sourceFormat: 'api'
    });
  }

  return items;
}

const GENERIC_ANCHOR_TEXT =
  /^(read\s*more|view|view\s*more|download|click\s*here|details|more|pdf|link|open|ये\s*देखें|यहाँ\s*क्लिक\s*करें|डाउनलोड)$/i;
const NAV_IGNORE_PATTERN =
  /^(home|about\s*us|contact\s*us|sitemap|accessibility|screen\s*reader|skip\s*to\s*main|privacy\s*policy|terms|copyright|feedback|faq|login|register|hindi|english|forthcoming\s*examinations|previous\s*question\s*papers|revised\s*syllabus\s*and\s*scheme)$/i;

/**
 * 5. Dedicated HTML Notice Board, Table & CMS (Drupal / NIC) Parser
 */
export function parseHtmlNoticePage(
  html: string,
  baseUrl: string
): {
  items: ParsedCandidateItem[];
  looksLikeClientSpa: boolean;
} {
  const $ = cheerio.load(html);
  const bodyText = cleanText($('body').text());
  const isSpaShell =
    html.includes('app-root') ||
    html.includes('data-critters-container') ||
    html.includes('__NEXT_DATA__') ||
    (bodyText.length < 350 && /<script/i.test(html));

  const seenUrls = new Set<string>();
  const items: ParsedCandidateItem[] = [];

  const relevantHrefOrText =
    /(notice|notification|recruit|vacancy|vacancies|result|admit|answer|key|exam|order|circular|scheme|yojana|advt|corrigendum|syllabus|scholarship|engagement|bharti|appointment|interview|time\s*table|\.pdf)/i;

  const normalizeDisplayTitle = (raw: string): string => {
    let t = cleanText(raw)
      .replace(/^\d{1,3}\s+(?=[A-Za-z\u0900-\u097F])/, '')
      .replace(/^Click\s*here\s*to\s*view\/downla?o?ad\s*/i, '')
      .replace(/\s+(?:Read\s*More|View\s*More|Click\s*Here|Download)\s*$/i, '')
      .trim();
    if (t.length >= 10 && t.length % 2 === 0) {
      const half = t.length / 2;
      if (t.slice(0, half).toLowerCase() === t.slice(half).toLowerCase()) {
        t = t.slice(0, half).trim();
      }
    }
    return t;
  };

  // Pass 1: Structured Drupal / CMS notice blocks (e.g., UPSC What's New `.view-content .views-row`)
  $('.view-content .views-row a[href], .notice-board a[href], .latest-news a[href]').each(
    (_, el) => {
      if (items.length >= 25) return;
      const anchor = $(el);
      const href = anchor.attr('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      const resolved = resolveAbsoluteUrl(href, baseUrl);
      if (!resolved || !resolved.startsWith('http') || seenUrls.has(resolved)) return;

      const titleText = normalizeDisplayTitle(anchor.text());
      if (titleText.length < 10 || NAV_IGNORE_PATTERN.test(titleText)) return;

      seenUrls.add(resolved);
      const isPdf = resolved.toLowerCase().includes('.pdf');
      items.push({
        title: titleText.slice(0, 380),
        description: titleText.slice(0, 1800),
        officialSourceUrl: resolved,
        pdfUrl: isPdf ? resolved : '',
        applyOnlineUrl:
          /apply|registration|form/i.test(`${titleText} ${resolved}`) && !isPdf ? resolved : '',
        rawPubDate: '',
        sourceFormat: 'html'
      });
    }
  );

  // Pass 2: Structured table rows (e.g., NTA NoticeBoardArchive, NIC notice tables)
  $('table tr').each((_, tr) => {
    if (items.length >= 25) return;
    const row = $(tr);
    const links = row.find('a[href]');
    if (links.length === 0) return;

    const firstLink = links.first();
    const href = firstLink.attr('href') || '';
    const resolved = resolveAbsoluteUrl(href, baseUrl);
    if (!resolved || !resolved.startsWith('http') || seenUrls.has(resolved)) return;

    const anchorText = cleanText(firstLink.text());
    const cellTexts: string[] = [];
    row.children('td, th').each((__, cell) => {
      const clone = $(cell).clone();
      clone.find('a').each((___, a) => {
        const at = cleanText($(a).text());
        if (GENERIC_ANCHOR_TEXT.test(at)) {
          $(a).remove();
        }
      });
      const txt = cleanText(clone.text());
      if (txt && !/^\d{1,3}$/.test(txt)) {
        cellTexts.push(txt);
      }
    });
    const rowCellsText = cleanText(cellTexts.join(' '));

    const candidateTitle = normalizeDisplayTitle(
      !anchorText || GENERIC_ANCHOR_TEXT.test(anchorText) ? rowCellsText : anchorText
    );

    if (candidateTitle.length < 10 || NAV_IGNORE_PATTERN.test(candidateTitle)) return;
    if (!relevantHrefOrText.test(`${candidateTitle} ${resolved}`)) return;

    seenUrls.add(resolved);
    const isPdf = resolved.toLowerCase().includes('.pdf');
    items.push({
      title: candidateTitle.slice(0, 380),
      description: (rowCellsText || candidateTitle).slice(0, 1800),
      officialSourceUrl: resolved,
      pdfUrl: isPdf ? resolved : '',
      applyOnlineUrl:
        /apply|registration|form/i.test(`${candidateTitle} ${resolved}`) && !isPdf ? resolved : '',
      rawPubDate: '',
      sourceFormat: 'html'
    });
  });

  // Pass 3: Main body links excluding top header/nav/footer clutter
  if (items.length < 10) {
    const scope = $('main, #main-content, #content, .main-content').length
      ? $('main, #main-content, #content, .main-content').find('a[href]')
      : $('body a[href]').not('header a, nav a, footer a, .menu a, .navbar a');

    scope.each((_, el) => {
      if (items.length >= 25) return;
      const anchor = $(el);
      if (anchor.closest('header, nav, footer, .menu, .navbar').length > 0) return;

      const href = anchor.attr('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }

      const resolved = resolveAbsoluteUrl(href, baseUrl);
      if (!resolved || !resolved.startsWith('http') || seenUrls.has(resolved)) return;

      let titleText = normalizeDisplayTitle(anchor.text());
      const parentText = cleanText(anchor.closest('li, div, p, article').text());

      if (!titleText || GENERIC_ANCHOR_TEXT.test(titleText)) {
        titleText = normalizeDisplayTitle(parentText.replace(cleanText(anchor.text()), ''));
      }

      if (titleText.length < 12 || titleText.length > 350 || NAV_IGNORE_PATTERN.test(titleText)) {
        return;
      }

      const isPdf = resolved.toLowerCase().endsWith('.pdf');
      if (!isPdf && !relevantHrefOrText.test(`${titleText} ${resolved}`)) {
        return;
      }

      seenUrls.add(resolved);
      items.push({
        title: titleText.slice(0, 380),
        description: (parentText || titleText).slice(0, 1800),
        officialSourceUrl: resolved,
        pdfUrl: isPdf ? resolved : '',
        applyOnlineUrl:
          /apply|registration|online-form/i.test(`${titleText} ${resolved}`) && !isPdf
            ? resolved
            : '',
        rawPubDate: '',
        sourceFormat: 'html'
      });
    });
  }

  return {
    items,
    looksLikeClientSpa: isSpaShell && items.length === 0
  };
}

/**
 * 6. Dedicated Direct PDF Notification Parser
 * Validates %PDF- magic bytes and extracts Content-Disposition / metadata Title & Date without fabricating text.
 */
export function parsePdfDocumentResponse(
  resHeaders: Headers,
  buffer: ArrayBuffer,
  targetUrl: string,
  fallbackTitle: string
): ParsedCandidateItem[] {
  const bytes = new Uint8Array(buffer);
  const headerSlice = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 32768)));
  if (!headerSlice.startsWith('%PDF-') && !targetUrl.toLowerCase().endsWith('.pdf')) {
    return [];
  }

  // Extract Content-Disposition filename if provided
  const cd = resHeaders.get('content-disposition') || '';
  const cdMatch = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
  const rawFilename = cdMatch?.[1]
    ? decodeURIComponent(cdMatch[1])
    : decodeURIComponent(targetUrl.split('/').pop() || '');

  // Check PDF Info dictionary /Title (...) or /CreationDate (D:YYYYMMDD...)
  const titleMatch = headerSlice.match(/\/Title\s*\(([^()\\]{5,180})\)/);
  const pdfMetaTitle = titleMatch?.[1] ? cleanText(titleMatch[1]) : '';

  const dateMatch = headerSlice.match(/\/CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})/);
  const lastModified = resHeaders.get('last-modified') || '';
  const rawPubDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : lastModified;

  const cleanFilename = rawFilename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const finalTitle =
    (pdfMetaTitle && pdfMetaTitle.length >= 8 ? pdfMetaTitle : '') ||
    (cleanFilename && cleanFilename.length >= 6 ? cleanFilename : '') ||
    fallbackTitle;

  const sizeKb = Math.max(1, Math.round(bytes.length / 1024));

  return [
    {
      title: finalTitle.slice(0, 380),
      description: `आधिकारिक PDF दस्तावेज़ (${sizeKb} KB)${rawFilename ? ` · फ़ाइल: ${rawFilename}` : ''}`,
      officialSourceUrl: targetUrl,
      pdfUrl: targetUrl,
      applyOnlineUrl: '',
      rawPubDate,
      sourceFormat: 'pdf'
    }
  ];
}
