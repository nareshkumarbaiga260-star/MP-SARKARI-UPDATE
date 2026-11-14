import crypto from 'node:crypto';
import type { AutoNotificationCategory, WebsiteCategory } from './types.ts';

export function mapAutoCategoryToWebsiteCategory(
  autoCategory: AutoNotificationCategory,
  region: 'MP' | 'Central' | 'State'
): WebsiteCategory {
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

export function classifyNotification(
  title: string,
  description: string,
  region: 'MP' | 'Central' | 'State',
  fallbackAutoCategory: AutoNotificationCategory
): {
  autoCategory: AutoNotificationCategory;
  websiteCategory: WebsiteCategory;
} {
  const hay = `${title} ${description}`.toLowerCase();

  let autoCategory: AutoNotificationCategory = fallbackAutoCategory;

  if (/\b(?:admit\s*card|hall\s*ticket|e-?admit)\b|प्रवेश\s*पत्र/i.test(hay)) {
    autoCategory = 'Admit Card';
  } else if (/\b(?:answer\s*key|provisional\s*key|model\s*answer)\b|उत्तर\s*कुंजी/i.test(hay)) {
    autoCategory = 'Answer Key';
  } else if (/\b(?:result|results|merit\s*list|score\s*card|scorecard|cut\s*-?off)\b|परीक्षा\s*परिणाम|परिणाम/i.test(hay)) {
    autoCategory = 'Results';
  } else if (/\b(?:yojana|scheme|schemes|mission|abhiyan|kalyan|subsidy|pension|fellowship)\b|योजना|लाड़ली|संबल|पीएम/i.test(hay)) {
    autoCategory = 'Sarkari Yojana';
  } else if (/\b(?:government\s*order|office\s*memorandum|circular|gazette|amendment|ordinance)\b|आदेश|परिपत्र|अधिसूचना\s*संशोधन/i.test(hay)) {
    autoCategory = 'Government Orders';
  } else if (/\b(?:recruitment|vacancy|vacancies|post|posts|engagement|apprentice|bharti|empanelment)\b|भर्ती|रिक्ति|पद/i.test(hay)) {
    if (/(madhya\s*pradesh|\bmpesb\b|\bmppsc\b|\bmp\s+|मध्य\s*प्रदेश|भोपाल|इंदौर)/i.test(hay) || region === 'MP') {
      autoCategory = 'MP Government Jobs';
    } else if (region === 'Central' || /(\bssc\b|\bupsc\b|\brrb\b|\bnta\b|india\s*post|railway|ministry|central)/i.test(hay)) {
      autoCategory = 'Central Government Jobs';
    } else {
      autoCategory = 'Latest Government Jobs';
    }
  } else if (/\b(?:exam|examination|schedule|calendar|syllabus|corrigendum|nta|cuet|neet|jee)\b|परीक्षा|तिथि/i.test(hay)) {
    autoCategory = 'Exam Notifications';
  } else if (/\b(?:notice|press\s*release|announcement|advisory|bulletin)\b|सूचना|विज्ञप्ति/i.test(hay)) {
    autoCategory = 'Important Notices';
  }

  return {
    autoCategory,
    websiteCategory: mapAutoCategoryToWebsiteCategory(autoCategory, region)
  };
}

export function extractNotificationNumber(text: string): string {
  const patterns = [
    /\bF\.?\s*No\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_.()]{2,40})/i,
    /\b(?:Advt\.?|Advertisement|Notification|Circular|Order|Memo)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-_.()]{2,40})/i,
    /(?:क्र\.?|क्रमांक|विज्ञापन\s*क्र\.?)\s*[:\-]?\s*([A-Z0-9\u0900-\u097F\/\-_.()]{2,40})/i
  ];
  for (const regex of patterns) {
    const match = text.match(regex);
    const candidate = match?.[1]?.trim();
    if (candidate && /\d/.test(candidate) && candidate.length <= 60) {
      return candidate.replace(/[.,;)]+$/, '');
    }
  }
  return '';
}

function formatDateFromParts(year: string, month: string, day: string): string {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
}

export function extractPublishedDate(rawPubDate: string, text: string, url: string): string {
  if (rawPubDate) {
    const parsed = new Date(rawPubDate);
    if (!Number.isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  // Check URL timestamps like Notice_20261112175300.pdf -> 12-11-2026
  const urlDateMatch = url.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (urlDateMatch) {
    const formatted = formatDateFromParts(urlDateMatch[1], urlDateMatch[2], urlDateMatch[3]);
    if (formatted) return formatted;
  }

  // Check explicit DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY in text
  const textDateMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])[.\-\/](0?[1-9]|1[0-2])[.\-\/](20\d{2})\b/);
  if (textDateMatch) {
    const formatted = formatDateFromParts(textDateMatch[3], textDateMatch[2], textDateMatch[1]);
    if (formatted) return formatted;
  }

  return '';
}

export function extractLastDate(text: string): string {
  const match = text.match(
    /(?:last\s*date|closing\s*date|apply\s*(?:till|before|up\s*to)|अंतिम\s*तिथि)[^0-9]{0,25}(0?[1-9]|[12]\d|3[01])[.\-\/](0?[1-9]|1[0-2])[.\-\/](20\d{2})/i
  );
  if (!match) return '';
  return formatDateFromParts(match[3], match[2], match[1]);
}

export function computeNotificationFingerprint(officialUrl: string, title: string): string {
  const cleanUrl = officialUrl.trim().toLowerCase().replace(/#.*$/, '');
  const cleanTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto
    .createHash('sha256')
    .update(`${cleanUrl}|${cleanTitle}`)
    .digest('hex')
    .slice(0, 40);
}
