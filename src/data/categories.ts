import { CategoryMeta } from '../types';

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'all',
    nameHindi: 'सभी सूचनाएँ',
    nameEnglish: 'All Updates',
    icon: 'LayoutGrid',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    descriptionHindi: 'मध्य प्रदेश एवं केंद्र सरकार की संपूर्ण अधिसूचनाएँ'
  },
  {
    id: 'latest-jobs',
    nameHindi: 'नवीनतम सरकारी नौकरियाँ',
    nameEnglish: 'Latest Jobs',
    icon: 'Briefcase',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    descriptionHindi: 'मध्य प्रदेश व्यापमं, MPPSC, पुलिस, पटवारी एवं केंद्रीय भर्तियाँ'
  },
  {
    id: 'mp-schemes',
    nameHindi: 'मध्य प्रदेश सरकारी योजनाएँ',
    nameEnglish: 'MP Govt Schemes',
    icon: 'Landmark',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    descriptionHindi: 'लाड़ली बहना, संबल 2.0, सीखो कमाओ, किसान कल्याण योजना'
  },
  {
    id: 'central-schemes',
    nameHindi: 'केंद्र सरकार योजनाएँ',
    nameEnglish: 'Central Schemes',
    icon: 'Flag',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    descriptionHindi: 'पीएम किसान, आयुष्मान भारत, पीएम आवास योजना'
  },
  {
    id: 'admit-card',
    nameHindi: 'प्रवेश पत्र (Admit Card)',
    nameEnglish: 'Admit Card',
    icon: 'FileText',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    descriptionHindi: 'विभिन्न प्रतियोगी परीक्षाओं के प्रवेश पत्र डाउनलोड करें'
  },
  {
    id: 'results',
    nameHindi: 'परीक्षा परिणाम (Results)',
    nameEnglish: 'Results',
    icon: 'Trophy',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    descriptionHindi: 'मध्य प्रदेश व राष्ट्रीय स्तर के घोषित परीक्षा परिणाम'
  },
  {
    id: 'answer-key',
    nameHindi: 'उत्तर कुंजी (Answer Key)',
    nameEnglish: 'Answer Key',
    icon: 'KeyRound',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    descriptionHindi: 'प्रामाणिक मॉडल उत्तर कुंजी एवं आपत्ति दर्ज करने की लिंक'
  },
  {
    id: 'syllabus',
    nameHindi: 'पाठ्यक्रम एवं पैटर्न (Syllabus)',
    nameEnglish: 'Syllabus',
    icon: 'BookOpen',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    descriptionHindi: 'परीक्षा पाठ्यक्रम, अंक विभाजन एवं चयन प्रक्रिया'
  },
  {
    id: 'application-guide',
    nameHindi: 'ऑनलाइन फॉर्म एवं गाइड',
    nameEnglish: 'Online Form Guide',
    icon: 'HelpCircle',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    descriptionHindi: 'घर बैठे फॉर्म भरने की चरणबद्ध जानकारी व दिशा-निर्देश'
  },
  {
    id: 'govt-updates',
    nameHindi: 'महत्वपूर्ण सरकारी अपडेट',
    nameEnglish: 'Govt Updates',
    icon: 'BellRing',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    descriptionHindi: 'मंत्रालय आदेश, आरक्षण नियम, आयु सीमा छूट एवं प्रेस विज्ञप्ति'
  }
];

export const DEPARTMENT_LIST = [
  'सभी विभाग (All Departments)',
  'MPESB (मध्य प्रदेश कर्मचारी चयन मंडल)',
  'MPPSC (मध्य प्रदेश लोक सेवा आयोग)',
  'मध्य प्रदेश पुलिस मुख्यालय (MP Police)',
  'महिला एवं बाल विकास विभाग MP',
  'राजस्व विभाग मध्य प्रदेश (MP Patwari)',
  'स्कूल शिक्षा विभाग मध्य प्रदेश',
  'राष्ट्रीय स्वास्थ्य मिशन (NHM MP)',
  'कर्मचारी चयन आयोग (SSC)',
  'रेलवे भर्ती बोर्ड (RRB)',
  'मध्य प्रदेश उच्च न्यायालय (MP High Court)',
  'कृषि एवं किसान कल्याण मंत्रालय'
];

export const QUALIFICATION_LIST = [
  'सभी योग्यता (All Qualifications)',
  '8वीं / 10वीं पास (High School)',
  '12वीं पास (Higher Secondary)',
  'स्नातक (Graduate - BA/BSc/BCom/BTech)',
  'पोस्ट ग्रेजुएट (Post Graduate)',
  'ITI / डिप्लोमा धारक',
  'D.El.Ed / B.Ed शिक्षक पात्रता'
];
