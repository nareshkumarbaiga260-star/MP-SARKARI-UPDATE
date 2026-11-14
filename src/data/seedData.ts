import { Post } from '../types';

export const INITIAL_GOVT_POSTS: Omit<Post, 'id'>[] = [
  {
    title: 'MP पुलिस आरक्षक (GD & रेडियो) भर्ती 2026 - 7500 पदों पर ऑनलाइन आवेदन प्रारंभ',
    category: 'latest-jobs',
    department: 'मध्य प्रदेश पुलिस मुख्यालय (MP Police / MPESB)',
    shortDescription: 'मध्य प्रदेश कर्मचारी चयन मंडल (MPESB) द्वारा पुलिस आरक्षक (जीडी व विशेष सशस्त्र बल) के 7,500 पदों पर सीधी भर्ती हेतु आधिकारिक अधिसूचना जारी।',
    fullDescription: `मध्य प्रदेश पुलिस मुख्यालय, भोपाल द्वारा आरक्षक (जीडी) और आरक्षक (रेडियो ऑपरेटर) के कुल 7,500 रिक्त पदों पर भर्ती के लिए योग्य एवं इच्छुक उम्मीदवारों से ऑनलाइन आवेदन आमंत्रित किए जाते हैं।

### महत्वपूर्ण बिंदु:
1. **पद नाम:** पुलिस आरक्षक (जनरल ड्यूटी) एवं रेडियो ऑपरेटर
2. **शारीरिक दक्षता परीक्षा:** 800 मीटर दौड़, लंबी कूद एवं गोला फेंक के अंक मेरिट सूची में जोड़े जाएंगे।
3. **आरक्षण:** मध्य प्रदेश के मूल निवासी महिला अभ्यर्थियों हेतु 33% क्षैतिज आरक्षण एवं भूतपूर्व सैनिकों हेतु विशेष प्रावधान।

### आवेदन प्रक्रिया:
- उम्मीदवार MPOnline पोर्टल (esb.mponline.gov.in) पर जाकर अपना प्रोफाइल पंजीयन (PEB Profile) अपडेट करें।
- सभी आवश्यक दस्तावेज़ जैसे 10वीं/12वीं अंकसूची, आधार कार्ड, मूल निवासी प्रमाण पत्र, जाति प्रमाण पत्र व रोजगार पंजीयन संलग्न करें।
- निर्धारित परीक्षा शुल्क का ऑनलाइन भुगतान कर पावती सुरक्षित रखें।`,
    totalVacancies: '7,500 पद',
    qualification: '10वीं / 12वीं पास (SC/ST हेतु 8वीं पास)',
    ageLimit: '18 से 36 वर्ष (मध्य प्रदेश के आरक्षित वर्गों हेतु नियमानुसार 5 वर्ष की छूट)',
    startDate: '10-02-2026',
    lastDate: '10-03-2026',
    examDate: '25-05-2026 से प्रारंभ',
    applicationFee: 'अनारक्षित (General): ₹500/-, SC/ST/OBC/EWS (केवल MP के मूल निवासी): ₹250/- (+ पोर्टल शुल्क)',
    applyOnlineUrl: 'https://esb.mponline.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/Rulebooks/RB_2026/Police_Constable_2026_Rulebook.pdf',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'police',
    isFeatured: true,
    isUrgent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मुख्यमंत्री लाड़ली बहना योजना 2026 - ₹1500 मासिक सहायता एवं नवीन पंजीयन दिशा-निर्देश',
    category: 'mp-schemes',
    department: 'महिला एवं बाल विकास विभाग MP',
    shortDescription: 'मध्य प्रदेश सरकार द्वारा प्रदेश की पात्र विवाहित, विधवा, तलाकशुदा एवं परित्यक्ता बहनों के बैंक खाते में DBT के माध्यम से ₹1500 प्रति माह अंतरित।',
    fullDescription: `मध्य प्रदेश शासन की महत्वाकांक्षी 'मुख्यमंत्री लाड़ली बहना योजना' के अंतर्गत प्रदेश की आर्थिक रूप से कमजोर एवं मध्यम वर्गीय परिवारों की महिलाओं को सामाजिक सुरक्षा एवं पोषण स्तर में सुधार हेतु निरंतर मासिक आर्थिक सहायता प्रदान की जा रही है।

### प्रमुख लाभ एवं विशेषताएं:
- प्रति माह ₹1,500 की राशि सीधे आधार लिंक डीबीटी बैंक खाते में जमा होती है।
- वर्ष में कुल ₹18,000 की वित्तीय सहायता।
- सामाजिक सुरक्षा पेंशन प्राप्त कर रही बहनों को अंतर राशि का भुगतान।

### आवश्यक पात्रता शर्तें:
1. मध्य प्रदेश की स्थानीय निवासी हों।
2. आयु 21 से 60 वर्ष के मध्य होनी चाहिए।
3. परिवार की वार्षिक आय ₹2.5 लाख से अधिक न हो।
4. परिवार का कोई सदस्य आयकर दाता न हो।

### आवेदन हेतु आवश्यक दस्तावेज:
- समग्र परिवार आईडी एवं सदस्य समग्र आईडी (e-KYC पूर्ण)।
- व्यक्तिगत बैंक खाता (संयुक्त खाता मान्य नहीं)।
- आधार कार्ड बैंक खाते से डीबीटी (DBT) सक्रिय होना अनिवार्य है।`,
    totalVacancies: 'प्रदेश की समस्त पात्र बहनें',
    qualification: '21 से 60 वर्ष आयु वर्ग की पात्र महिलाएं',
    ageLimit: '21 से 60 वर्ष',
    startDate: 'सतत जारी (Continuous)',
    lastDate: 'मासिक किस्त प्रत्येक माह की 10 तारीख को',
    examDate: 'लागू नहीं (Direct Benefit Transfer)',
    applicationFee: 'निःशुल्क (ग्राम पंचायत / वार्ड कार्यालय स्तर पर)',
    applyOnlineUrl: 'https://cmladlibahna.mp.gov.in',
    notificationPdfUrl: 'https://cmladlibahna.mp.gov.in/guidelines.pdf',
    officialWebsiteUrl: 'https://cmladlibahna.mp.gov.in',
    thumbnailUrl: 'scheme',
    isFeatured: true,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'MPPSC राज्य सेवा परीक्षा (State Services Exam 2026) - डिप्टी कलेक्टर व डीएसपी पदों की विज्ञप्ति',
    category: 'latest-jobs',
    department: 'MPPSC (मध्य प्रदेश लोक सेवा आयोग, इंदौर)',
    shortDescription: 'मध्य प्रदेश लोक सेवा आयोग (MPPSC) द्वारा राज्य प्रशासनिक सेवा, राज्य पुलिस सेवा सहित विभिन्न पदों हेतु अधिसूचना जारी।',
    fullDescription: `मध्य प्रदेश लोक सेवा आयोग, रेसीडेंसी एरिया, इंदौर द्वारा राज्य सेवा परीक्षा 2026 के माध्यम से मध्य प्रदेश शासन के विभिन्न विभागों के द्वितीय एवं तृतीय श्रेणी कार्यपालिक पदों पर चयन हेतु विज्ञापन जारी किया गया है।

### प्रमुख पद विवरण:
- राज्य प्रशासनिक सेवा (डिप्टी कलेक्टर)
- राज्य पुलिस सेवा (उप पुलिस अधीक्षक - DSP)
- मुख्य नगर पालिका अधिकारी (CMO)
- नायब तहसीलदार एवं वाणिज्यिक कर निरीक्षक

### परीक्षा योजना:
1. **प्रारंभिक परीक्षा (Prelims):** वस्तुनिष्ठ प्रकार के दो प्रश्न पत्र (सामान्य अध्ययन एवं सामान्य अभिरुचि परीक्षण)।
2. **मुख्य परीक्षा (Mains):** वर्णनात्मक 6 प्रश्न पत्र।
3. **साक्षात्कार (Interview):** 175 अंक।`,
    totalVacancies: '320+ पद',
    qualification: 'किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक डिग्री (Graduation)',
    ageLimit: '21 से 40 वर्ष (वर्दीधारी पदों हेतु 33 वर्ष + MP आरक्षित छूट)',
    startDate: '18-01-2026',
    lastDate: '18-02-2026',
    examDate: '28-06-2026 (Preliminary Exam)',
    applicationFee: 'सामान्य वर्ग: ₹500/-, MP आरक्षित वर्ग: ₹250/- (+ ₹40 पोर्टल शुल्क)',
    applyOnlineUrl: 'https://mppsc.mp.gov.in',
    notificationPdfUrl: 'https://mppsc.mp.gov.in/SSE_2026_Advt.pdf',
    officialWebsiteUrl: 'https://mppsc.mp.gov.in',
    thumbnailUrl: 'mppsc',
    isFeatured: true,
    isUrgent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मध्य प्रदेश पटवारी एवं राजस्व निरीक्षक भर्ती 2026 - पात्रता, नियम पुस्तिका व सिलेबस',
    category: 'latest-jobs',
    department: 'राजस्व विभाग मध्य प्रदेश (MP Patwari)',
    shortDescription: 'मध्य प्रदेश के 55 जिलों में पटवारी के रिक्त पदों पर भर्ती हेतु कर्मचारी चयन मंडल द्वारा प्रस्तावित संयुक्त भर्ती परीक्षा।',
    fullDescription: `मध्य प्रदेश भू-अभिलेख एवं राजस्व विभाग द्वारा प्रदेश के विभिन्न जिलों में रिक्त पटवारी पदों की पूर्ति हेतु संयुक्त भर्ती परीक्षा नियम पुस्तिका का प्रारूप जारी किया गया है।

### अनिवार्य शैक्षणिक अर्हता:
- किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation)।
- सीपीसीटी (CPCT) स्कोर कार्ड हिंदी टाइपिंग एवं कंप्यूटर दक्षता सहित उत्तीर्ण होना आवश्यक (चयन उपरांत 3 वर्ष की शिथिलता के प्रावधान के साथ)।
- मध्य प्रदेश राज्य के रोजगार कार्यालय में जीवित पंजीयन होना अनिवार्य।

### परीक्षा का पाठ्यक्रम (कुल 200 अंक):
- सामान्य विज्ञान, सामान्य हिंदी, सामान्य अंग्रेजी, सामान्य गणित (100 अंक)
- सामान्य ज्ञान एवं अभिरुचि, सामान्य कंप्यूटर ज्ञान, सामान्य तार्किक योग्यता एवं सामान्य प्रबंधन (100 अंक)`,
    totalVacancies: '3,800 संभावित पद',
    qualification: 'स्नातक (Graduation) + CPCT स्कोर कार्ड',
    ageLimit: '18 से 40 वर्ष (MP मूल निवासी छूट नियमानुसार)',
    startDate: 'शीघ्र प्रारंभ (मार्च 2026)',
    lastDate: 'विस्तृत विज्ञापन अनुसार',
    examDate: 'जुलाई 2026',
    applicationFee: 'अनारक्षित: ₹500/-, आरक्षित: ₹250/-',
    applyOnlineUrl: 'https://esb.mponline.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/Patwari_Rulebook.pdf',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'revenue',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मुख्यमंत्री सीखो कमाओ योजना (MMSKY) - ₹8000 से ₹10000 स्टाइपेंड के साथ कौशल प्रशिक्षण',
    category: 'mp-schemes',
    department: 'तकनीकी शिक्षा, कौशल विकास एवं रोजगार विभाग MP',
    shortDescription: 'प्रदेश के 18 से 29 वर्ष के युवाओं को औद्योगिक एवं व्यावसायिक प्रतिष्ठानों में ऑन-द-जॉब ट्रेनिंग (OJT) के साथ प्रतिमाह स्टाइपेंड।',
    fullDescription: `मध्य प्रदेश शासन द्वारा युवाओं को रोजगार के नए अवसर एवं व्यावसायिक कौशल प्रदान करने के उद्देश्य से 'मुख्यमंत्री सीखो कमाओ योजना' संचालित की जा रही है।

### शैक्षणिक योग्यता अनुसार मासिक स्टाइपेंड:
- **12वीं उत्तीर्ण:** ₹8,000 प्रति माह
- **आईटीआई उत्तीर्ण:** ₹8,500 प्रति माह
- **डिप्लोमा धारक:** ₹9,000 प्रति माह
- **स्नातक अथवा उच्च शिक्षा:** ₹10,000 प्रति माह

### योजना की प्रमुख विशेषताएं:
- प्रशिक्षण की अवधि 1 वर्ष रहेगी।
- 75% राशि शासन द्वारा DBT से सीधे छात्र के खाते में और 25% संबंधित प्रतिष्ठान द्वारा देय होगी।
- प्रशिक्षण पूर्ण होने पर SCVT / NCVT अधिकृत प्रमाण पत्र प्राप्त होगा।`,
    totalVacancies: '1 लाख+ प्रशिक्षण सीटें',
    qualification: '12वीं / ITI / डिप्लोमा / स्नातक पास युवा',
    ageLimit: '18 से 29 वर्ष',
    startDate: 'पोर्टल पर पंजीयन खुला है',
    lastDate: 'निरंतर (Continuous Registration)',
    examDate: 'कोई परीक्षा नहीं (मेरिट व साक्षात्कार आधार)',
    applicationFee: 'पूर्णतः निःशुल्क (100% Free)',
    applyOnlineUrl: 'https://mmsky.mp.gov.in',
    notificationPdfUrl: 'https://mmsky.mp.gov.in/guidelines.pdf',
    officialWebsiteUrl: 'https://mmsky.mp.gov.in',
    thumbnailUrl: 'skill',
    isFeatured: true,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'संबल 2.0 योजना (Mukhyamantri Sambal Yojana) - असंगठित श्रमिकों के लिए पंजीयन व लाभ',
    category: 'mp-schemes',
    department: 'श्रम विभाग मध्य प्रदेश शासन',
    shortDescription: 'मध्य प्रदेश के असंगठित क्षेत्र के श्रमिकों एवं उनके परिवारों को जन्म से लेकर मृत्यु तक विभिन्न सामाजिक सुरक्षा योजनाओं का कवच।',
    fullDescription: `मध्य प्रदेश श्रम विभाग द्वारा संचालित 'मुख्यमंत्री जन कल्याण (संबल 2.0) योजना' असंगठित क्षेत्र के लाखों श्रमिकों को सुरक्षा और सहायता प्रदान करने वाला महत्वाकांक्षी कार्यक्रम है।

### संबल कार्ड के प्रमुख लाभ:
1. **अनुग्रह सहायता:** सामान्य मृत्यु पर ₹2 लाख, दुर्घटना में मृत्यु पर ₹4 लाख।
2. **प्रसूति सहायता:** महिला श्रमिक को प्रसव पूर्व एवं पश्चात ₹16,000 की आर्थिक मदद।
3. **शिक्षा प्रोत्साहन:** संबल कार्डधारी के बच्चों को उच्च शिक्षा एवं कॉलेज फीस की पूर्ण प्रतिपूर्ति।
4. **बिजली बिल माफी एवं सरल बिजली योजना:** न्यूनतम दरों पर घरेलू विद्युत कनेक्शन।

### आवेदन प्रक्रिया:
संबल पोर्टल (sambal.mp.gov.in) पर जाकर अपनी समग्र आईडी व आधार ई-केवाईसी के माध्यम से ऑनलाइन पंजीयन करें।`,
    totalVacancies: 'असंगठित क्षेत्र के समस्त श्रमिक',
    qualification: 'मध्य प्रदेश के असंगठित श्रमिक (आयु 18-60 वर्ष)',
    ageLimit: '18 से 60 वर्ष',
    startDate: 'पंजीयन निरंतर चालू',
    lastDate: 'कोई अंतिम तिथि नहीं',
    examDate: 'लागू नहीं',
    applicationFee: 'निःशुल्क (Free Online Registration)',
    applyOnlineUrl: 'https://sambal.mp.gov.in',
    notificationPdfUrl: 'https://sambal.mp.gov.in/Sambal2_Manual.pdf',
    officialWebsiteUrl: 'https://sambal.mp.gov.in',
    thumbnailUrl: 'sambal',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'प्रधानमंत्री किसान सम्मान निधि (PM Kisan 19वीं किस्त) - ई-केवाईसी व लाभार्थी स्थिति जांचें',
    category: 'central-schemes',
    department: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार',
    shortDescription: 'देश के समस्त पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष वित्तीय सहायता तीन समान किस्तों (₹2,000 प्रत्येक) में DBT द्वारा।',
    fullDescription: `केंद्र सरकार द्वारा संचालित 'पीएम किसान सम्मान निधि योजना' के तहत सभी पात्र भूमिधारक किसान परिवारों को आय सहायता प्रदान की जाती है।

### किस्त प्राप्त करने के 3 अनिवार्य नियम:
1. **e-KYC पूर्ण होना:** पीएम किसान पोर्टल पर OTP आधारित अथवा CSC केंद्र पर बायोमेट्रिक ई-केवाईसी अनिवार्य है।
2. **भू-अभिलेख अंकन (Land Seeding):** किसान की कृषि भूमि का ब्योरा राज्य के राजस्व रिकॉर्ड में सत्यापित होना चाहिए।
3. **बैंक आधार सीडिंग:** बैंक खाता आधार कार्ड से लिंक और डीबीटी सक्षम होना चाहिए।

### स्टेटस कैसे चेक करें:
आधिकारिक वेबसाइट pmkisan.gov.in पर 'Know Your Status' विकल्प पर क्लिक कर अपना पंजीयन नंबर दर्ज करें।`,
    totalVacancies: 'देश के सभी पात्र कृषक',
    qualification: 'कृषि भूमि स्वामी पात्र किसान',
    ageLimit: '18 वर्ष से ऊपर',
    startDate: 'सतत योजना',
    lastDate: 'अगली किस्त शीघ्र जारी होगी',
    examDate: 'लागू नहीं',
    applicationFee: 'पोर्टल पर स्वयं ई-केवाईसी निःशुल्क',
    applyOnlineUrl: 'https://pmkisan.gov.in',
    notificationPdfUrl: 'https://pmkisan.gov.in/Documents/Guidelines.pdf',
    officialWebsiteUrl: 'https://pmkisan.gov.in',
    thumbnailUrl: 'central',
    isFeatured: true,
    isUrgent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'MPESB प्राथमिक शिक्षक पात्रता परीक्षा (MP Primary TET) - प्रवेश पत्र (Admit Card) जारी',
    category: 'admit-card',
    department: 'मध्य प्रदेश कर्मचारी चयन मंडल (MPESB, Bhopal)',
    shortDescription: 'मध्य प्रदेश प्राथमिक शाला शिक्षक पात्रता परीक्षा वर्ग-3 के एडमिट कार्ड आधिकारिक वेबसाइट पर उपलब्ध। तुरंत डाउनलोड करें।',
    fullDescription: `मध्य प्रदेश कर्मचारी चयन मंडल (MPESB), भोपाल द्वारा प्राथमिक शिक्षक पात्रता परीक्षा (Primary School Teacher Eligibility Test) के प्रवेश पत्र जारी कर दिए गए हैं।

### एडमिट कार्ड डाउनलोड करने के निर्देश:
1. मंडल की वेबसाइट esb.mp.gov.in पर जाएँ।
2. "Test Admit Card - Primary School Teacher Eligibility Test" लिंक पर क्लिक करें।
3. अपना 13 अंकों का आवेदन क्रमांक (Application No.) एवं जन्मतिथि (DD/MM/YYYY) प्रविष्ट करें।
4. माता के नाम के प्रथम 2 अक्षर + आधार कार्ड के अंतिम 4 अंक दर्ज कर कैप्चा हल करें।

### परीक्षा केंद्र पर ले जाने हेतु आवश्यक दस्तावेज:
- मूल फोटोयुक्त पहचान पत्र (आधार कार्ड, ई-आधार मान्य)।
- प्रवेश पत्र का स्पष्ट प्रिंटआउट एवं एक पासपोर्ट साइज फोटो।`,
    totalVacancies: 'पात्रता परीक्षा (TET)',
    qualification: 'D.El.Ed / B.Ed अर्हताधारी अभ्यर्थी',
    ageLimit: 'न्यूनतम 21 वर्ष',
    startDate: 'प्रवेश पत्र डाउनलोड उपलब्ध',
    lastDate: 'परीक्षा तिथि तक',
    examDate: '15 मार्च 2026 से दो पालियों में',
    applicationFee: 'डाउनलोड हेतु कोई शुल्क नहीं',
    applyOnlineUrl: 'https://esb.mp.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/TET_Instructions.pdf',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'admit',
    isFeatured: false,
    isUrgent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'MPPSC राज्य वन सेवा परीक्षा (State Forest Service) - अंतिम परीक्षा परिणाम (Final Result) घोषित',
    category: 'results',
    department: 'MPPSC (मध्य प्रदेश लोक सेवा आयोग)',
    shortDescription: 'मध्य प्रदेश लोक सेवा आयोग ने सहायक वन संरक्षक (ACF) एवं वन क्षेत्रपाल (Forest Ranger) का अंतिम चयन परिणाम जारी किया।',
    fullDescription: `मध्य प्रदेश लोक सेवा आयोग, इंदौर द्वारा राज्य वन सेवा परीक्षा के अंतर्गत मुख्य परीक्षा एवं साक्षात्कार के प्राप्तांकों के आधार पर अंतिम चयन सूची एवं प्राप्तांक जारी कर दिए गए हैं।

### चयन सूची देखने की प्रक्रिया:
- आयोग की अधिकृत वेबसाइट mppsc.mp.gov.in पर जाएं।
- 'Results' टैब में "Selection List - State Forest Service Examination" पर क्लिक करें।
- पीडीएफ में अनुक्रमांक (Roll Number) अनुसार चयनित उम्मीदवारों का विवरण एवं कट-ऑफ अंक देखें।`,
    totalVacancies: '140 पद',
    qualification: 'विज्ञान / इंजीनियरिंग स्नातक',
    ageLimit: '21 से 40 वर्ष',
    startDate: 'रिजल्ट घोषित',
    lastDate: 'डाउनलोड हेतु उपलब्ध',
    examDate: 'सफलतापूर्वक संपन्न',
    applicationFee: 'निःशुल्क',
    applyOnlineUrl: 'https://mppsc.mp.gov.in',
    notificationPdfUrl: 'https://mppsc.mp.gov.in/Results/SFS_Final_Result.pdf',
    officialWebsiteUrl: 'https://mppsc.mp.gov.in',
    thumbnailUrl: 'result',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'MPESB समूह-4 सहायक ग्रेड-3 एवं स्टेनो टाइपिस्ट परीक्षा - मॉडल उत्तर कुंजी (Answer Key) जारी',
    category: 'answer-key',
    department: 'MPESB (मध्य प्रदेश कर्मचारी चयन मंडल)',
    shortDescription: 'ग्रुप-4 संयुक्त भर्ती परीक्षा की आधिकारिक मॉडल आंसर की जारी। प्रश्नों पर आपत्ति दर्ज कराने का अवसर।',
    fullDescription: `मध्य प्रदेश कर्मचारी चयन मंडल, भोपाल द्वारा आयोजित समूह-4, सहायक ग्रेड-3, स्टेनो टाइपिस्ट, शीघ्रलेखक एवं अन्य समकक्ष पदों की संयुक्त भर्ती परीक्षा की ऑनलाइन प्रश्न-उत्तर आक्षेप (Answer Key Objection) लिंक सक्रिय की गई है।

### आपत्ति दर्ज करने के नियम:
- प्रति प्रश्न आपत्ति शुल्क ₹50/- निर्धारित है।
- आपत्ति केवल ऑनलाइन पोर्टल के माध्यम से प्रामाणिक संदर्भ (Books/Sources) के साथ ही मान्य होगी।
- अंतिम तिथि के पश्चात कोई भी अभ्यावेदन स्वीकार नहीं किया जाएगा।`,
    totalVacancies: '3,047 पद',
    qualification: '12वीं + CPCT + कंप्यूटर डिप्लोमा',
    ageLimit: '18 से 40 वर्ष',
    startDate: 'उत्तर कुंजी सक्रिय',
    lastDate: 'आपत्ति दर्ज करने की अंतिम तिथि: 25-02-2026',
    examDate: 'परीक्षा संपन्न',
    applicationFee: 'प्रति प्रश्न आपत्ति शुल्क: ₹50/-',
    applyOnlineUrl: 'https://esb.mp.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/AnsKey_Group4_Notice.pdf',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'anskey',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मध्य प्रदेश वनरक्षक एवं क्षेत्ररक्षक भर्ती परीक्षा - नवीनतम विस्तृत पाठ्यक्रम व परीक्षा पैटर्न',
    category: 'syllabus',
    department: 'मध्य प्रदेश वन विभाग (MP Forest / MPESB)',
    shortDescription: 'वनरक्षक, क्षेत्ररक्षक एवं जेल प्रहरी परीक्षा हेतु 100 अंकों का विषयवार पाठ्यक्रम, अंक विभाजन एवं शारीरिक मापदंड।',
    fullDescription: `मध्य प्रदेश वन विभाग द्वारा वनरक्षक पदों की लिखित परीक्षा के लिए निर्धारित पाठ्यक्रम इस प्रकार है:

### प्रश्न पत्र संरचना (समय: 2 घंटे):
1. **सामान्य ज्ञान (General Knowledge):** 20 अंक - म.प्र. का इतिहास, भूगोल, संस्कृति, प्रमुख व्यक्तित्व व समसामयिकी।
2. **सामान्य हिंदी (General Hindi):** 20 अंक - व्याकरण, पर्यायवाची, विलोम, संधि, समास, मुहावरे।
3. **सामान्य अंग्रेजी (General English):** 20 अंक - बेसिक ग्रामर, वोकैबुलरी, एरर करेक्शन।
4. **सामान्य गणित (Mathematics):** 20 अंक - अंकगणित, बीजगणित, ज्यामिति, समय-दूरी, प्रतिशत।
5. **सामान्य विज्ञान (General Science):** 20 अंक - 10वीं स्तर की भौतिक, रसायन एवं जीव विज्ञान।

### शारीरिक मापदंड:
- पुरुष अभ्यर्थी: ऊंचाई न्यूनतम 163 सेमी, सीना 79 सेमी (फुलाव 5 सेमी)।
- महिला अभ्यर्थी: ऊंचाई न्यूनतम 150 सेमी।
- पैदल चाल: पुरुष 4 घंटे में 25 किमी, महिला 4 घंटे में 14 किमी।`,
    totalVacancies: '2,112 पद',
    qualification: '10वीं (हाई स्कूल) उत्तीर्ण',
    ageLimit: '18 से 33 वर्ष (+5 वर्ष MP छूट)',
    startDate: 'अधिसूचना अनुसार',
    lastDate: 'जल्द घोषित',
    examDate: 'आगामी सत्र',
    applicationFee: 'विज्ञप्ति अनुसार',
    applyOnlineUrl: 'https://esb.mponline.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/Forest_Syllabus.pdf',
    officialWebsiteUrl: 'https://esb.mp.gov.in',
    thumbnailUrl: 'syllabus',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'MP ऑनलाइन पोर्टल प्रोफाइल पंजीयन एवं e-KYC कैसे करें - स्टेप बाय स्टेप गाइड',
    category: 'application-guide',
    department: 'MPOnline Limited (मध्य प्रदेश शासन)',
    shortDescription: 'व्यापमं (MPESB) की किसी भी परीक्षा में आवेदन करने से पहले उम्मीदवार प्रोफाइल पंजीयन व आधार सत्यापन की आसान विधि।',
    fullDescription: `मध्य प्रदेश में कर्मचारी चयन मंडल (ESB) की किसी भी सरकारी नौकरी में आवेदन करने हेतु उम्मीदवार प्रोफाइल (Candidate Profile) पंजीयन अनिवार्य है।

### प्रोफाइल पंजीयन के 5 मुख्य चरण:
1. **वेबसाइट विजिट:** esb.mponline.gov.in पर जाएं और 'उम्मीदवार प्रोफाइलिंग' लिंक चुनें।
2. **मोबाइल व ईमेल ओटीपी सत्यापन:** अपने चालू मोबाइल नंबर पर प्राप्त ओटीपी दर्ज करें।
3. **आधार ई-केवाईसी:** बायोमेट्रिक फिंगरप्रिंट अथवा आधार से जुड़े मोबाइल नंबर पर प्राप्त ओटीपी से सत्यापन करें।
4. **व्यक्तिगत व शैक्षणिक विवरण:** 10वीं की अंकसूची अनुसार नाम, माता-पिता का नाम, जन्मतिथि व जाति वर्ग भरें।
5. **हस्ताक्षर व फोटो टेम्प्लेट अपलोड:** निर्धारित प्रारूप में श्वेत पृष्ठभूमि वाली फोटो (जिस पर नाम व फोटो खिंचवाने की तिथि अंकित हो) एवं हस्ताक्षर स्कैन कर अपलोड करें।`,
    totalVacancies: 'समस्त MP अभ्यर्थी',
    qualification: 'सभी उम्मीदवारों हेतु अनिवार्य',
    ageLimit: 'लागू नहीं',
    startDate: 'सेवा सदैव उपलब्ध',
    lastDate: 'आवेदन से पूर्व पंजीयन आवश्यक',
    examDate: 'लागू नहीं',
    applicationFee: 'नागरिक द्वारा स्वयं करने पर निःशुल्क',
    applyOnlineUrl: 'https://esb.mponline.gov.in',
    notificationPdfUrl: 'https://esb.mp.gov.in/Profile_Registration_Guide.pdf',
    officialWebsiteUrl: 'https://mponline.gov.in',
    thumbnailUrl: 'guide',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मध्य प्रदेश सामान्य प्रशासन विभाग (GAD) - भर्ती परीक्षाओं में आयु सीमा छूट आदेश 2026',
    category: 'govt-updates',
    department: 'सामान्य प्रशासन विभाग (GAD), मध्य प्रदेश शासन',
    shortDescription: 'मध्य प्रदेश के मूल निवासी युवाओं को राज्य स्तरीय सीधी भर्ती परीक्षाओं में अधिकतम आयु सीमा में 3 वर्ष की अतिरिक्त छूट का शासकीय आदेश।',
    fullDescription: `मध्य प्रदेश शासन, सामान्य प्रशासन विभाग (GAD), मंत्रालय, वल्लभ भवन, भोपाल द्वारा जारी परिपत्र के अनुसार:

प्रदेश के बेरोजगार युवाओं के हित में राज्य सेवा एवं राज्य स्तरीय सीधी भर्ती के तृतीय व चतुर्थ श्रेणी के पदों हेतु अधिकतम आयु सीमा में एकमुश्त 3 वर्ष की अतिरिक्त शिथिलता प्रदान करने का आदेश प्रभावी किया गया है।

### महत्वपूर्ण दिशा-निर्देश:
- यह छूट केवल मध्य प्रदेश राज्य के स्थानीय मूल निवासी अभ्यर्थियों के लिए ही मान्य होगी।
- वर्दीधारी पदों (पुलिस, जेल, वन विभाग) के संबंध में संबंधित सेवा नियमों के अनुसार यथावत व्यवस्था रहेगी।
- ईडब्ल्यूएस (EWS), एससी (SC), एसटी (ST) एवं ओबीसी (OBC) वर्गों को मिलने वाली 5 वर्ष की सामान्य छूट इसके अतिरिक्त नियमानुसार लागू रहेगी।`,
    totalVacancies: 'शासकीय आदेश / परिपत्र',
    qualification: 'सभी प्रतियोगी परीक्षार्थियों पर लागू',
    ageLimit: 'अधिकतम आयु सीमा में 3 वर्ष शिथिलता',
    startDate: 'मंत्रालय आदेश प्रभावी',
    lastDate: 'आगामी भर्तियों में लागू',
    examDate: 'लागू नहीं',
    applicationFee: 'निःशुल्क',
    applyOnlineUrl: 'https://gad.mp.gov.in',
    notificationPdfUrl: 'https://gad.mp.gov.in/Orders/Age_Relaxation_Order_2026.pdf',
    officialWebsiteUrl: 'https://gad.mp.gov.in',
    thumbnailUrl: 'order',
    isFeatured: true,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मध्य प्रदेश ITI एवं पॉलीटेक्निक ऑनलाइन प्रवेश 2026 - प्रथम चरण काउंसलिंग एवं चॉइस फिलिंग',
    category: 'admission',
    department: 'तकनीकी शिक्षा एवं कौशल विकास विभाग MP (DTE MP)',
    shortDescription: 'मध्य प्रदेश के समस्त शासकीय एवं निजी आईटीआई व पॉलीटेक्निक संस्थानों में इंजीनियरिंग एवं गैर-इंजीनियरिंग ट्रेड्स में ऑनलाइन एडमिशन।',
    fullDescription: `कौशल विकास संचालनालय, मध्य प्रदेश द्वारा शैक्षणिक सत्र 2026 हेतु शासकीय एवं प्राइवेट आईटीआई में विभिन्न एनसीवीटी (NCVT) व एससीवीटी (SCVT) व्यवसायों में प्रवेश हेतु ऑनलाइन काउंसलिंग प्रक्रिया प्रारंभ की गई है।

### प्रमुख तिथियाँ व चरण:
1. ऑनलाइन पंजीयन एवं प्रोफाइल सत्यापन
2. ऐच्छिक संस्थाओं एवं व्यवसायों की प्राथमिकता (Choice Filling)
3. प्रथम चरण की मेरिट सूची एवं आवंटन पत्र (Allotment Letter)
4. संबंधित आईटीआई में मूल दस्तावेजों का सत्यापन एवं प्रवेश शुल्क जमा करना`,
    totalVacancies: '1.2 लाख+ सीटें',
    qualification: '10वीं (हाई स्कूल) उत्तीर्ण (गणित व विज्ञान विषय सहित)',
    ageLimit: 'न्यूनतम 14 वर्ष (अधिकतम आयु सीमा का कोई बंधन नहीं)',
    startDate: '15-05-2026',
    lastDate: '15-06-2026',
    examDate: '10वीं मेरिट आधार पर',
    applicationFee: 'पंजीयन शुल्क: ₹35/- (+ पोर्टल शुल्क)',
    applyOnlineUrl: 'https://iti.mponline.gov.in',
    notificationPdfUrl: 'https://iti.mponline.gov.in/Admission_Rulebook.pdf',
    officialWebsiteUrl: 'https://iti.mponline.gov.in',
    thumbnailUrl: 'admission',
    isFeatured: false,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'मुख्यमंत्री मेधावी विद्यार्थी योजना (MMVY) 2026 - उच्च शिक्षा हेतु 100% फीस प्रतिपूर्ति छात्रवृत्ति',
    category: 'scholarship',
    department: 'उच्च शिक्षा विभाग मध्य प्रदेश शासन',
    shortDescription: '12वीं में 70% (MP Board) या 85% (CBSE/ICSE) अंक प्राप्त करने वाले मेधावी विद्यार्थियों की इंजीनियरिंग, मेडिकल व स्नातक की पूरी फीस सरकार भरेगी।',
    fullDescription: `मध्य प्रदेश शासन द्वारा मेधावी विद्यार्थियों को उच्च शिक्षा के अवसरों से वंचित न होने देने के लिए 'मुख्यमंत्री मेधावी विद्यार्थी योजना' संचालित है।

### प्रमुख लाभ:
- इंजीनियरिंग (JEE Mains में रैंक 1.5 लाख तक): शासकीय व निजी कॉलेज की समस्त फीस।
- मेडिकल (NEET): शासकीय एवं निजी मेडिकल कॉलेज की पूरी एमबीबीएस फीस।
- लॉ (CLAT) एवं राष्ट्रीय संस्थानों (IIT, IIM, NLU, AIIMS): समस्त शिक्षण शुल्क।
- शासकीय कॉलेजों में बीए, बीएससी, बीकॉम, पॉलिटेक्निक की पूरी फीस।

### पात्रता:
- मध्य प्रदेश के मूल निवासी हों।
- पालक की वार्षिक आय ₹6 लाख से कम हो।
- एमपी बोर्ड में 70% या सीबीएसई/आईसीएसई में 85% या अधिक अंक।`,
    totalVacancies: 'समस्त पात्र मेधावी विद्यार्थी',
    qualification: '12वीं उत्तीर्ण (70% MP Board / 85% CBSE)',
    ageLimit: 'पात्रता अनुसार',
    startDate: 'पोर्टल खुला है',
    lastDate: 'सत्र 2026-27 के दौरान',
    examDate: 'लागू नहीं (मेरिट आधार)',
    applicationFee: 'निःशुल्क (Free Online Apply)',
    applyOnlineUrl: 'https://scholarshipportal.mp.nic.in',
    notificationPdfUrl: 'https://scholarshipportal.mp.nic.in/MMVY_Guidelines.pdf',
    officialWebsiteUrl: 'https://scholarshipportal.mp.nic.in',
    thumbnailUrl: 'scholarship',
    isFeatured: true,
    isUrgent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
