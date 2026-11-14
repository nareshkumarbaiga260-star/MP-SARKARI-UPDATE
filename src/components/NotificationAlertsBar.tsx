import React, { useState, useMemo } from 'react';
import { Bell, X, ExternalLink, FileText, ChevronRight } from 'lucide-react';
import { ApprovedNotification, Post } from '../types';

interface NotificationAlertsBarProps {
  approvedNotifications: ApprovedNotification[];
  recentPosts: Post[];
  onOpenNotificationAsPost: (notification: ApprovedNotification) => void;
  onSelectPost: (post: Post) => void;
}

const SEEN_STORAGE_KEY = 'mp_sarkari_seen_alerts_v1';

export const NotificationAlertsBar: React.FC<NotificationAlertsBarProps> = ({
  approvedNotifications,
  recentPosts,
  onOpenNotificationAsPost,
  onSelectPost
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const alertItems = useMemo(() => {
    if (approvedNotifications.length > 0) {
      return approvedNotifications.slice(0, 6).map((n) => ({
        id: n.id,
        title: n.title,
        department: n.department,
        dateLabel: n.publishedDate || new Date(n.approvedAt).toLocaleDateString('hi-IN'),
        pdfUrl: n.pdfUrl,
        source: 'approved' as const,
        approvedObj: n
      }));
    }
    return recentPosts
      .filter((p) => p.isFeatured || p.isUrgent)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        department: p.department,
        dateLabel: p.lastDate || p.startDate || '',
        pdfUrl: p.notificationPdfUrl || '',
        source: 'post' as const,
        postObj: p
      }));
  }, [approvedNotifications, recentPosts]);

  const unreadItems = alertItems.filter((item) => !dismissedIds.includes(item.id));
  const latestAlert = unreadItems[0] || alertItems[0];

  if (!latestAlert) return null;

  const markAllRead = () => {
    const ids = alertItems.map((i) => i.id);
    const merged = Array.from(new Set([...dismissedIds, ...ids])).slice(-100);
    setDismissedIds(merged);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage quota issues
    }
  };

  return (
    <div className="mb-4 relative">
      {/* Compact Single-Bar Alert Strip */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            if (latestAlert.source === 'approved') {
              onOpenNotificationAsPost(latestAlert.approvedObj);
            } else {
              onSelectPost(latestAlert.postObj);
            }
          }}
          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer group"
        >
          <span className="p-1.5 rounded-lg bg-[#BA0000] text-white shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-black text-[#BA0000] mr-1.5">नया सरकारी अलर्ट:</span>
            <span className="font-bold text-slate-900 group-hover:underline truncate inline-block max-w-full align-bottom">
              {latestAlert.title}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-[#001F3F] hover:bg-slate-900 text-white font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            सभी अलर्ट ({unreadItems.length > 0 ? `${unreadItems.length} नए` : alertItems.length})
          </button>
        </div>
      </div>

      {/* Expandable Alerts Drawer */}
      {drawerOpen && (
        <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              ताज़ा सत्यापित सरकारी सूचना अलर्ट (Verified Alerts)
            </h4>
            <div className="flex items-center gap-2">
              {unreadItems.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  सभी पढ़ा हुआ चिह्नित करें
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                aria-label="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {alertItems.map((item) => (
              <li
                key={item.id}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    if (item.source === 'approved') {
                      onOpenNotificationAsPost(item.approvedObj);
                    } else {
                      onSelectPost(item.postObj);
                    }
                  }}
                  className="text-left flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-[#BA0000] line-clamp-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.department}
                    {item.dateLabel ? ` · ${item.dateLabel}` : ''}
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {item.pdfUrl && (
                    <a
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      if (item.source === 'approved') {
                        onOpenNotificationAsPost(item.approvedObj);
                      } else {
                        onSelectPost(item.postObj);
                      }
                    }}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#001F3F] hover:text-[#BA0000] cursor-pointer"
                  >
                    <span>खोलें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
