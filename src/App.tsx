import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BellRing,
  Filter,
  Grid,
  List,
  Sparkles,
  Search,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Calendar,
  ExternalLink,
  Share2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Post, PostCategory, FilterState, ApprovedNotification } from './types';
import { CATEGORIES, DEPARTMENT_LIST, QUALIFICATION_LIST } from './data/categories';
import { INITIAL_GOVT_POSTS } from './data/seedData';
import { postService } from './services/postService';
import { notificationService } from './services/notificationService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CategoryBoxes } from './components/CategoryBoxes';
import { SearchBar } from './components/SearchBar';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { SchemeHighlights } from './components/SchemeHighlights';
import { SarkariThreeColumnGrid } from './components/SarkariThreeColumnGrid';
import { SarkariSecondaryGrid } from './components/SarkariSecondaryGrid';
import { PostCard } from './components/PostCard';
import { PostDetailModal } from './components/PostDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { OnlineToolsSection } from './components/OnlineToolsSection';
import { OnlineToolsPage } from './components/OnlineToolsPage';
import { PassportPhotoMaker } from './components/PassportPhotoMaker';
import { AgeCalculatorTool } from './components/tools/AgeCalculatorTool';
import { AadhaarPrintTool } from './components/tools/AadhaarPrintTool';
import { ImageCompressorTool } from './components/tools/ImageCompressorTool';
import { SignatureCleanerTool } from './components/tools/SignatureCleanerTool';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { PdfMergerTool } from './components/tools/PdfMergerTool';
import { GovtFormToolsPage } from './components/tools/GovtFormToolsPage';
import { ONLINE_TOOLS, ToolCategoryId, ToolId } from './data/onlineTools';
import { PaperLayout, CopyCount } from './utils/passportExport';
import { Footer } from './components/Footer';
import { InfoModals, InfoModalType } from './components/InfoModals';
import { NotificationAlertsBar } from './components/NotificationAlertsBar';
import { ApprovedNotificationsSection } from './components/ApprovedNotificationsSection';

type OnlineToolsRouteState =
  | { view: 'hub' }
  | { view: 'tool'; toolId: ToolId }
  | null;

function parseOnlineToolsRoute(pathname: string): OnlineToolsRouteState {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/online-tools') {
    return { view: 'hub' };
  }
  if (clean === '/passport-photo-maker') {
    return { view: 'tool', toolId: 'passport-photo-maker' };
  }
  if (clean.startsWith('/online-tools/')) {
    const slug = clean.slice('/online-tools/'.length);
    const matched = ONLINE_TOOLS.find((t) => t.id === slug);
    if (matched) {
      return { view: 'tool', toolId: matched.id };
    }
    return { view: 'hub' };
  }
  return null;
}

interface AuthActionRouteState {
  isResetRoute: boolean;
  mode: string | null;
  oobCode: string | null;
  apiKey: string | null;
  continueUrl: string | null;
}

function parseAuthActionFromLocation(): AuthActionRouteState {
  try {
    const pathname = window.location.pathname || '/';
    const searchParams = new URLSearchParams(window.location.search);

    const rawHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashQuery = rawHash.includes('?') ? rawHash.slice(rawHash.indexOf('?') + 1) : rawHash;
    const hashParams = new URLSearchParams(hashQuery);

    let mode = searchParams.get('mode') || hashParams.get('mode');
    let oobCode = searchParams.get('oobCode') || hashParams.get('oobCode');
    let apiKey = searchParams.get('apiKey') || hashParams.get('apiKey');
    const continueUrl = searchParams.get('continueUrl') || hashParams.get('continueUrl');

    // If Firebase redirected through continueUrl with nested parameters, inspect it safely
    if ((!mode || !oobCode) && continueUrl) {
      try {
        const nested = new URL(continueUrl, window.location.origin);
        mode = mode || nested.searchParams.get('mode');
        oobCode = oobCode || nested.searchParams.get('oobCode');
        apiKey = apiKey || nested.searchParams.get('apiKey');
      } catch {
        // Ignore malformed continueUrl
      }
    }

    const isPathReset =
      pathname === '/reset-password' ||
      pathname.startsWith('/reset-password/') ||
      pathname === '/__/auth/action';

    const isResetRoute =
      isPathReset ||
      mode === 'resetPassword' ||
      Boolean(oobCode && (!mode || mode === 'resetPassword'));

    return {
      isResetRoute,
      mode,
      oobCode,
      apiKey,
      continueUrl
    };
  } catch (e) {
    console.warn('URL parsing for auth action code:', e);
    return {
      isResetRoute: false,
      mode: null,
      oobCode: null,
      apiKey: null,
      continueUrl: null
    };
  }
}

const initialFilters: FilterState = {
  searchQuery: '',
  category: 'all',
  department: DEPARTMENT_LIST[0],
  qualification: QUALIFICATION_LIST[0]
};

function MainApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [approvedNotifications, setApprovedNotifications] = useState<ApprovedNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentCategory, setCurrentCategory] = useState<PostCategory>('all');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modals & custom password reset page / online tools state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [authActionRoute, setAuthActionRoute] = useState<AuthActionRouteState>(() =>
    parseAuthActionFromLocation()
  );
  const [toolsRoute, setToolsRoute] = useState<OnlineToolsRouteState>(() =>
    parseOnlineToolsRoute(window.location.pathname)
  );
  const [toolsInitialCategory, setToolsInitialCategory] = useState<ToolCategoryId>('all');
  const [toolPreset, setToolPreset] = useState<{ paperLayout: PaperLayout; copies: CopyCount }>({
    paperLayout: '4x6',
    copies: 6
  });

  const searchInputRef = useRef<HTMLDivElement>(null);

  const { isAdmin } = useAuth();

  // Keep password reset page & tool routes synchronized with browser navigation
  useEffect(() => {
    const syncFromUrl = () => {
      setAuthActionRoute(parseAuthActionFromLocation());
      setToolsRoute(parseOnlineToolsRoute(window.location.pathname));
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Subscribe to real-time posts from Firestore
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = postService.subscribeToPosts(
      async (livePosts) => {
        if (!isMounted) return;
        
        // If Firestore is empty on initial boot
        if (livePosts.length === 0) {
          if (isAdmin) {
            try {
              await postService.seedInitialPosts();
            } catch {
              setPosts(INITIAL_GOVT_POSTS.map((item, idx) => ({ ...item, id: `init_${idx}` })));
            }
          } else {
            // Visitors see authentic initial posts safely without triggering write operations
            setPosts(INITIAL_GOVT_POSTS.map((item, idx) => ({ ...item, id: `init_${idx}` })));
          }
        } else {
          setPosts(livePosts);
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Live subscription error, falling back to local posts:', error);
        if (isMounted) {
          setPosts(INITIAL_GOVT_POSTS.map((item, idx) => ({ ...item, id: `fallback_${idx}` })));
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Subscribe to admin-approved official notifications from Firestore + backend fallback
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = notificationService.subscribeApprovedNotifications(
      async (items) => {
        if (!isMounted) return;
        if (items.length > 0) {
          setApprovedNotifications(items);
        } else {
          const backendApproved = await notificationService.fetchPublicApprovedFromBackend();
          if (isMounted && backendApproved.length > 0) {
            setApprovedNotifications(backendApproved);
          } else if (isMounted) {
            setApprovedNotifications([]);
          }
        }
      },
      async () => {
        const backendApproved = await notificationService.fetchPublicApprovedFromBackend();
        if (isMounted) {
          setApprovedNotifications(backendApproved);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const openApprovedNotificationInModal = (item: ApprovedNotification) => {
    if (item.linkedPostId) {
      const matched = posts.find((p) => p.id === item.linkedPostId);
      if (matched) {
        setSelectedPost(matched);
        return;
      }
    }
    const syntheticPost: Post = {
      id: item.linkedPostId || item.id,
      title: item.title,
      category: item.websiteCategory || 'govt-updates',
      department: item.department || item.sourceName,
      shortDescription:
        item.description ||
        `${item.department} द्वारा जारी आधिकारिक अधिसूचना${item.notificationNumber ? ` (क्रमांक: ${item.notificationNumber})` : ''}।`,
      fullDescription: `${item.description || item.title}\n\nविभाग: ${item.department}\nस्रोत: ${item.sourceName}${item.notificationNumber ? `\nअधिसूचना क्रमांक: ${item.notificationNumber}` : ''}${item.publishedDate ? `\nप्रकाशन तिथि: ${item.publishedDate}` : ''}${item.lastDate ? `\nअंतिम तिथि: ${item.lastDate}` : ''}`,
      startDate: item.publishedDate || '',
      lastDate: item.lastDate || '',
      applyOnlineUrl: item.applyOnlineUrl || item.officialSourceUrl,
      notificationPdfUrl: item.pdfUrl || '',
      officialWebsiteUrl: item.officialSourceUrl,
      authorEmail: item.approvedBy || 'NARESHKUMARBAIGA260@GMAIL.COM',
      createdAt: item.approvedAt,
      updatedAt: item.approvedAt
    };
    setSelectedPost(syntheticPost);
  };

  // Compute counts per category for the 8-box grid
  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Handle category selection
  const handleSelectCategory = (cat: PostCategory) => {
    setCurrentCategory(cat);
    setFilters((prev) => ({ ...prev, category: cat }));
  };

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      if (currentCategory !== 'all' && post.category !== currentCategory) {
        return false;
      }

      // Department filter
      if (filters.department !== DEPARTMENT_LIST[0] && post.department !== filters.department) {
        return false;
      }

      // Qualification filter
      if (filters.qualification !== QUALIFICATION_LIST[0]) {
        const postQual = (post.qualification || '').toLowerCase();
        const filterKeyword = filters.qualification.toLowerCase();
        if (filterKeyword.includes('10वीं') && !postQual.includes('10वीं') && !postQual.includes('8वीं')) return false;
        if (filterKeyword.includes('12वीं') && !postQual.includes('12वीं')) return false;
        if (filterKeyword.includes('स्नातक') && !postQual.includes('स्नातक') && !postQual.includes('degree') && !postQual.includes('graduate')) return false;
      }

      // Search query filter
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const inTitle = post.title.toLowerCase().includes(query);
        const inDept = post.department.toLowerCase().includes(query);
        const inShortDesc = post.shortDescription.toLowerCase().includes(query);
        const inVacancies = (post.totalVacancies || '').toLowerCase().includes(query);
        const inQual = (post.qualification || '').toLowerCase().includes(query);
        if (!inTitle && !inDept && !inShortDesc && !inVacancies && !inQual) {
          return false;
        }
      }

      return true;
    });
  }, [posts, currentCategory, filters]);

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setCurrentCategory('all');
  };

  const currentCategoryMeta = CATEGORIES.find((c) => c.id === currentCategory) || CATEGORIES[0];

  const closeResetPageToHome = () => {
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, '/');
    }
    setAuthActionRoute({
      isResetRoute: false,
      mode: null,
      oobCode: null,
      apiKey: null,
      continueUrl: null
    });
  };

  if (authActionRoute.isResetRoute) {
    return (
      <ResetPasswordPage
        oobCode={authActionRoute.oobCode}
        apiKey={authActionRoute.apiKey}
        continueUrl={authActionRoute.continueUrl}
        mode={authActionRoute.mode}
        onBackToHome={closeResetPageToHome}
        onGoToAdminLogin={() => {
          closeResetPageToHome();
          setIsAdminOpen(true);
        }}
      />
    );
  }

  const openOnlineToolsHub = (category: ToolCategoryId = 'all') => {
    setToolsInitialCategory(category);
    if (window.history.pushState && window.location.pathname !== '/online-tools') {
      window.history.pushState({}, document.title, '/online-tools');
    }
    setToolsRoute({ view: 'hub' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSpecificTool = (
    toolId: ToolId,
    preset?: { paperLayout: PaperLayout; copies: CopyCount }
  ) => {
    if (preset) {
      setToolPreset(preset);
    }
    const targetPath = `/online-tools/${toolId}`;
    if (window.history.pushState && window.location.pathname !== targetPath) {
      window.history.pushState({}, document.title, targetPath);
    }
    setToolsRoute({ view: 'tool', toolId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeToolsToHome = () => {
    if (window.history.pushState && window.location.pathname !== '/') {
      window.history.pushState({}, document.title, '/');
    }
    setToolsRoute(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (toolsRoute?.view === 'hub') {
    return (
      <OnlineToolsPage
        initialCategory={toolsInitialCategory}
        onSelectTool={(toolId) => openSpecificTool(toolId)}
        onBackToHome={closeToolsToHome}
      />
    );
  }

  if (toolsRoute?.view === 'tool') {
    const backToTools = () => openOnlineToolsHub(toolsInitialCategory);
    switch (toolsRoute.toolId) {
      case 'passport-photo-maker':
        return (
          <PassportPhotoMaker
            initialPaperLayout={toolPreset.paperLayout}
            initialCopies={toolPreset.copies}
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'aadhaar-print':
        return (
          <AadhaarPrintTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'age-calculator':
        return (
          <AgeCalculatorTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'image-compressor':
        return (
          <ImageCompressorTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'signature-cleaner':
        return (
          <SignatureCleanerTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'image-to-pdf':
        return (
          <ImageToPdfTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'pdf-merger':
        return (
          <PdfMergerTool
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
          />
        );
      case 'govt-form-tools':
        return (
          <GovtFormToolsPage
            onBackToTools={backToTools}
            onBackToPortal={closeToolsToHome}
            onSelectTool={(id) => openSpecificTool(id)}
          />
        );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSearch={() => {
          searchInputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenOnlineTools={() => openOnlineToolsHub('all')}
        isOnlineToolsActive={toolsRoute !== null}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Live Official Notification Alerts Bar & Drawer */}
        <NotificationAlertsBar
          approvedNotifications={approvedNotifications}
          recentPosts={posts}
          onOpenNotificationAsPost={openApprovedNotificationInModal}
          onSelectPost={setSelectedPost}
        />

        {/* Sarkari 8-Box Highlights Grid */}
        <CategoryBoxes
          onSelectCategory={handleSelectCategory}
          postCounts={postCounts}
        />

        {/* Search & Filter Bar */}
        <div ref={searchInputRef}>
          <SearchBar
            filters={filters}
            onChangeFilters={setFilters}
            onReset={handleResetFilters}
            totalFiltered={filteredPosts.length}
          />
        </div>

        {/* Urgent Deadlines Widget */}
        <UpcomingDeadlines
          posts={posts}
          onSelectPost={setSelectedPost}
        />

        {/* 4. MAIN THREE-COLUMN SARKARI HOMEPAGE GRID (Results | Admit Card | Latest Jobs) */}
        {currentCategory === 'all' && !filters.searchQuery && (
          <SarkariThreeColumnGrid
            posts={posts}
            onSelectPost={setSelectedPost}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Admin-Approved Official Notifications Showcase */}
        {currentCategory === 'all' && !filters.searchQuery && approvedNotifications.length > 0 && (
          <ApprovedNotificationsSection
            notifications={approvedNotifications}
            onReadMore={openApprovedNotificationInModal}
          />
        )}

        {/* MP SARKARI UPDATE Online Tools Section (All 6 Categories + Clickable Tool Cards) */}
        <OnlineToolsSection
          onOpenOnlineTools={openOnlineToolsHub}
          onSelectTool={(toolId) => openSpecificTool(toolId)}
        />

        {/* 5. SECONDARY THREE-COLUMN GRID (Answer Key | Syllabus | Admission/Scholarship) */}
        {currentCategory === 'all' && !filters.searchQuery && (
          <SarkariSecondaryGrid
            posts={posts}
            onSelectPost={setSelectedPost}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* 6. Popular Government Schemes Spotlight (shown on 'all' or 'schemes' view) */}
        {(currentCategory === 'all' || currentCategory === 'mp-schemes' || currentCategory === 'central-schemes') && (
          <SchemeHighlights
            posts={posts}
            onSelectPost={setSelectedPost}
            onFilterSchemes={() => handleSelectCategory('mp-schemes')}
          />
        )}

        {/* Posts Feed Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b-2 border-red-700 pb-3 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {currentCategory === 'all' ? 'नवीनतम सरकारी भर्तियाँ एवं सूचनाएँ (All Updates)' : currentCategoryMeta.nameHindi}
              </h2>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-300">
                {filteredPosts.length} सूचनाएँ उपलब्ध
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {currentCategoryMeta.descriptionHindi}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentCategory !== 'all' && (
              <button
                onClick={() => handleSelectCategory('all')}
                className="text-xs text-red-700 hover:text-red-900 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                ← वापस होमपेज (Back to Home)
              </button>
            )}

            {/* View mode toggle: Grid vs Table */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#BA0000] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="कार्ड ग्रिड दृश्य"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">कार्ड दृश्य</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#BA0000] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="तालिका दृश्य"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">तालिका दृश्य</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              सरकारी सूचनाएँ लोड हो रही हैं, कृपया प्रतीक्षा करें...
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto my-10 shadow-xs">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              कोई सूचना नहीं मिली
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              आपके द्वारा चुने गए फ़िल्टर अथवा खोज शब्द के अनुसार वर्तमान में कोई अधिसूचना उपलब्ध नहीं है।
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>सभी सूचनाएँ देखें (Reset Filters)</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* 1. Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSelect={setSelectedPost}
              />
            ))}
          </div>
        ) : (
          /* 2. Compact Sarkari Table View */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#001F3F] text-white font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">भर्ती / योजना का नाम</th>
                  <th className="p-3.5">विभाग</th>
                  <th className="p-3.5">कुल पद</th>
                  <th className="p-3.5">योग्यता</th>
                  <th className="p-3.5">अंतिम तिथि</th>
                  <th className="p-3.5 text-center">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="hover:bg-red-50/40 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-bold text-slate-900 group-hover:text-red-700 transition max-w-[340px]">
                      <div className="line-clamp-2">{post.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        {CATEGORIES.find((c) => c.id === post.category)?.nameHindi}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600 truncate max-w-[160px]">
                      {post.department}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {post.totalVacancies || '-'}
                    </td>
                    <td className="p-3.5 text-slate-600 truncate max-w-[160px]">
                      {post.qualification || '-'}
                    </td>
                    <td className="p-3.5 font-bold text-rose-600 whitespace-nowrap">
                      {post.lastDate || '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                        }}
                        className="bg-[#BA0000] hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition cursor-pointer"
                      >
                        विवरण व फॉर्म &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* WhatsApp & Telegram Community Banner */}
        <div className="mt-12 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-wrap items-center justify-between gap-6 border border-emerald-700">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-xs border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> निःशुल्क जॉब अलर्ट
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              मध्य प्रदेश सरकारी नौकरी एवं योजना WhatsApp ग्रुप से जुड़ें
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              सभी नई भर्तियों, प्रवेश पत्र और परीक्षा परिणामों का त्वरित नोटिफिकेशन सीधे अपने मोबाइल पर प्राप्त करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-100 text-emerald-900 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp ग्रुप जॉइन करें</span>
            </a>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 border border-emerald-400/40"
            >
              <ExternalLink className="w-4 h-4" />
              <span>टेलीग्राम चैनल</span>
            </a>
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenModal={(type) => setInfoModalType(type)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOnlineTools={() => openOnlineToolsHub('all')}
        onOpenPassportMaker={() => openSpecificTool('passport-photo-maker')}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        posts={posts}
        onRefresh={() => {
          postService.getPosts().then((updated) => setPosts(updated));
        }}
        onOpenPasswordReset={() => {
          setIsAdminOpen(false);
          if (window.history.pushState) {
            window.history.pushState({}, document.title, '/reset-password');
          }
          setAuthActionRoute({
            isResetRoute: true,
            mode: 'resetPassword',
            oobCode: null,
            apiKey: null,
            continueUrl: null
          });
        }}
      />

      {/* Information / Legal Modals */}
      <InfoModals
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
