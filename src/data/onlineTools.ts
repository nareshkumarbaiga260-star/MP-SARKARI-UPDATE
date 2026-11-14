export type ToolCategoryId =
  | 'all'
  | 'pdf-tools'
  | 'image-tools'
  | 'passport-photo'
  | 'aadhaar-print'
  | 'age-calculator'
  | 'govt-form-tools';

export type ToolId =
  | 'passport-photo-maker'
  | 'aadhaar-print'
  | 'age-calculator'
  | 'image-compressor'
  | 'signature-cleaner'
  | 'image-to-pdf'
  | 'pdf-merger'
  | 'govt-form-tools';

export interface ToolCategoryMeta {
  id: ToolCategoryId;
  labelEn: string;
  labelHindi: string;
}

export interface OnlineToolItem {
  id: ToolId;
  category: Exclude<ToolCategoryId, 'all'>;
  categoryLabelEn: string;
  titleHindi: string;
  titleEn: string;
  descriptionHindi: string;
  specs: string;
  path: string;
  accentBg: string;
  iconName:
    | 'camera'
    | 'credit-card'
    | 'calendar'
    | 'minimize'
    | 'pen-tool'
    | 'file-image'
    | 'files'
    | 'clipboard-check';
}

export const TOOL_CATEGORIES: ToolCategoryMeta[] = [
  { id: 'all', labelEn: 'All Tools', labelHindi: 'सभी टूल्स' },
  { id: 'passport-photo', labelEn: 'Passport Photo Maker', labelHindi: 'पासपोर्ट फोटो मेकर' },
  { id: 'pdf-tools', labelEn: 'PDF Tools', labelHindi: 'PDF टूल्स' },
  { id: 'image-tools', labelEn: 'Image Tools', labelHindi: 'इमेज टूल्स' },
  { id: 'aadhaar-print', labelEn: 'Aadhaar Print', labelHindi: 'आधार प्रिंट' },
  { id: 'age-calculator', labelEn: 'Age Calculator', labelHindi: 'आयु कैलकुलेटर' },
  { id: 'govt-form-tools', labelEn: 'Government Form Tools', labelHindi: 'सरकारी फॉर्म टूल्स' }
];

export const ONLINE_TOOLS: OnlineToolItem[] = [
  {
    id: 'passport-photo-maker',
    category: 'passport-photo',
    categoryLabelEn: 'Passport Photo Maker',
    titleHindi: 'पासपोर्ट साइज फोटो मेकर (35 × 45 mm)',
    titleEn: 'Passport Photo Maker',
    descriptionHindi:
      'ऑटो बैकग्राउंड रिमूवल (सफेद, नीला, लाल), क्रॉपिंग व 6, 12, 24 कॉपी वाले 300 DPI प्रिंट-रेडी PDF व JPG (4×6 और A4) बनाएं।',
    specs: '35×45 mm · 300 DPI · PDF/JPG',
    path: '/online-tools/passport-photo-maker',
    accentBg: 'bg-[#BA0000]',
    iconName: 'camera'
  },
  {
    id: 'aadhaar-print',
    category: 'aadhaar-print',
    categoryLabelEn: 'Aadhaar Print',
    titleHindi: 'आधार कार्ड A4 / स्मार्ट कार्ड प्रिंट मेकर',
    titleEn: 'Aadhaar Print Tool',
    descriptionHindi:
      'अपने आधार कार्ड के फ्रंट व बैक फोटो को सटीक स्मार्ट कार्ड साइज (85.6 × 54 mm) में सेट कर A4 प्रिंट-रेडी PDF या JPG तैयार करें।',
    specs: '85.6×54 mm · A4 PDF/JPG',
    path: '/online-tools/aadhaar-print',
    accentBg: 'bg-[#001F3F]',
    iconName: 'credit-card'
  },
  {
    id: 'age-calculator',
    category: 'age-calculator',
    categoryLabelEn: 'Age Calculator',
    titleHindi: 'सरकारी भर्ती आयु कैलकुलेटर',
    titleEn: 'Govt Job Age Calculator',
    descriptionHindi:
      'MPESB, MPPSC, SSC व रेलवे की कट-ऑफ तिथि के अनुसार वर्ष, माह, दिन में सटीक आयु और श्रेणीवार आयु छूट पात्रता जाँचें।',
    specs: 'वर्ष/माह/दिन · आयु छूट जाँच',
    path: '/online-tools/age-calculator',
    accentBg: 'bg-emerald-700',
    iconName: 'calendar'
  },
  {
    id: 'image-compressor',
    category: 'image-tools',
    categoryLabelEn: 'Image Tools',
    titleHindi: 'फोटो रिसाइज़र एवं KB कंप्रेसर',
    titleEn: 'Image Resizer & KB Compressor',
    descriptionHindi:
      'सरकारी ऑनलाइन फॉर्म के लिए फोटो को सटीक KB (20 KB, 50 KB, 100 KB) और पिक्सेल/सेंटीमीटर साइज में तुरंत बदलें।',
    specs: '20–200 KB · JPG/PNG',
    path: '/online-tools/image-compressor',
    accentBg: 'bg-blue-700',
    iconName: 'minimize'
  },
  {
    id: 'signature-cleaner',
    category: 'image-tools',
    categoryLabelEn: 'Image Tools',
    titleHindi: 'हस्ताक्षर (Signature) क्लीनर व साइज टूल',
    titleEn: 'Signature Background Cleaner',
    descriptionHindi:
      'सफेद कागज़ पर किए गए हस्ताक्षर की फोटो से ग्रे बैकग्राउंड हटाकर साफ़ ब्लैक-ऑन-व्हाइट डिजिटल सिग्नेचर तैयार करें।',
    specs: 'क्रॉप · क्लीन व्हाइट · <50 KB',
    path: '/online-tools/signature-cleaner',
    accentBg: 'bg-indigo-700',
    iconName: 'pen-tool'
  },
  {
    id: 'image-to-pdf',
    category: 'pdf-tools',
    categoryLabelEn: 'PDF Tools',
    titleHindi: 'इमेज से PDF कन्वर्टर (JPG/PNG to PDF)',
    titleEn: 'Image to PDF Converter',
    descriptionHindi:
      'मार्कशीट, जाति/निवास प्रमाण पत्र व दस्तावेज़ों की फोटो को क्रम से जोड़कर 1 क्लिक में मल्टी-पेज A4 PDF बनाएं।',
    specs: 'A4 मल्टी-पेज · ऑफलाइन PDF',
    path: '/online-tools/image-to-pdf',
    accentBg: 'bg-amber-600',
    iconName: 'file-image'
  },
  {
    id: 'pdf-merger',
    category: 'pdf-tools',
    categoryLabelEn: 'PDF Tools',
    titleHindi: 'PDF मर्जर (कई PDF फाइलें जोड़ें)',
    titleEn: 'PDF Merger',
    descriptionHindi:
      'आवेदन के लिए अलग-अलग PDF फाइलों (अंकसूची, प्रमाण पत्र आदि) को अपने ब्राउज़र में सुरक्षित रूप से एक PDF में मर्ज करें।',
    specs: 'मल्टी-PDF · 100% लोकल',
    path: '/online-tools/pdf-merger',
    accentBg: 'bg-rose-700',
    iconName: 'files'
  },
  {
    id: 'govt-form-tools',
    category: 'govt-form-tools',
    categoryLabelEn: 'Government Form Tools',
    titleHindi: 'सरकारी फॉर्म दस्तावेज़ चेकलिस्ट व प्रोफाइल गाइड',
    titleEn: 'MP Govt Form Helper',
    descriptionHindi:
      'MPESB प्रोफाइल पंजीयन, रोजगार पंजीयन, समग्र ई-KYC और लाड़ली बहना/भर्ती आवेदन के आवश्यक दस्तावेज़ व साइज चेकलिस्ट।',
    specs: 'MPESB · MPPSC · योजना फॉर्म',
    path: '/online-tools/govt-form-tools',
    accentBg: 'bg-teal-700',
    iconName: 'clipboard-check'
  }
];
