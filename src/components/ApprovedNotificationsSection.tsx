import React from 'react';
import { FileText, ExternalLink, Calendar, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ApprovedNotification } from '../types';

interface ApprovedNotificationsSectionProps {
  notifications: ApprovedNotification[];
  onReadMore: (notification: ApprovedNotification) => void;
}

export const ApprovedNotificationsSection: React.FC<ApprovedNotificationsSectionProps> = ({
  notifications,
  onReadMore
}) => {
  if (notifications.length === 0) return null;

  return (
    <section className="my-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div className="bg-[#001F3F] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#BA0000]">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            ताज़ा आधिकारिक सरकारी अधिसूचनाएँ (Verified Official Notifications)
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            एडमिन द्वारा सत्यापित आधिकारिक विभागीय विज्ञप्तियाँ एवं PDF दस्तावेज़
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <span>{notifications.length} सत्यापित अपडेट</span>
        </span>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notifications.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 bg-slate-50/60 hover:bg-white hover:border-[#BA0000] transition"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tabular-nums">
                <span className="text-[#BA0000] font-bold">{item.autoCategory}</span>
                {item.publishedDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.publishedDate}
                    </span>
                  </>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                {item.title}
              </h3>

              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{item.department}</span>
              </div>

              {item.lastDate && (
                <div className="text-xs font-bold text-rose-700 tabular-nums">
                  अंतिम तिथि: {item.lastDate}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}

                {item.applyOnlineUrl && (
                  <a
                    href={item.applyOnlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => onReadMore(item)}
                className="inline-flex items-center gap-1 text-xs font-black text-[#001F3F] hover:text-[#BA0000] cursor-pointer whitespace-nowrap ml-auto"
              >
                <span>पूरी जानकारी (Read More)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
