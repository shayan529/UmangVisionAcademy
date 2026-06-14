import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  ThumbsUp,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
} from 'lucide-react';

// ── Translated Rojgar Data (Government Schemes) ──────────────────────────────

const ROJGAR_EN = [
  {
    id: 1,
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY) 4.0',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    beneficiary: 'Youth aged 15–45',
    benefit: 'Free skill training + ₹8,000 reward on certification',
    deadline: 'Rolling admissions',
    status: 'active',
    link: 'https://www.skillindiadigital.gov.in/pmkvy-landing',
    tag: 'Skill Training',
    color: '#34d399',
  },
  {
    id: 2,
    name: 'National Apprenticeship Promotion Scheme (NAPS)',
    ministry: 'Ministry of Education',
    beneficiary: 'Students Class 5 pass & above',
    benefit: 'Stipend of ₹1,500–₹10,000/month + OJT certificate',
    deadline: 'Open year-round',
    status: 'active',
    link: 'https://apprenticeshipindia.gov.in',
    tag: 'Apprenticeship',
    color: '#818cf8',
  },
  {
    id: 3,
    name: 'PM SVANidhi — Street Vendor Atma Nirbhar Nidhi',
    ministry: 'Ministry of Housing & Urban Affairs',
    beneficiary: 'Street vendors',
    benefit: 'Collateral-free loan ₹10K → ₹20K → ₹50K',
    deadline: 'Open',
    status: 'active',
    link: 'https://pmsvanidhi.mohua.gov.in',
    tag: 'Self Employment',
    color: '#fbbf24',
  },
  {
    id: 4,
    name: 'Startup India Seed Fund Scheme',
    ministry: 'DPIIT, Ministry of Commerce',
    beneficiary: 'DPIIT-registered startups ≤ 2 years old',
    benefit: 'Up to ₹20 lakh grant for PoC + ₹50 lakh for commercialisation',
    deadline: 'Applications open',
    status: 'active',
    link: 'https://seedfund.startupindia.gov.in',
    tag: 'Entrepreneurship',
    color: '#f472b6',
  },
  {
    id: 5,
    name: 'Mukhya Mantri Seekho Kamao Yojana (MP)',
    ministry: 'Madhya Pradesh Govt.',
    beneficiary: 'MP youth aged 18–29, Class 12+',
    benefit: '₹8,000–₹10,000/month stipend during training',
    deadline: 'Batch enrolment ongoing',
    status: 'active',
    link: 'https://mmsky.mp.gov.in',
    tag: 'State Scheme',
    color: '#22d3ee',
  },
  {
    id: 6,
    name: 'National Career Service (NCS) Portal',
    ministry: 'Ministry of Labour & Employment',
    beneficiary: 'All job seekers',
    benefit: 'Free job matching, career counselling, skill courses',
    deadline: 'Always open',
    status: 'active',
    link: 'https://www.ncs.gov.in',
    tag: 'Job Portal',
    color: '#a78bfa',
  },
  {
    id: 7,
    name: 'PM Vishwakarma Yojana',
    ministry: 'Ministry of MSME',
    beneficiary: '18 traditional artisan categories',
    benefit:
      '₹15,000 toolkit grant + ₹3 lakh collateral-free loan at 5% interest',
    deadline: 'Open',
    status: 'active',
    link: 'https://pmvishwakarma.gov.in',
    tag: 'Artisan Support',
    color: '#34d399',
  },
  {
    id: 8,
    name: 'e-Shram Portal Registration',
    ministry: 'Ministry of Labour & Employment',
    beneficiary: 'Unorganised sector workers',
    benefit: '₹2 lakh accident insurance + priority in govt schemes',
    deadline: 'Permanent',
    status: 'active',
    link: 'https://eshram.gov.in',
    tag: 'Worker Welfare',
    color: '#fbbf24',
  },
];

const ROJGAR_HI = [
  {
    id: 1,
    name: 'प्रधानमंत्री कौशल विकास योजना (PMKVY) 4.0',
    ministry: 'कौशल विकास और उद्यमिता मंत्रालय',
    beneficiary: '15-45 वर्ष के युवा',
    benefit: 'निःशुल्क कौशल प्रशिक्षण + प्रमाणन पर ₹8,000 का पुरस्कार',
    deadline: 'सतत प्रवेश',
    status: 'active',
    link: 'https://www.skillindiadigital.gov.in/pmkvy-landing',
    tag: 'कौशल प्रशिक्षण',
    color: '#34d399',
  },
  {
    id: 2,
    name: 'राष्ट्रीय शिक्षुता संवर्धन योजना (NAPS)',
    ministry: 'शिक्षा मंत्रालय',
    beneficiary: 'कक्षा 5 उत्तीर्ण और उससे ऊपर के छात्र',
    benefit: '₹1,500–₹10,000/माह वजीफा + OJT प्रमाण पत्र',
    deadline: 'वर्ष भर खुला',
    status: 'active',
    link: 'https://apprenticeshipindia.gov.in',
    tag: 'शिक्षुता',
    color: '#818cf8',
  },
  {
    id: 3,
    name: 'पीएम स्वनिधि — स्ट्रीट वेंडर आत्मनिर्भर निधि',
    ministry: 'आवास और शहरी मामलों के मंत्रालय',
    beneficiary: 'रेहड़ी-पटरी वाले (स्ट्रीट वेंडर)',
    benefit: 'संपार्श्विक-मुक्त ऋण ₹10K → ₹20K → ₹50K',
    deadline: 'खुला है',
    status: 'active',
    link: 'https://pmsvanidhi.mohua.gov.in',
    tag: 'स्व-रोजगार',
    color: '#fbbf24',
  },
  {
    id: 4,
    name: 'स्टार्टअप इंडिया सीड फंड योजना',
    ministry: 'DPIIT, वाणिज्य और उद्योग मंत्रालय',
    beneficiary: 'DPIIT-पंजीकृत स्टार्टअप्स ≤ 2 वर्ष पुराने',
    benefit:
      'प्रूफ ऑफ कॉन्सेप्ट के लिए ₹20 लाख तक का अनुदान + व्यावसायीकरण के लिए ₹50 लाख',
    deadline: 'आवेदन खुले हैं',
    status: 'active',
    link: 'https://seedfund.startupindia.gov.in',
    tag: 'उद्यमिता',
    color: '#f472b6',
  },
  {
    id: 5,
    name: 'मुख्यमंत्री सीखो कमाओ योजना (MP)',
    ministry: 'मध्य प्रदेश सरकार',
    beneficiary: '18-29 वर्ष के एमपी के युवा, कक्षा 12वीं उत्तीर्ण+',
    benefit: 'प्रशिक्षण के दौरान ₹8,000–₹10,000/माह वजीफा',
    deadline: 'बैच नामांकन जारी',
    status: 'active',
    link: 'https://mmsky.mp.gov.in',
    tag: 'राज्य योजना',
    color: '#22d3ee',
  },
  {
    id: 6,
    name: 'राष्ट्रीय करियर सेवा (NCS) पोर्टल',
    ministry: 'श्रम और रोजगार मंत्रालय',
    beneficiary: 'सभी नौकरी चाहने वाले',
    benefit: 'निःशुल्क जॉब मैचिंग, करियर परामर्श, कौशल पाठ्यक्रम',
    deadline: 'हमेशा खुला',
    status: 'active',
    link: 'https://www.ncs.gov.in',
    tag: 'जॉब पोर्टल',
    color: '#a78bfa',
  },
  {
    id: 7,
    name: 'पीएम विश्वकर्मा योजना',
    ministry: 'एमएसएमई मंत्रालय',
    beneficiary: '18 पारंपरिक कारीगर श्रेणियां',
    benefit: '₹15,000 टूलकिट अनुदान + 5% ब्याज पर ₹3 लाख संपार्श्विक-मुक्त ऋण',
    deadline: 'खुला है',
    status: 'active',
    link: 'https://pmvishwakarma.gov.in',
    tag: 'कारीगर सहायता',
    color: '#34d399',
  },
  {
    id: 8,
    name: 'ई-श्रम पोर्टल पंजीकरण',
    ministry: 'श्रम और रोजगार मंत्रालय',
    beneficiary: 'असंगठित क्षेत्र के श्रमिक',
    benefit: '₹2 लाख का दुर्घटना बीमा + सरकारी योजनाओं में प्राथमिकता',
    deadline: 'स्थायी',
    status: 'active',
    link: 'https://eshram.gov.in',
    tag: 'श्रमिक कल्याण',
    color: '#fbbf24',
  },
];

const ROJGAR_TAGS_EN = [
  'All',
  'Skill Training',
  'Apprenticeship',
  'Self Employment',
  'Entrepreneurship',
  'State Scheme',
  'Job Portal',
  'Artisan Support',
  'Worker Welfare',
];

const ROJGAR_TAGS_HI = [
  'सभी',
  'कौशल प्रशिक्षण',
  'शिक्षुता',
  'स्व-रोजगार',
  'उद्यमिता',
  'राज्य योजना',
  'जॉब पोर्टल',
  'कारीगर सहायता',
  'श्रमिक कल्याण',
];

const NEWS_CATEGORIES_EN = [
  'All',
  'Education',
  'Competitive Exams',
  'Policy',
  'Technology',
  'Scholarships',
];

const NEWS_CATEGORIES_HI = [
  'सभी',
  'शिक्षा',
  'प्रतियोगी परीक्षा',
  'नीति',
  'तकनीकी',
  'छात्रवृत्ति',
];

// ── English Mock Articles — url set to null (AI-curated, no real source link) ─

const MOCK_NEWS_EN = [
  {
    id: 1,
    category: 'Education',
    tag: 'CBSE',
    title: 'CBSE launches new digital library for rural students',
    excerpt:
      'CBSE has rolled out a free digital library initiative to support rural learners with interactive study material, past papers and instructional videos.',
    body: 'The Central Board of Secondary Education (CBSE) has officially announced a new digital library initiative aimed at students in rural and semi-urban regions across India. The program is designed to bridge the digital divide by providing free, offline-capable, and interactive learning resources. Under this initiative, schools in rural districts will receive pre-loaded digital storage devices and access to a central online portal featuring syllabus books, past year question papers, video tutorials, and self-assessment quizzes.\n\n"Our goal is to ensure that geography does not limit a student\'s potential," said a senior CBSE official during the launch event. The library will support learning in both English and regional languages, helping students prepare for board examinations with confidence. Over 10,000 schools are expected to benefit in the first phase of the roll-out, with plans to expand nationwide by next year.\n\nStudents will also be able to submit doubts through the portal, which will be answered by online educators. This project is being supported by the Central Ministry of Education to ensure academic resources are accessible to even the most remote schools.',
    date: 'June 5, 2026',
    readTime: '3 min',
    featured: true,
    url: null,
  },
  {
    id: 2,
    category: 'Competitive Exams',
    tag: 'JEE',
    title: 'NTA clarifies JEE Main correction window dates',
    excerpt:
      'The NTA has announced a correction window for JEE Main form updates, giving candidates another chance to fix their exam centre and subject details.',
    body: 'The National Testing Agency (NTA) has issued a vital clarification regarding the JEE Main application form correction window. Candidates who made errors in their registration details can now make modifications to specific fields including examination center preferences, chosen subject categories, spelling of names, and academic records.\n\nAccording to the official circular, the window will remain active for a limited period of 72 hours, and no further extensions will be provided under any circumstances. NTA has strongly advised students to double-check their credentials before submitting the correction form, as this serves as the final opportunity prior to the release of admit cards.\n\nCandidates are requested to visit the official JEE Main portal (jeemain.nta.nic.in) to perform modifications. Any applicable fees for category updates must be paid online via net banking or credit/debit card before the window closes.',
    date: 'June 4, 2026',
    readTime: '2.5 min',
    featured: false,
    url: null,
  },
  {
    id: 3,
    category: 'Policy',
    tag: 'NEP 2020',
    title: 'State education boards align syllabi with NEP 2020 reforms',
    excerpt:
      'Several state boards have begun revising their school syllabi to reflect the new interdisciplinary and competency-based learning outcomes promoted by NEP 2020.',
    body: 'In a massive academic restructuring, multiple state secondary education boards have commenced aligning their existing academic curricula with the National Education Policy (NEP) 2020 framework. The revision moves away from traditional rote-learning methodologies to embrace interdisciplinary subjects, practical skill training, and analytical assessment parameters.\n\nStarting from the upcoming academic term, students will experience modular examinations and a broader selection of elective vocational courses. Core subjects like science and mathematics are being integrated with hands-on experiments, while humanities courses will include local historical contexts and case studies.\n\n"This transition ensures that our youth are equipped with 21st-century skills such as critical thinking and problem-solving, making them globally competitive," remarked a member of the curriculum review committee.',
    date: 'June 3, 2026',
    readTime: '4 min',
    featured: false,
    url: null,
  },
  {
    id: 4,
    category: 'Technology',
    tag: 'EdTech',
    title: 'AI tutoring apps gain traction in metro cities',
    excerpt:
      'EdTech startups are reporting higher engagement from students using AI tutoring apps for exam prep, video lessons and adaptive quizzes.',
    body: "Artificial Intelligence has taken center stage in the Indian education technology ecosystem, with personal AI tutor applications registering record-high user engagement rates in metropolitan cities. These apps analyze a student's individual learning speed and tailor practice questions, summaries, and explanations accordingly.\n\nIndustry analysts note that students preparing for competitive exams like NEET and JEE find AI-driven mock tests highly beneficial. The systems highlight concept-level gaps and suggest targeted revisions. Parents have also expressed support, citing the affordability of AI learning assistants compared to expensive offline private coaching.\n\nHowever, educators emphasize that AI should complement classroom instruction rather than replace the fundamental human connection provided by teachers.",
    date: 'June 2, 2026',
    readTime: '3 min',
    featured: false,
    url: null,
  },
  {
    id: 5,
    category: 'Scholarships',
    tag: 'PM Scholarship',
    title: 'New scholarship window opens for women in STEM',
    excerpt:
      'A government scholarship portal has opened fresh registrations for women pursuing STEM degrees, offering tuition support and mentorship.',
    body: 'The Department of Science and Technology, in collaboration with national educational bodies, has launched a dedicated scholarship scheme to encourage female enrollment in Science, Technology, Engineering, and Mathematics (STEM) programs. The initiative targets meritorious students from socio-economically disadvantaged families entering undergraduate college programs.\n\nSelected scholars will receive full tuition fee waivers, an annual research materials allowance, and regular mentorship from senior female scientists and industry executives. The scheme aims to increase the representation of women in research laboratories and technical industries.\n\nInterested applicants must submit their academic transcripts, income verification certificates, and a brief statement of purpose through the national scholarship portal before the end of this month.',
    date: 'June 1, 2026',
    readTime: '3 min',
    featured: false,
    url: null,
  },
  {
    id: 6,
    category: 'Education',
    tag: 'CBSE',
    title: 'CBSE updates academic calendar for summer revision camps',
    excerpt:
      'CBSE has published a revised academic calendar that includes dedicated summer revision camps for Class 10 and 12 students.',
    body: 'The Central Board of Secondary Education (CBSE) has released an updated academic schedule introducing summer revision workshops for students transitioning to Classes 10 and 12. These online and offline camps will focus on strengthening fundamental concepts, learning exam strategies, and building stress management techniques.\n\nParticipating schools will host these camps during the early summer break. Experts in core subjects will guide learners through practice question sessions and solve critical doubts. The board highlighted that this proactive academic support is intended to ease student anxiety and set a solid foundation for final board assessments.\n\nRegistration is free for all students enrolled in government-run and government-aided CBSE schools, while private schools have been encouraged to adopt similar training programs.',
    date: 'May 30, 2026',
    readTime: '2 min',
    featured: false,
    url: null,
  },
];

// ── Hindi Mock Articles — url set to null (AI-curated, no real source link) ──

const MOCK_NEWS_HI = [
  {
    id: 1,
    category: 'शिक्षा',
    tag: 'सीबीएसई',
    title: 'सीबीएसई ने ग्रामीण छात्रों के लिए नई डिजिटल लाइब्रेरी शुरू की',
    excerpt:
      'सीबीएसई ने ग्रामीण शिक्षार्थियों को इंटरैक्टिव अध्ययन सामग्री, पिछले वर्ष के प्रश्नपत्रों और शैक्षणिक वीडियो के साथ समर्थन देने के लिए एक मुफ्त डिजिटल लाइब्रेरी पहल शुरू की है।',
    body: 'केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE) ने आधिकारिक तौर पर भारत भर के ग्रामीण और अर्ध-शहरी क्षेत्रों के छात्रों के लिए एक नई डिजिटल लाइब्रेरी पहल की घोषणा की है। इस कार्यक्रम को मुफ्त, ऑफलाइन-सक्षम और इंटरैक्टिव शिक्षण संसाधन प्रदान करके डिजिटल विभाजन को पाटने के लिए डिज़ाइन किया गया है। इस पहल के तहत, ग्रामीण जिलों के स्कूलों को प्री-लोडेड डिजिटल स्टोरेज डिवाइस और एक केंद्रीय ऑनलाइन पोर्टल तक पहुंच प्राप्त होगी जिसमें पाठ्यक्रम पुस्तकें, पिछले वर्ष के प्रश्न पत्र, वीडियो ट्यूटोरियल और आत्म-मूल्यांकन क्विज़ शामिल हैं।\n\nलॉन्च इवेंट के दौरान सीबीएसई के एक वरिष्ठ अधिकारी ने कहा, "हमारा लक्ष्य यह सुनिश्चित करना है कि भूगोल किसी छात्र की क्षमता को सीमित न करे।" यह लाइब्रेरी अंग्रेजी और क्षेत्रीय भाषाओं दोनों में सीखने का समर्थन करेगी, जिससे छात्रों को आत्मविश्वास के साथ बोर्ड परीक्षाओं की तैयारी करने में मदद मिलेगी। रोल-आउट के पहले चरण में 10,000 से अधिक स्कूलों को लाभ मिलने की उम्मीद है, जिसे अगले साल तक देश भर में विस्तारित करने की योजना है।\n\nछात्र पोर्टल के माध्यम से अपने संदेह भी भेज सकेंगे, जिनका उत्तर ऑनलाइन शिक्षकों द्वारा दिया जाएगा। इस परियोजना को केंद्रीय शिक्षा मंत्रालय द्वारा यह सुनिश्चित करने के लिए सहायता प्रदान की जा रही है कि शैक्षणिक संसाधन सबसे दूरदराज के स्कूलों तक भी पहुंच सकें।',
    date: '5 जून, 2026',
    readTime: '3 मिनट',
    featured: true,
    url: null,
  },
  {
    id: 2,
    category: 'प्रतियोगी परीक्षा',
    tag: 'जेईई',
    title: 'एनटीए ने जेईई मेन सुधार विंडो की तिथियों को स्पष्ट किया',
    excerpt:
      'एनटीए ने जेईई मेन फॉर्म अपडेट के लिए सुधार विंडो की घोषणा की है, जिससे उम्मीदवारों को अपने परीक्षा केंद्र और विषय विवरण को ठीक करने का एक और मौका मिला है।',
    body: 'राष्ट्रीय परीक्षण एजेंसी (NTA) ने जेईई मेन आवेदन पत्र सुधार विंडो के संबंध में एक महत्वपूर्ण स्पष्टीकरण जारी किया है। जिन उम्मीदवारों ने अपने पंजीकरण विवरण में त्रुटियां की थीं, वे अब परीक्षा केंद्र की प्राथमिकताओं, चुने गए विषय श्रेणियों, नामों की वर्तनी और शैक्षणिक रिकॉर्ड सहित विशिष्ट क्षेत्रों में संशोधन कर सकते हैं।\n\nआधिकारिक परिपत्र के अनुसार, यह विंडो 72 घंटों की सीमित अवधि के लिए सक्रिय रहेगी और किसी भी परिस्थिति में कोई अतिरिक्त विस्तार नहीं दिया जाएगा। एनटीए ने छात्रों को सुधार फॉर्म जमा करने से पहले अपने क्रेडेंशियल की दोबारा जांच करने की दृढ़ता से सलाह दी है, क्योंकि यह एडमिट कार्ड जारी होने से पहले अंतिम अवसर है।\n\nउम्मीदवारों से अनुरोध है कि वे संशोधन करने के लिए आधिकारिक जेईई मेन पोर्टल (jeemain.nta.nic.in) पर जाएं। श्रेणी अपडेट के लिए कोई भी लागू शुल्क विंडो बंद होने से पहले नेट बैंकिंग या क्रेडिट/डेबिट कार्ड के माध्यम से ऑनलाइन भुगतान किया जाना चाहिए।',
    date: '4 जून, 2026',
    readTime: '2.5 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 3,
    category: 'नीति',
    tag: 'एनईपी 2020',
    title:
      'राज्य शिक्षा बोर्डों ने पाठ्यक्रम को एनईपी 2020 के सुधारों के अनुरूप संरेखित करना शुरू किया',
    excerpt:
      'कई राज्य बोर्डों ने एनईपी 2020 द्वारा प्रचारित नए अंतःविषय और योग्यता-आधारित शिक्षण परिणामों को दर्शाने के लिए अपने स्कूल के पाठ्यक्रम को संशोधित करना शुरू कर दिया है।',
    body: 'एक बड़े शैक्षणिक पुनर्गठन में, कई राज्य माध्यमिक शिक्षा बोर्डों ने अपने मौजूदा शैक्षणिक पाठ्यक्रमों को राष्ट्रीय शिक्षा नीति (NEP) 2020 के ढांचे के साथ संरेखित करना शुरू कर दिया है। यह संशोधन पारंपरिक रटने की प्रणाली से हटकर अंतःविषय विषयों, व्यावहारिक कौशल प्रशिक्षण और विश्लेषणात्मक मूल्यांकन मानकों को अपनाने पर केंद्रित है।\n\nआगामी शैक्षणिक सत्र से, छात्रों को मॉड्यूलर परीक्षाओं और वैकल्पिक व्यावसायिक पाठ्यक्रमों के व्यापक चयन का अनुभव मिलेगा। विज्ञान और गणित जैसे मुख्य विषयों को व्यावहारिक प्रयोगों के साथ एकीकृत किया जा रहा है, जबकि मानविकी पाठ्यक्रमों में स्थानीय ऐतिहासिक संदर्भ और केस स्टडीज शामिल होंगे।\n\nपाठ्यक्रम समीक्षा समिति के एक सदस्य ने टिप्पणी की, "यह परिवर्तन सुनिश्चित करता है कि हमारे युवा महत्वपूर्ण सोच और समस्या-समाधान जैसे 21वीं सदी के कौशल से लैस हों, जिससे वे वैश्विक स्तर पर प्रतिस्पर्धी बन सकें।"',
    date: '3 जून, 2026',
    readTime: '4 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 4,
    category: 'तकनीकी',
    tag: 'एडटेक',
    title: 'मेट्रो शहरों में एआई ट्यूशन ऐप की लोकप्रियता बढ़ी',
    excerpt:
      'एडटेक स्टार्टअप छात्रों द्वारा परीक्षा की तैयारी, वीडियो पाठ और अनुकूली क्विज़ के लिए एआई ट्यूशन ऐप के उपयोग में उच्च जुड़ाव दर्ज कर रहे हैं।',
    body: 'भारतीय शिक्षा प्रौद्योगिकी पारिस्थितिकी तंत्र में आर्टिफिशियल इंटेलिजेंस ने मुख्य स्थान ले लिया है, जिसमें व्यक्तिगत एआई ट्यूटर अनुप्रयोगों ने महानगरीय शहरों में रिकॉर्ड-उच्च उपयोगकर्ता जुड़ाव दर्ज किया है। ये ऐप किसी छात्र की व्यक्तिगत सीखने की गति का विश्लेषण करते हैं और उसी के अनुसार अभ्यास प्रश्न, सारांश और स्पष्टीकरण तैयार करते हैं।\n\nउद्योग विश्लेषकों का कहना है कि नीट (NEET) और जेईई (JEE) जैसी प्रतियोगी परीक्षाओं की तैयारी करने वाले छात्रों को एआई-संचालित मॉक टेस्ट बेहद फायदेमंद लग रहे हैं। ये प्रणालियां अवधारणा-स्तरीय कमियों को उजागर करती हैं और लक्षित संशोधनों का सुझाव देती हैं। अभिभावकों ने भी इस पहल का समर्थन किया है, जिसमें महंगे ऑफलाइन निजी कोचिंग की तुलना में एआई शिक्षण सहायकों की कम लागत का हवाला दिया गया है।\n\nहालांकि, शिक्षक इस बात पर जोर देते हैं कि एआई को शिक्षकों द्वारा प्रदान किए जाने वाले मौलिक मानवीय जुड़ाव को बदलने के बजाय कक्षा के शिक्षण के पूरक के रूप में कार्य करना चाहिए।',
    date: '2 जून, 2026',
    readTime: '3 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 5,
    category: 'छात्रवृत्ति',
    tag: 'पीएम स्कॉलरशिप',
    title: 'स्टेम (STEM) में महिलाओं के लिए नया स्कॉलरशिप पोर्टल खुला',
    excerpt:
      'एक सरकारी छात्रवृत्ति पोर्टल ने विज्ञान, प्रौद्योगिकी, इंजीनियरिंग और गणित (STEM) की पढ़ाई कर रही महिलाओं के लिए नए पंजीकरण शुरू किए हैं, जिसमें ट्यूशन सहायता और मेंटरशिप प्रदान की जा रही है।',
    body: 'विज्ञान और प्रौद्योगिकी विभाग ने राष्ट्रीय शैक्षणिक निकायों के सहयोग से विज्ञान, प्रौद्योगिकी, इंजीनियरिंग और गणित (STEM) कार्यक्रमों में महिलाओं के नामांकन को प्रोत्साहित करने के लिए एक समर्पित छात्रवृत्ति योजना शुरू की है। यह पहल स्नातक कॉलेज कार्यक्रमों में प्रवेश लेने वाले सामाजिक-आर्थिक रूप से वंचित परिवारों के मेधावी छात्रों को लक्षित करती है।\n\nचयनित छात्राओं को पूर्ण ट्यूशन शुल्क छूट, वार्षिक शोध सामग्री भत्ता और वरिष्ठ महिला वैज्ञानिकों तथा उद्योग के अधिकारियों से नियमित परामर्श प्राप्त होगा। इस योजना का उद्देश्य अनुसंधान प्रयोगशालाओं और तकनीकी उद्योगों में महिलाओं के प्रतिनिधित्व को बढ़ाना है।\n\nइच्छुक आवेदकों को इस महीने के अंत से पहले राष्ट्रीय छात्रवृत्ति पोर्टल के माध्यम से अपनी शैक्षणिक प्रतिलेख, आय सत्यापन प्रमाण पत्र और एक संक्षिप्त उद्देश्य विवरण जमा करना होगा।',
    date: '1 जून, 2026',
    readTime: '3 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 6,
    category: 'शिक्षा',
    tag: 'सीबीएसई',
    title:
      'सीबीएसई ने ग्रीष्मकालीन रिवीजन शिविरों के लिए शैक्षणिक कैलेंडर अपडेट किया',
    excerpt:
      'सीबीएसई ने एक संशोधित शैक्षणिक कैलेंडर प्रकाशित किया है जिसमें कक्षा 10 और 12 के छात्रों के लिए समर्पित ग्रीष्मकालीन रिवीजन शिविर शामिल हैं।',
    body: 'केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE) ने कक्षा 10 और 12 में जाने वाले छात्रों के लिए ग्रीष्मकालीन रिवीजन कार्यशालाओं की शुरुआत करते हुए एक अद्यतन शैक्षणिक कार्यक्रम जारी किया है। ये ऑनलाइन और ऑफलाइन शिविर बुनियादी अवधारणाओं को मजबूत करने, परीक्षा रणनीतियों को सीखने और तनाव प्रबंधन तकनीकों के निर्माण पर ध्यान केंद्रित करेंगे।\n\nसंबद्ध स्कूल शुरुआती गर्मियों की छुट्टियों के दौरान इन शिविरों की मेजबानी करेंगे। मुख्य विषयों के विशेषज्ञ शिक्षार्थियों को अभ्यास प्रश्न सत्रों के माध्यम से मार्गदर्शन करेंगे और महत्वपूर्ण संदेहों का समाधान करेंगे। बोर्ड ने रेखांकित किया कि इस सक्रिय शैक्षणिक सहायता का उद्देश्य छात्रों की चिंता को कम करना और अंतिम बोर्ड मूल्यांकन के लिए एक ठोस आधार तैयार करना है।\n\nसरकारी और सरकारी सहायता प्राप्त सीबीएसई स्कूलों में नामांकित सभी छात्रों के लिए पंजीकरण निःशुल्क है, जबकि निजी स्कूलों को भी इसी तरह के प्रशिक्षण कार्यक्रम अपनाने के लिए प्रोत्साहित किया गया है।',
    date: '30 मई, 2026',
    readTime: '2 मिनट',
    featured: false,
    url: null,
  },
];

const CARD_COLORS = [
  '#818cf8',
  '#22d3ee',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#38bdf8',
];

// ── Fetch news from our secure Node.js API ───────────────────────────────────

async function fetchNewsFromAI(lang) {
  const response = await fetch(`/api/ai/news?lang=${lang || 'en'}`);
  if (!response.ok) {
    throw new Error(`Server returned error status: ${response.status}`);
  }
  const parsed = await response.json();

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid JSON format returned from server');
  }

  // Assign colors; also null out url since AI-generated articles have no real source link
  return parsed.map((article, i) => ({
    ...article,
    url: null,
    color: CARD_COLORS[i % CARD_COLORS.length],
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CategoryPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-semibold whitespace-nowrap cursor-pointer hover:scale-[1.02] ${
      active
        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20'
        : 'bg-[#111827]/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);

const NewsBadge = ({ label, color }) => (
  <span
    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase border"
    style={{
      background: `${color}10`,
      color,
      borderColor: `${color}25`,
    }}
  >
    {label}
  </span>
);

const SkeletonCard = () => (
  <div className="bg-[#111827]/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
    <div className="h-1 w-20 rounded bg-slate-800" />
    <div className="h-4 w-3/4 rounded bg-slate-800" />
    <div className="h-2 w-full rounded bg-slate-800" />
    <div className="h-2 w-5/6 rounded bg-slate-800" />
    <div className="h-2 w-2/3 rounded bg-slate-800" />
    <div className="flex gap-2 mt-2 pt-4 border-t border-slate-800/50">
      <div className="h-2 w-16 rounded bg-slate-800" />
      <div className="h-2 w-16 rounded bg-slate-800" />
    </div>
  </div>
);

// ── AI Curated Notice — replaces the broken "Original Source" button ──────────

const AICuratedNotice = ({ isHindi }) => (
  <div className="mt-10 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-start gap-3">
    <Info className="text-violet-400 shrink-0 mt-0.5" size={20} />
    <p className="text-sm text-slate-400 leading-relaxed">
      {isHindi
        ? 'यह लेख AI द्वारा संकलित और सारांशित किया गया है। सटीक और अद्यतन जानकारी के लिए कृपया आधिकारिक सरकारी या शिक्षा पोर्टल पर जाएं।'
        : 'This article is AI-curated and summarised for informational purposes. For verified and up-to-date details, please visit the official government or education portal directly.'}
    </p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function Blogs() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.startsWith('hi') ? 'hi' : 'en';
  const isHindi = currentLanguage === 'hi';

  const [activeTab, setActiveTab] = useState('news');
  const [newsCategory, setNewsCategory] = useState('All');
  const [rojgarTag, setRojgarTag] = useState('All');
  const [newsSearch, setNewsSearch] = useState('');
  const [rojgarSearch, setRojgarSearch] = useState('');

  // Active detailed reading blog article
  const [activeArticle, setActiveArticle] = useState(null);

  // Dynamic news state
  const [newspaper, setNewspaper] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [usingFallbackNews, setUsingFallbackNews] = useState(false);

  // Reader state variables
  const [helpfulFeedback, setHelpfulFeedback] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch news whenever currentLanguage updates
  useEffect(() => {
    setNewsLoading(true);
    setNewsError(null);
    setUsingFallbackNews(false);
    setActiveArticle(null); // Clear selected article on lang change

    // Reset filters for current language
    setNewsCategory(isHindi ? 'सभी' : 'All');
    setRojgarTag(isHindi ? 'सभी' : 'All');
    setNewsSearch('');
    setRojgarSearch('');

    fetchNewsFromAI(currentLanguage)
      .then((articles) => {
        setNewspaper(articles);
        setNewsLoading(false);
      })
      .catch((err) => {
        console.warn('AI news fetch error, using localized fallbacks:', err);
        const fallback = isHindi ? MOCK_NEWS_HI : MOCK_NEWS_EN;
        setNewspaper(
          fallback.map((art, i) => ({
            ...art,
            color: CARD_COLORS[i % CARD_COLORS.length],
          }))
        );
        setUsingFallbackNews(true);
        setNewsLoading(false);
      });
  }, [currentLanguage, isHindi]);

  // Handle category / tag selections dynamically
  const categories = isHindi ? NEWS_CATEGORIES_HI : NEWS_CATEGORIES_EN;
  const schemes = isHindi ? ROJGAR_HI : ROJGAR_EN;
  const schemeTags = isHindi ? ROJGAR_TAGS_HI : ROJGAR_TAGS_EN;

  const filteredNews = useMemo(() => {
    return newspaper.filter((n) => {
      const matchCat =
        newsCategory === 'All' ||
        newsCategory === 'सभी' ||
        n.category.toLowerCase() === newsCategory.toLowerCase();
      const matchSearch =
        n.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
        n.excerpt.toLowerCase().includes(newsSearch.toLowerCase()) ||
        (n.body && n.body.toLowerCase().includes(newsSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [newspaper, newsCategory, newsSearch]);

  const filteredRojgar = useMemo(() => {
    return schemes.filter((r) => {
      const matchTag =
        rojgarTag === 'All' ||
        rojgarTag === 'सभी' ||
        r.tag.toLowerCase() === rojgarTag.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(rojgarSearch.toLowerCase()) ||
        r.benefit.toLowerCase().includes(rojgarSearch.toLowerCase()) ||
        r.ministry.toLowerCase().includes(rojgarSearch.toLowerCase());
      return matchTag && matchSearch;
    });
  }, [schemes, rojgarTag, rojgarSearch]);

  const featured = filteredNews.find((n) => n.featured);
  const restNews = filteredNews.filter((n) => !n.featured);

  // Reading article feedback & sharing
  const handleFeedback = (val) => {
    setHelpfulFeedback(val);
  };

  const handleShare = (article) => {
    const shareText = `${article.title} - ${t('blogs.pageTitle')}`;
    const url = window.location.href;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="bg-[#0b1329] min-h-screen text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* ── Page Header ── */}
      <header className="border-b border-slate-900 bg-[#0b1329]/95 backdrop-blur sticky top-0 z-40 shadow-sm shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-1">
              {t('blogs.knowledgeHub')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('blogs.pageTitle')}
            </h1>
          </div>

          {/* Tabs Control */}
          <div className="flex bg-slate-950/80 rounded-xl p-1 border border-slate-800/80">
            {[
              { key: 'news', label: t('blogs.newsTab') },
              { key: 'rojgar', label: t('blogs.rojgarTab') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setActiveArticle(null);
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== ARTICLE DETAILED READER ==================== */}
        {activeTab === 'news' && activeArticle && (
          <article className="max-w-3xl mx-auto bg-[#101935] border border-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
            {/* Header banner gradient using article color */}
            <div
              className="h-40 w-full relative flex items-end p-8"
              style={{
                background: `linear-gradient(135deg, ${activeArticle.color}dd, ${activeArticle.color}20), radial-gradient(circle at top right, ${activeArticle.color}80, transparent)`,
              }}
            >
              <button
                onClick={() => {
                  setActiveArticle(null);
                  setHelpfulFeedback(null);
                }}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-950/90 text-sm font-semibold border border-white/10 hover:border-white/20 transition-all text-white cursor-pointer"
              >
                {t('blogs.backToAll')}
              </button>

              <div className="flex gap-2">
                <NewsBadge label={activeArticle.category} color="#ffffff" />
                <NewsBadge label={activeArticle.tag} color="#ffffff" />
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 sm:p-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
                {activeArticle.title}
              </h2>

              {/* Author & Meta Data */}
              <div className="flex items-center gap-4 py-4 border-y border-slate-800/80 mb-8 flex-wrap justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950"
                    style={{ backgroundColor: activeArticle.color }}
                  >
                    U
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {t('blogs.writtenBy')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {activeArticle.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {activeArticle.readTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share button only — Original Source button removed */}
                <button
                  onClick={() => handleShare(activeArticle)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold hover:text-white transition cursor-pointer"
                >
                  <Share2 size={14} />
                  {copiedLink ? t('blogs.copied') : t('blogs.share')}
                </button>
              </div>

              {/* Body Text */}
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6 text-lg">
                {activeArticle.body ? (
                  activeArticle.body.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p>{activeArticle.excerpt}</p>
                )}
              </div>

              {/* ── AI Curated Notice (replaces broken "Read Original" button) ── */}
              <AICuratedNotice isHindi={isHindi} />

              {/* Feedback Section */}
              <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col items-center gap-4 text-center">
                {helpfulFeedback === null ? (
                  <>
                    <h4 className="text-base font-bold text-slate-200">
                      {t('blogs.helpfulQuestion')}
                    </h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleFeedback('yes')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold hover:text-green-400 transition cursor-pointer"
                      >
                        <ThumbsUp size={14} className="text-green-500" />
                        {t('blogs.yes')}
                      </button>
                      <button
                        onClick={() => handleFeedback('no')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold hover:text-rose-400 transition cursor-pointer"
                      >
                        {t('blogs.no')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 font-bold text-sm bg-green-500/5 px-5 py-2.5 rounded-2xl border border-green-500/20">
                    <CheckCircle size={16} />
                    {t('blogs.thanksFeedback')}
                  </div>
                )}
              </div>
            </div>
          </article>
        )}

        {/* ==================== NEWSPAPER LIST VIEW ==================== */}
        {activeTab === 'news' && !activeArticle && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#101935]/60 border border-slate-900/50 p-5 rounded-2xl shadow-sm">
              <div className="flex-1 max-w-md relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  placeholder={t('blogs.searchNewsPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0b1329] border border-slate-800 focus:border-violet-500 focus:outline-none text-slate-100 text-sm placeholder:text-slate-500 transition-all shadow-inner"
                />
              </div>

              {/* Category Pills list */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-800">
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={cat}
                    active={newsCategory === cat}
                    onClick={() => setNewsCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {/* Using fallback banner */}
            {usingFallbackNews && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <AlertCircle
                  className="text-amber-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p className="text-sm text-slate-300 font-medium">
                    {isHindi
                      ? 'नवीनतम लाइव समाचार अभी उपलब्ध नहीं है, हम आपको हाल के लेख दिखा रहे हैं।'
                      : 'Live news is currently unavailable, showing cached education posts.'}
                  </p>
                </div>
              </div>
            )}

            {/* News Loading State */}
            {newsLoading && (
              <div className="space-y-8">
                {/* Loader bar */}
                <div className="bg-[#101935] border border-slate-900 rounded-2xl p-6 flex items-center justify-center gap-4 text-violet-400 font-semibold text-sm">
                  <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  {isHindi
                    ? 'नवीनतम शिक्षा समाचार लोड हो रहा है...'
                    : 'Fetching latest education posts...'}
                </div>
                {/* Skeletons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {newsError && !newsLoading && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 text-center max-w-md mx-auto">
                <AlertCircle className="text-rose-500 mx-auto mb-3" size={32} />
                <h3 className="text-lg font-bold text-white mb-2">
                  {newsError}
                </h3>
                <button
                  onClick={() => {
                    setNewsLoading(true);
                    setNewsError(null);
                    fetchNewsFromAI(currentLanguage)
                      .then(setNewspaper)
                      .catch(() =>
                        setNewsError(
                          isHindi ? 'लोड करने में विफल।' : 'Failed to load.'
                        )
                      )
                      .finally(() => setNewsLoading(false));
                  }}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition cursor-pointer"
                >
                  {t('blogs.retry')}
                </button>
              </div>
            )}

            {/* Loaded news cards content */}
            {!newsLoading && !newsError && (
              <>
                {filteredNews.length === 0 ? (
                  <div className="text-center py-20 bg-[#101935]/30 border border-slate-900/40 rounded-3xl">
                    <FileText
                      className="mx-auto text-slate-600 mb-4"
                      size={48}
                    />
                    <h3 className="text-xl font-bold text-slate-400">
                      {t('blogs.noArticlesFound')}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* FEATURED CARD */}
                    {featured && newsSearch === '' && (
                      <div
                        onClick={() => setActiveArticle(featured)}
                        className="bg-[#101935] border border-slate-900/60 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-800 transition-all duration-300 cursor-pointer flex flex-col lg:flex-row group"
                      >
                        {/* Illustration Container */}
                        <div
                          className="lg:w-2/5 p-8 flex items-center justify-center min-h-[240px] relative transition-transform duration-300 group-hover:scale-[1.01]"
                          style={{
                            background: `linear-gradient(135deg, ${featured.color}25, ${featured.color}05), radial-gradient(circle at center, ${featured.color}40, transparent)`,
                          }}
                        >
                          <div
                            className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-black/20"
                            style={{
                              backgroundColor: featured.color,
                              color: '#0b1329',
                            }}
                          >
                            📰
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="lg:w-3/5 p-8 flex flex-col justify-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase border border-amber-500/25 bg-amber-500/10 text-amber-400">
                              {t('blogs.featuredLabel')}
                            </span>
                            <NewsBadge
                              label={featured.category}
                              color={featured.color}
                            />
                            <NewsBadge
                              label={featured.tag}
                              color={featured.color}
                            />
                          </div>

                          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug group-hover:text-violet-300 transition duration-200">
                            {featured.title}
                          </h2>

                          <p className="text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-3">
                            {featured.excerpt}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-2 flex-wrap gap-4">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {featured.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {featured.readTime}
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold flex items-center gap-1 transition"
                              style={{ color: featured.color }}
                            >
                              {t('blogs.readArticle')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REST OF NEWS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(newsSearch !== '' ? filteredNews : restNews).map(
                        (article) => (
                          <div
                            key={article.id}
                            onClick={() => setActiveArticle(article)}
                            className="bg-[#101935] border border-slate-900/60 rounded-2xl p-6 flex flex-col gap-4 shadow-md hover:shadow-xl hover:border-slate-800 transition-all duration-300 cursor-pointer group"
                          >
                            <div
                              className="h-1 rounded-full w-12 group-hover:w-full transition-all duration-300"
                              style={{ backgroundColor: article.color }}
                            />

                            <div className="flex flex-wrap gap-2">
                              <NewsBadge
                                label={article.category}
                                color={article.color}
                              />
                              <NewsBadge
                                label={article.tag}
                                color={article.color}
                              />
                            </div>

                            <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition duration-200 flex-1">
                              {article.title}
                            </h3>

                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                              {article.excerpt}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/40 text-[11px] text-slate-500 mt-2">
                              <div className="flex items-center gap-3">
                                <span>🗓 {article.date}</span>
                                <span>⏱ {article.readTime}</span>
                              </div>
                              <span
                                className="font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform"
                                style={{ color: article.color }}
                              >
                                {isHindi ? 'पढ़ें →' : 'Read →'}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== ROJGAR YOJANA SCHEMES TAB ==================== */}
        {activeTab === 'rojgar' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#101935]/60 border border-slate-900/50 p-5 rounded-2xl shadow-sm">
              <div className="flex-1 max-w-md relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={rojgarSearch}
                  onChange={(e) => setRojgarSearch(e.target.value)}
                  placeholder={t('blogs.searchSchemesPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0b1329] border border-slate-800 focus:border-violet-500 focus:outline-none text-slate-100 text-sm placeholder:text-slate-500 transition-all shadow-inner"
                />
              </div>

              {/* Tag Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-800">
                {schemeTags.map((tag) => (
                  <CategoryPill
                    key={tag}
                    label={tag}
                    active={rojgarTag === tag}
                    onClick={() => setRojgarTag(tag)}
                  />
                ))}
              </div>
            </div>

            {/* Scheme Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  value: schemes.length,
                  label: t('blogs.totalSchemes'),
                  color: '#818cf8',
                },
                {
                  value: schemes.filter((r) => r.status === 'active').length,
                  label: t('blogs.currentlyActive'),
                  color: '#34d399',
                },
                {
                  value: new Set(schemes.map((r) => r.tag)).size,
                  label: t('blogs.categories'),
                  color: '#22d3ee',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#101935]/70 border border-slate-900/60 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden"
                >
                  {/* Subtle left border highlight */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: stat.color }}
                  />
                  <div
                    className="text-3xl font-extrabold text-white"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-xs font-semibold mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Schemes List */}
            {filteredRojgar.length === 0 ? (
              <div className="text-center py-20 bg-[#101935]/30 border border-slate-900/40 rounded-3xl">
                <FileText className="mx-auto text-slate-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-400">
                  {t('blogs.noSchemesFound')}
                </h3>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filteredRojgar.map((scheme) => (
                  <div
                    key={scheme.id}
                    className="bg-[#101935] border border-slate-900/60 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-md hover:shadow-xl hover:border-slate-800 transition duration-300 relative group overflow-hidden"
                  >
                    {/* Top glow border */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${scheme.color}, ${scheme.color}20)`,
                      }}
                    />

                    {/* Scheme Information details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <NewsBadge label={scheme.tag} color={scheme.color} />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          ● {isHindi ? 'सक्रिय' : 'Active'}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-white group-hover:text-violet-300 transition duration-200">
                        {scheme.name}
                      </h3>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pt-2 text-xs sm:text-sm border-t border-slate-800/30">
                        {[
                          {
                            label: isHindi ? 'मंत्रालय' : 'Ministry',
                            value: scheme.ministry,
                          },
                          {
                            label: isHindi ? 'पात्रता' : 'Beneficiary',
                            value: scheme.beneficiary,
                          },
                          {
                            label: isHindi ? 'लाभ' : 'Benefit',
                            value: scheme.benefit,
                          },
                          {
                            label: isHindi ? 'समय सीमा' : 'Deadline',
                            value: scheme.deadline,
                          },
                        ].map((row, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 py-1 items-start"
                          >
                            <span className="text-slate-500 font-semibold w-20 shrink-0">
                              {row.label}:
                            </span>
                            <span className="text-slate-300 font-medium">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full md:w-auto">
                      <a
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 rounded-xl text-center text-sm font-extrabold text-slate-950 transition duration-300 shadow-lg cursor-pointer hover:scale-[1.03]"
                        style={{
                          background: `linear-gradient(135deg, ${scheme.color}, ${scheme.color}dd)`,
                          boxShadow: `0 8px 24px ${scheme.color}20`,
                        }}
                      >
                        {t('blogs.applyNow')}
                      </a>
                      <span className="text-[11px] text-slate-500 text-center sm:text-right block">
                        {t('blogs.officialPortal')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer banner */}
            <div className="bg-[#1c1212]/60 border border-amber-500/10 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-black/5">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div className="text-xs text-amber-500/80 leading-relaxed">
                <strong className="text-amber-500 font-bold block mb-1">
                  {t('blogs.disclaimerTitle')}
                </strong>
                {t('blogs.disclaimerText')}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
