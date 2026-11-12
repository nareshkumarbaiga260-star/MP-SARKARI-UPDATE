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
  | 'govt-updates';

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
