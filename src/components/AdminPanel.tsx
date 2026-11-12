import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  LogIn,
  CheckCircle,
  AlertCircle,
  Database,
  Search,
  Sparkles,
  ExternalLink,
  Shield,
  FileText,
  Save,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { Post, PostCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { postService } from '../services/postService';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onRefresh: () => void;
  onOpenPasswordReset?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  posts,
  onRefresh,
  onOpenPasswordReset
}) => {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    signInWithCredentials,
    sendPasswordReset,
    signOut,
    authError,
    authSuccess,
    clearError,
    clearSuccess
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'manage'>('dashboard');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login form state
  const [loginMethod, setLoginMethod] = useState<'google' | 'password'>('google');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Form State
  const initialFormState: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
    title: '',
    category: 'latest-jobs',
    department: 'MPESB (मध्य प्रदेश कर्मचारी चयन मंडल)',
    shortDescription: '',
    fullDescription: '',
    totalVacancies: '',
    qualification: '',
    ageLimit: '',
    startDate: '',
    lastDate: '',
    examDate: '',
    applicationFee: '',
    applyOnlineUrl: '',
    notificationPdfUrl: '',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'police',
    isFeatured: false,
    isUrgent: false,
    authorEmail: AUTHORIZED_ADMIN_EMAIL
  };

  const [formData, setFormData] = useState(initialFormState);

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      showNotification('error', 'कृपया पासवर्ड दर्ज करें।');
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithCredentials(passwordInput);
      setPasswordInput('');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset request
  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    try {
      await sendPasswordReset();
      showNotification('success', `पासवर्ड रीसेट लिंक ${AUTHORIZED_ADMIN_EMAIL} पर भेज दिया गया है।`);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleEditClick = (post: Post) => {
    if (!isAdmin) return;
    setEditingPostId(post.id);
    setFormData({
      title: post.title,
      category: post.category,
      department: post.department,
      shortDescription: post.shortDescription,
      fullDescription: post.fullDescription,
      totalVacancies: post.totalVacancies || '',
      qualification: post.qualification || '',
      ageLimit: post.ageLimit || '',
      startDate: post.startDate || '',
      lastDate: post.lastDate || '',
      examDate: post.examDate || '',
      applicationFee: post.applicationFee || '',
      applyOnlineUrl: post.applyOnlineUrl || '',
      notificationPdfUrl: post.notificationPdfUrl || '',
      officialWebsiteUrl: post.officialWebsiteUrl,
      thumbnailUrl: post.thumbnailUrl || 'police',
      isFeatured: Boolean(post.isFeatured),
      isUrgent: Boolean(post.isUrgent),
      authorEmail: post.authorEmail || AUTHORIZED_ADMIN_EMAIL
    });
    setActiveTab('create');
  };

  const handleDeleteClick = async (postId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('क्या आप वाकई इस सरकारी सूचना को हटाना चाहते हैं? यह क्रिया स्थायी है।')) return;
    try {
      setIsSubmitting(true);
      await postService.deletePost(postId);
      showNotification('success', 'सरकारी सूचना सफलतापूर्वक हटा दी गई।');
      onRefresh();
    } catch (err: unknown) {
      showNotification('error', 'हटाने में त्रुटि: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('error', 'केवल अधिकृत व्यवस्थापक ही पोस्ट जोड़ या संपादित कर सकते हैं।');
      return;
    }

    if (!formData.title.trim() || !formData.shortDescription.trim() || !formData.officialWebsiteUrl.trim()) {
      showNotification('error', 'कृपया शीर्षक, संक्षिप्त विवरण एवं आधिकारिक वेबसाइट URL भरें।');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingPostId) {
        await postService.updatePost(editingPostId, {
          ...formData,
          authorEmail: AUTHORIZED_ADMIN_EMAIL
        });
        showNotification('success', 'सरकारी सूचना सफलतापूर्वक अपडेट कर दी गई!');
      } else {
        await postService.createPost({
          ...formData,
          authorEmail: AUTHORIZED_ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        showNotification('success', 'नई सरकारी सूचना सफलतापूर्वक प्रकाशित की गई!');
      }

      setFormData(initialFormState);
      setEditingPostId(null);
      setActiveTab('manage');
      onRefresh();
    } catch (err: unknown) {
      showNotification('error', 'प्रकाशन में त्रुटि: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!isAdmin) return;
    if (!window.confirm('क्या आप डेटाबेस में प्रामाणिक एमपी एवं केंद्र भर्ती डेटा लोड करना चाहते हैं?')) return;
    try {
      setIsSubmitting(true);
      const count = await postService.seedInitialPosts();
      showNotification('success', `${count} प्रामाणिक सरकारी सूचनाएँ डेटाबेस में जोड़ी गईं!`);
      onRefresh();
    } catch (err: unknown) {
      showNotification('error', 'डेटा लोड करने में त्रुटि: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        
        {/* Admin Header Strip */}
        <div className="bg-[#0B192C] text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                MP SARKARI UPDATE - अधिकृत एडमिन पैनल
              </h2>
              <p className="text-xs text-slate-300">
                एकल स्वामी व्यवस्थापक पोर्टल (Single Authorized Owner Security)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Body Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          
          {/* Notifications & Feedback */}
          {feedbackMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {authSuccess}
              </span>
              <button onClick={clearSuccess} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {authError}
              </span>
              <button onClick={clearError} className="text-rose-700 hover:text-rose-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* AUTHENTICATION VIEW: If user is not authorized administrator */}
          {!isAdmin ? (
            <div className="max-w-md mx-auto my-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-700">
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
                अधिकृत व्यवस्थापक लॉगिन
              </h3>
              <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed">
                यह एडमिन पैनल केवल वेबसाइट स्वामी हेतु आरक्षित है। कोई भी सार्वजनिक पंजीकरण (Sign Up) उपलब्ध नहीं है।
              </p>

              {/* Designated Admin Badge */}
              <div className="bg-white border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">
                    अधिकृत व्यवस्थापक ईमेल (Owner)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                    {AUTHORIZED_ADMIN_EMAIL}
                  </span>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="flex rounded-lg bg-slate-200 p-1 mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLoginMethod('google')}
                  className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                    loginMethod === 'google'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Google से लॉगिन
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                    loginMethod === 'password'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  पासवर्ड से लॉगिन
                </button>
              </div>

              {loginMethod === 'google' ? (
                /* Google Login Option */
                <div className="space-y-4">
                  <button
                    onClick={signInWithGoogle}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-bold px-4 py-3 rounded-xl border border-slate-300 shadow-xs transition cursor-pointer text-xs sm:text-sm"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google एडमिन खाते से प्रवेश करें</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    नोट: यदि चुना गया Google खाता <strong className="text-slate-800">{AUTHORIZED_ADMIN_EMAIL}</strong> से मेल नहीं खाएगा तो प्रवेश स्वतः अस्वीकृत हो जाएगा।
                  </p>
                </div>
              ) : (
                /* Password Login Option */
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      व्यवस्थापक ईमेल (लॉक्ड)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={AUTHORIZED_ADMIN_EMAIL}
                      className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      पासवर्ड दर्ज करें *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="सुरक्षित एडमिन पासवर्ड दर्ज करें..."
                        className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>प्रवेश करें (Admin Sign In)</span>
                  </button>

                  {/* Password Reset Trigger */}
                  <div className="pt-2 text-center space-y-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline disabled:opacity-50 cursor-pointer block mx-auto"
                    >
                      {isResettingPassword
                        ? 'ताज़ा रीसेट लिंक भेजा जा रहा है...'
                        : 'पासवर्ड भूल गए? ईमेल पर नया लिंक भेजें'}
                    </button>

                    {onOpenPasswordReset && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPasswordReset();
                        }}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer block mx-auto"
                      >
                        क्या आपके पास रीसेट लिंक/कोड है? यहाँ पासवर्ड बदलें &rarr;
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Security Policy Strip */}
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>सुरक्षा नीति: अन्य एडमिन खाते बनाने की अनुमति बंद है।</span>
                </div>
                <p>सभी विज़िटर्स केवल प्रकाशित सूचनाओं को पढ़ सकते हैं।</p>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED ADMIN DASHBOARD VIEW */
            <div>
              {/* Authenticated Admin Status Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                        {AUTHORIZED_ADMIN_EMAIL}
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                        एकमात्र अधिकृत व्यवस्थापक
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      सुरक्षित सत्र सक्रिय | Firestore डेटाबेस से लाइव कनेक्टेड
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
                    title="पासवर्ड रीसेट लिंक ईमेल पर प्राप्त करें"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>पासवर्ड रीसेट लिंक</span>
                  </button>

                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-lg border border-rose-200 transition font-bold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>लॉगआउट</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setEditingPostId(null);
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  डैशबोर्ड एवं सारांश
                </button>

                <button
                  onClick={() => {
                    setActiveTab('create');
                    if (!editingPostId) setFormData(initialFormState);
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                    activeTab === 'create'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {editingPostId ? 'सूचना संपादित करें' : '+ नई सरकारी सूचना जोड़ें'}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('manage');
                    setEditingPostId(null);
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                    activeTab === 'manage'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  सभी पोस्ट प्रबंधित करें ({posts.length})
                </button>
              </div>

              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <span className="text-xs text-blue-700 font-semibold block">कुल प्रकाशित सूचनाएँ</span>
                      <span className="text-2xl font-black text-blue-900 mt-1 block">{posts.length}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <span className="text-xs text-amber-700 font-semibold block">सरकारी नौकरियाँ (Jobs)</span>
                      <span className="text-2xl font-black text-amber-900 mt-1 block">
                        {posts.filter((p) => p.category === 'latest-jobs').length}
                      </span>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <span className="text-xs text-emerald-700 font-semibold block">योजनाएँ (MP & Central)</span>
                      <span className="text-2xl font-black text-emerald-900 mt-1 block">
                        {posts.filter((p) => p.category === 'mp-schemes' || p.category === 'central-schemes').length}
                      </span>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <span className="text-xs text-purple-700 font-semibold block">एडमिट कार्ड व परिणाम</span>
                      <span className="text-2xl font-black text-purple-900 mt-1 block">
                        {posts.filter((p) => p.category === 'admit-card' || p.category === 'results').length}
                      </span>
                    </div>
                  </div>

                  {/* Seed Database Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-xl border-2 border-amber-400/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <Database className="w-5 h-5 text-amber-600" />
                        <span>डेटाबेस बैकअप एवं प्रारंभिक भर्ती डेटा</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        MP पुलिस, पटवारी, MPPSC, लाड़ली बहना आदि के 12+ प्रामाणिक सरकारी पोस्ट्स को एक क्लिक में डेटाबेस में सुरक्षित लोड करें।
                      </p>
                    </div>

                    <button
                      onClick={handleSeedDatabase}
                      disabled={isSubmitting}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Database className="w-4 h-4" />
                      <span>प्रामाणिक पोस्ट लोड करें</span>
                    </button>
                  </div>

                  {/* Recent Activity Table */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 mb-3">
                      हाल ही में प्रकाशित सूचनाएँ (Recent Posts)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                          <tr>
                            <th className="p-3">शीर्षक</th>
                            <th className="p-3">विभाग</th>
                            <th className="p-3">श्रेणी</th>
                            <th className="p-3">अंतिम तिथि</th>
                            <th className="p-3 text-right">कार्रवाई</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {posts.slice(0, 5).map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-900 max-w-[280px] truncate">
                                {p.title}
                              </td>
                              <td className="p-3 text-slate-600 truncate max-w-[150px]">{p.department}</td>
                              <td className="p-3">
                                <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {CATEGORIES.find((c) => c.id === p.category)?.nameHindi || p.category}
                                </span>
                              </td>
                              <td className="p-3 text-rose-600 font-bold">{p.lastDate || '-'}</td>
                              <td className="p-3 text-right space-x-1">
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="p-1 hover:text-amber-600 transition"
                                  title="संपादित करें"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(p.id)}
                                  className="p-1 hover:text-rose-600 transition"
                                  title="हटाएं"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE / EDIT FORM */}
              {activeTab === 'create' && (
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {editingPostId ? 'सरकारी सूचना संपादित करें' : 'नई सरकारी नौकरी / योजना प्रकाशित करें'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        प्रकाशित करने वाले अधिकृत व्यवस्थापक: {AUTHORIZED_ADMIN_EMAIL}
                      </p>
                    </div>

                    {editingPostId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPostId(null);
                          setFormData(initialFormState);
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg"
                      >
                        रद्द करें (Cancel)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        श्रेणी (Category) *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as PostCategory })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameHindi} ({c.nameEnglish})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        विभाग / आयोग (Department/Commission) *
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="उदा. MPESB (व्यापमं), MPPSC, महिला एवं बाल विकास विभाग..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Post Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      पोस्ट शीर्षक (Hindi Post Title) *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="उदा. MP पुलिस आरक्षक भर्ती 2026 - 7500 पदों पर ऑनलाइन आवेदन प्रारंभ..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
                      required
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      संक्षिप्त विवरण (Short Summary) *
                    </label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="अधिसूचना का मुख्य सारांश..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Key Metrics: Vacancies, Qualification, Age Limit, Fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        कुल पद संख्या (Total Posts)
                      </label>
                      <input
                        type="text"
                        value={formData.totalVacancies}
                        onChange={(e) => setFormData({ ...formData, totalVacancies: e.target.value })}
                        placeholder="उदा. 7,500 पद"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        शैक्षणिक योग्यता (Qualification)
                      </label>
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="उदा. 10वीं/12वीं/स्नातक"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        आयु सीमा (Age Limit)
                      </label>
                      <input
                        type="text"
                        value={formData.ageLimit}
                        onChange={(e) => setFormData({ ...formData, ageLimit: e.target.value })}
                        placeholder="उदा. 18-36 वर्ष"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        आवेदन शुल्क (Application Fee)
                      </label>
                      <input
                        type="text"
                        value={formData.applicationFee}
                        onChange={(e) => setFormData({ ...formData, applicationFee: e.target.value })}
                        placeholder="उदा. Gen: ₹500, SC/ST: ₹250"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Dates: Start, Last, Exam */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        आवेदन प्रारंभ तिथि (Start Date)
                      </label>
                      <input
                        type="text"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        placeholder="उदा. 15-02-2026"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        अंतिम तिथि (Last Date)
                      </label>
                      <input
                        type="text"
                        value={formData.lastDate}
                        onChange={(e) => setFormData({ ...formData, lastDate: e.target.value })}
                        placeholder="उदा. 15-03-2026"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800 font-bold text-rose-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        परीक्षा तिथि (Exam Date)
                      </label>
                      <input
                        type="text"
                        value={formData.examDate}
                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                        placeholder="उदा. मई 2026"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Official Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ऑनलाइन आवेदन URL (Apply Link)
                      </label>
                      <input
                        type="url"
                        value={formData.applyOnlineUrl}
                        onChange={(e) => setFormData({ ...formData, applyOnlineUrl: e.target.value })}
                        placeholder="https://esb.mponline.gov.in"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        विभागीय विज्ञापन PDF लिंक (Notification PDF)
                      </label>
                      <input
                        type="url"
                        value={formData.notificationPdfUrl}
                        onChange={(e) => setFormData({ ...formData, notificationPdfUrl: e.target.value })}
                        placeholder="https://esb.mp.gov.in/rulebook.pdf"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        विभागीय मुख्य वेबसाइट URL *
                      </label>
                      <input
                        type="url"
                        value={formData.officialWebsiteUrl}
                        onChange={(e) => setFormData({ ...formData, officialWebsiteUrl: e.target.value })}
                        placeholder="https://esb.mp.gov.in"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  {/* Full Description / Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      विस्तृत नियम, निर्देश एवं स्टेप-बाय-स्टेप गाइड (Full Description)
                    </label>
                    <textarea
                      rows={6}
                      value={formData.fullDescription}
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                      placeholder="विस्तृत चयन प्रक्रिया, अंक विभाजन एवं निर्देश..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Checkbox Options */}
                  <div className="flex flex-wrap items-center gap-6 py-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300"
                      />
                      <span>होमपेज मुख्य भर्ती के रूप में हाइलाइट करें (Featured)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300"
                      />
                      <span>अंतिम तिथि निकट / अति आवश्यक (Urgent Deadline)</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPostId(null);
                        setFormData(initialFormState);
                        setActiveTab('manage');
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      रद्द करें
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs sm:text-sm shadow transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingPostId ? 'बदलाव सुरक्षित करें' : 'सरकारी सूचना प्रकाशित करें'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: MANAGE ALL POSTS */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="पोस्ट खोजें..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setEditingPostId(null);
                        setFormData(initialFormState);
                        setActiveTab('create');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>नई पोस्ट जोड़ें</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold text-[11px] uppercase">
                        <tr>
                          <th className="p-3">शीर्षक</th>
                          <th className="p-3">विभाग</th>
                          <th className="p-3">श्रेणी</th>
                          <th className="p-3">अंतिम तिथि</th>
                          <th className="p-3 text-right">कार्रवाई</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredPosts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-900 max-w-[320px]">
                              <p className="line-clamp-2">{p.title}</p>
                            </td>
                            <td className="p-3 text-slate-600 max-w-[160px] truncate">{p.department}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-bold whitespace-nowrap">
                                {CATEGORIES.find((c) => c.id === p.category)?.nameHindi || p.category}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-rose-600 whitespace-nowrap">{p.lastDate || '-'}</td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition cursor-pointer"
                                title="संपादित करें"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(p.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition cursor-pointer"
                                title="हटाएं"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Admin Footer Strip */}
        <div className="bg-slate-100 p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>MP SARKARI UPDATE - केवल अधिकृत व्यवस्थापक हेतु सुरक्षित</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition cursor-pointer"
          >
            बंद करें
          </button>
        </div>

      </div>
    </div>
  );
};
