export type PostCategory =
  | 'all'
  | 'latest-jobs'
  | 'mp-schemes'
  | 'central-schemes'
  | 'admit-card'
  | 'results'
  | 'answer-key'
  | 'syllabus'
  | 'application-guide'
  | 'govt-updates'
  | 'admission'
  | 'scholarship';

export interface CategoryMeta {
  id: PostCategory;
  nameHindi: string;
  nameEnglish: string;
  icon: string;
  badgeColor: string;
  descriptionHindi: string;
}

export interface Post {
  id: string;
  title: string;
  category: PostCategory;
  department: string;
  shortDescription: string;
  fullDescription: string;
  totalVacancies?: string;
  qualification?: string;
  ageLimit?: string;
  startDate?: string;
  lastDate?: string;
  examDate?: string;
  applicationFee?: string;
  applyOnlineUrl?: string;
  notificationPdfUrl?: string;
  officialWebsiteUrl: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isUrgent?: boolean;
  authorEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: PostCategory;
  department: string;
  qualification: string;
}

export interface SiteStatistics {
  totalPosts: number;
  latestJobsCount: number;
  mpSchemesCount: number;
  centralSchemesCount: number;
  admitCardCount: number;
  resultsCount: number;
}

export type AutoNotificationCategory =
  | 'Latest Government Jobs'
  | 'MP Government Jobs'
  | 'Central Government Jobs'
  | 'Government Orders'
  | 'Sarkari Yojana'
  | 'Admit Card'
  | 'Results'
  | 'Answer Key'
  | 'Exam Notifications'
  | 'Important Notices';

export type SourceMonitorMethod = 'auto' | 'rss' | 'sitemap' | 'api' | 'html' | 'pdf';

export type SourceConnectionStatus =
  | 'connected'
  | 'manual_config_needed'
  | 'blocked_by_robots'
  | 'failed'
  | 'pending';

export type SourceFailureReason =
  | 'NONE'
  | 'TIMEOUT'
  | 'DNS_FAILED'
  | 'WAF_FORBIDDEN_403'
  | 'HTTP_ERROR'
  | 'TLS_ERROR'
  | 'SPA_JS_ONLY'
  | 'ROBOTS_DISALLOWED'
  | 'PARSE_EMPTY';

export interface GovernmentSource {
  id: string;
  name: string;
  department: string;
  url: string;
  alternateUrl?: string;
  portalHomeUrl: string;
  method: SourceMonitorMethod;
  region: 'MP' | 'Central' | 'State';
  defaultAutoCategory: AutoNotificationCategory;
  enabled: boolean;
  isDefault: boolean;
  connectionStatus: SourceConnectionStatus;
  failureReason?: SourceFailureReason;
  statusMessage: string;
  lastErrorDetail?: string;
  lastCheckedAt: string;
  lastSuccessfulCheckAt?: string;
  lastHttpStatus: number;
  lastLatencyMs: number;
  retryCount?: number;
  itemsDetectedLastRun: number;
  robotsAllowed: boolean;
  manualNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetectedNotification {
  id: string;
  fingerprint: string;
  sourceId: string;
  sourceName: string;
  department: string;
  title: string;
  description: string;
  autoCategory: AutoNotificationCategory;
  websiteCategory: PostCategory;
  publishedDate: string;
  lastDate: string;
  notificationNumber: string;
  officialSourceUrl: string;
  pdfUrl: string;
  applyOnlineUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  detectedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  publishedPostId?: string;
}

export interface ApprovedNotification {
  id: string;
  detectedId: string;
  fingerprint: string;
  sourceId: string;
  sourceName: string;
  department: string;
  title: string;
  description: string;
  autoCategory: AutoNotificationCategory;
  websiteCategory: PostCategory;
  publishedDate: string;
  lastDate: string;
  notificationNumber: string;
  officialSourceUrl: string;
  pdfUrl: string;
  applyOnlineUrl: string;
  approvedBy: string;
  approvedAt: string;
  linkedPostId?: string;
}

export interface MonitoringLog {
  id: string;
  runType: 'scheduled' | 'manual' | 'alert';
  sourceId?: string;
  sourceName?: string;
  status: 'connected' | 'manual_config_needed' | 'blocked_by_robots' | 'failed' | 'info';
  message: string;
  newCount: number;
  duplicateCount: number;
  failedCount: number;
  checkedAt: string;
}

export interface MonitoringSummary {
  totalSources: number;
  enabledSources: number;
  connectedCount: number;
  manualConfigCount: number;
  failedSourcesCount: number;
  lastCheckedAt: string;
  nextScheduledAt: string;
  intervalMinutes: number;
  newlyDetectedLastRun: number;
  pendingCount: number;
  publishedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  lastRunDuplicateCount: number;
  emailAlertsEnabled: boolean;
  smtpConfigured: boolean;
}

