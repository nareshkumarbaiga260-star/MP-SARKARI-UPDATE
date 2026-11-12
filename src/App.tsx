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
import { Post, PostCategory, FilterState } from './types';
import { CATEGORIES, DEPARTMENT_LIST, QUALIFICATION_LIST } from './data/categories';
import { INITIAL_GOVT_POSTS } from './data/seedData';
import { postService } from './services/postService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CategoryBoxes } from './components/CategoryBoxes';
import { SearchBar } from './components/SearchBar';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { SchemeHighlights } from './components/SchemeHighlights';
import { PostCard } from './components/PostCard';
import { PostDetailModal } from './components/PostDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { PasswordResetModal } from './components/PasswordResetModal';
import { Footer } from './components/Footer';
import { InfoModals, InfoModalType } from './components/InfoModals';

const initialFilters: FilterState = {
  searchQuery: '',
  category: 'all',
  department: DEPARTMENT_LIST[0],
  qualification: QUALIFICATION_LIST[0]
};

function MainApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentCategory, setCurrentCategory] = useState<PostCategory>('all');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modals state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetActionCode, setResetActionCode] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLDivElement>(null);

  const { isAdmin } = useAuth();

  // Detect Firebase action parameters (mode & oobCode) from Gmail reset links
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let mode = searchParams.get('mode');
      let oobCode = searchParams.get('oobCode');

      // Fallback check hash fragment if not present in search query
      if ((!mode || !oobCode) && window.location.hash.includes('mode=')) {
        const hashQuery = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashQuery);
        mode = mode || hashParams.get('mode');
        oobCode = oobCode || hashParams.get('oobCode');
      }

      if (mode === 'resetPassword' && oobCode) {
        setResetActionCode(oobCode);
        setIsResetModalOpen(true);
      }
    } catch (e) {
      console.warn('URL parsing for auth action code:', e);
    }
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
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

        {/* Popular Government Schemes Spotlight (shown on 'all' or 'schemes' view) */}
        {(currentCategory === 'all' || currentCategory === 'mp-schemes' || currentCategory === 'central-schemes') && (
          <SchemeHighlights
            posts={posts}
            onSelectPost={setSelectedPost}
            onFilterSchemes={() => handleSelectCategory('mp-schemes')}
          />
        )}

        {/* Posts Feed Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {currentCategoryMeta.nameHindi}
              </h2>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">
                {filteredPosts.length} सूचनाएँ उपलब्ध
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentCategoryMeta.descriptionHindi}
            </p>
          </div>

          {/* View mode toggle: Grid vs Table */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
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
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="तालिका दृश्य"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">तालिका दृश्य</span>
            </button>
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
              <thead className="bg-[#0B192C] text-white font-bold text-xs uppercase tracking-wider">
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
                    className="hover:bg-amber-50/50 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-bold text-slate-900 group-hover:text-amber-700 transition max-w-[340px]">
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
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition"
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
          setIsResetModalOpen(true);
        }}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        initialCode={resetActionCode}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetActionCode(null);
        }}
        onOpenAdminLogin={() => {
          setIsResetModalOpen(false);
          setIsAdminOpen(true);
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
