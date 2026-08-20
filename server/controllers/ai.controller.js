import Groq from 'groq-sdk';
import NewsCache from '../models/newsCache.model.js';
import AiChatMessage from '../models/aiChatMessage.model.js';
import AiConversation from '../models/aiConversation.model.js';
import { getJson, setJson, deleteKey } from '../utils/redisClient.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Default model — fast & capable Groq-hosted model
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Resilient helper to execute Groq chat completions with automatic model fallback
export async function createGroqChatCompletion(options) {
  const primaryModel = options.model || GROQ_MODEL;
  const candidateModels = [
    primaryModel,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'groq/compound',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
  ];
  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];

  let lastError;
  for (const model of uniqueModels) {
    try {
      return await groq.chat.completions.create({
        ...options,
        model,
      });
    } catch (err) {
      lastError = err;
      const errMsg = err?.error?.error?.message || err?.message || String(err);
      console.warn(
        `[Groq AI] Model "${model}" failed (${errMsg}), trying fallback...`
      );
    }
  }
  throw lastError;
}

// System prompt — scoped to Umang Vision Academy's EdTech context (Students)
const SYSTEM_PROMPT = `You are an expert AI Tutor for Umang Vision Academy, an EdTech platform for Indian students in Classes 9–12 studying under CBSE, ICSE, and MP Board curricula.

Your role:
- Help students understand concepts from their courses clearly and concisely
- Use simple language appropriate for school students in Classes 9 to 12
- Give examples relevant to the Indian education system and board curricula (Class 9, Class 10, Class 11, Class 12)
- Support subjects: Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Social Studies, History, Geography, Computer Science
- Keep answers focused and educational
- If asked something unrelated to education, gently redirect to academic topics
- Language Rules:
  - If a specific language is requested (Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, English), you MUST answer entirely in that target language using its native script!
  - For example:
    - Marathi -> Write in native Marathi using Devanagari script.
    - Gujarati -> Write in native Gujarati using Gujarati script.
    - Bengali -> Write in native Bengali using Bengali script.
    - Tamil -> Write in native Tamil using Tamil script.
    - Telugu -> Write in native Telugu using Telugu script.
    - Hindi -> Write in native Hindi using Devanagari script (or Hinglish if the student asked in Hinglish).
    - English -> Write in clear English.

Always be encouraging, patient, and supportive.`;

// System prompt for instructors — scoped to teacher assistance context
const SYSTEM_PROMPT_INSTRUCTOR = `You are an expert AI Teaching Assistant for Umang Vision Academy, an EdTech platform for Indian students and educators in Classes 9–12.

Your role:
- Assist instructors and teachers with creating lesson plans, syllabus mapping, and pedagogical strategies for Classes 9–12
- Help draft quizzes, assignments, and mock test questions aligned with CBSE, ICSE, and MP Board curricula for Classes 9–12
- Provide ideas for classroom activities, teaching aids, and explanation methods for complex topics
- Offer advice on student engagement, class management, and addressing learning gaps
- Support subjects: Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Social Studies, History, Geography, Computer Science
- Maintain a professional, collaborative, and resource-rich tone suitable for educators
- Language Rules: If a target language (Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, English) is requested, respond in that language using its native script!`;

const dateLabel = (date) => {
  const d = new Date(date);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Previous 7 Days';
  if (diff < 30) return 'Previous 30 Days';
  return 'Older';
};

const normalizeLanguage = (lang) => {
  if (!lang) return 'English';
  const normalized = String(lang).trim().toLowerCase();
  if (normalized === 'hi' || normalized.startsWith('hi') || normalized === 'hindi') return 'Hindi';
  if (normalized === 'mr' || normalized.startsWith('mr') || normalized === 'marathi') return 'Marathi';
  if (normalized === 'gu' || normalized.startsWith('gu') || normalized === 'gujarati') return 'Gujarati';
  if (normalized === 'bn' || normalized.startsWith('bn') || normalized === 'bengali') return 'Bengali';
  if (normalized === 'ta' || normalized.startsWith('ta') || normalized === 'tamil') return 'Tamil';
  if (normalized === 'te' || normalized.startsWith('te') || normalized === 'telugu') return 'Telugu';
  if (normalized === 'en' || normalized.startsWith('en') || normalized === 'english') return 'English';
  return lang;
};

const FALLBACK_NEWS_EN = [
  {
    id: 1,
    category: 'Education',
    tag: 'AI News',
    title: "India's education sector embraces blended learning",
    excerpt:
      'Schools and coaching centers across India are increasingly adopting a blended model that combines digital tools with classroom teaching to support students preparing for competitive exams.',
    body: 'Education providers are using online modules and live coaching together to help students manage revision and stay connected with teachers. This hybrid model aims to increase access to quality guidance while reducing study stress for students from smaller towns. Stakeholders say the approach is particularly useful for test preparation and subject-specific doubt resolution.',
    date: 'June 4, 2026',
    readTime: '3 min',
    featured: true,
    url: null,
  },
  {
    id: 2,
    category: 'Policy',
    tag: 'Govt',
    title: 'New scholarship rules make merit awards more transparent',
    excerpt:
      'A new set of guidelines for scholarship disbursement is being introduced to ensure students from remote areas receive support faster and with fewer delays.',
    body: 'The policy revision focuses on streamlining application checks and improving communication between state education departments and beneficiaries. Authorities expect students to receive approvals more quickly, especially in rural districts. Officials are also promoting the changes through school outreach programs.',
    date: 'June 3, 2026',
    readTime: '2 min',
    featured: false,
    url: null,
  },
  {
    id: 3,
    category: 'Technology',
    tag: 'STEM',
    title: 'Coding clubs gain popularity in city schools',
    excerpt:
      'Several urban schools have launched after-school coding clubs to encourage children to learn programming, robotics, and problem solving early.',
    body: 'The clubs offer hands-on activities, project-based learning, and mentorship from tech professionals. Students say the workshops make science and math concepts easier to understand. Educators believe this will help shape future career interests while building confidence in digital literacy.',
    date: 'June 2, 2026',
    readTime: '3 min',
    featured: false,
    url: null,
  },
  {
    id: 4,
    category: 'Competitive Exams',
    tag: 'Exam Prep',
    title: 'Mock tests help students track progress ahead of board exams',
    excerpt:
      'A growing number of coaching institutes are offering weekly mock tests and feedback sessions to help students assess their readiness for board exams.',
    body: 'Experts say regular practice tests reduce exam anxiety and improve time management. Students can identify weak areas and revise strategically. Schools are encouraging a balanced study plan as part of the preparation cycle.',
    date: 'June 1, 2026',
    readTime: '2 min',
    featured: false,
    url: null,
  },
  {
    id: 5,
    category: 'Scholarships',
    tag: 'Support',
    title: 'New state grant program funds rural learners',
    excerpt:
      'A state grant scheme has been launched to support rural students pursuing higher education in science, commerce, and arts streams.',
    body: 'The program provides financial support for tuition, books, and exam fees. Administrators say the grant will encourage students from economically weaker backgrounds to continue their studies. Outreach teams are being deployed to raise awareness in village schools.',
    date: 'May 31, 2026',
    readTime: '3 min',
    featured: false,
    url: null,
  },
  {
    id: 6,
    category: 'Education',
    tag: 'Career',
    title: 'Career counseling sessions expand in tier-2 cities',
    excerpt:
      'More career counseling centers are opening in tier-2 cities to guide students on course choices, entrance exams, and vocational training opportunities.',
    body: 'The sessions focus on aligning student interests with available academic and job-market pathways. Counselors are also advising on skill-based courses that match emerging industry demand. Parents and teachers are welcoming the additional guidance.',
    date: 'May 30, 2026',
    readTime: '2 min',
    featured: false,
    url: null,
  },
];

const FALLBACK_NEWS_HI = [
  {
    id: 1,
    category: 'शिक्षा',
    tag: 'ब्लॉग',
    title: 'स्कूलों में मिक्स्ड लर्निंग मॉडल तेजी से अपनाया जा रहा है',
    excerpt:
      'देश भर के स्कूल और कोचिंग सेंटर अब डिजिटल टूल्स को कक्षा शिक्षण के साथ जोड़कर पढ़ाई को सरल बना रहे हैं।',
    body: 'मिश्रित शिक्षण में ऑनलाइन मॉड्यूल और लाइव क्लासेस दोनों शामिल हैं, जिससे छात्र अपनी सुविधा के अनुसार पढ़ाई कर सकते हैं। विशेषज्ञों का मानना है कि यह मॉडल परीक्षा तैयारी और संदेह समाधान दोनों के लिए लाभकारी है।',
    date: '4 जून, 2026',
    readTime: '3 मिनट',
    featured: true,
    url: null,
  },
  {
    id: 2,
    category: 'नीति',
    tag: 'स्कॉलरशिप',
    title: 'छात्रवृत्ति नियमों में पारदर्शिता बढ़ी है',
    excerpt:
      'नए दिशानिर्देशों से दूरदराज के छात्रों को मदद अधिक तेज़ी से और कम देरी के साथ मिलेगी।',
    body: 'नीति संशोधन का लक्ष्य आवेदन प्रक्रिया को सरल बनाना और अनुमोदन समय घटाना है। अधिकारियों का कहना है कि इससे ग्रामीण क्षेत्रों के छात्रों को लाभ मिलेगा।',
    date: '3 जून, 2026',
    readTime: '2 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 3,
    category: 'तकनीकी',
    tag: 'STEM',
    title: 'शहर के स्कूलों में कोडिंग क्लब बढ़ रहे हैं',
    excerpt:
      'कई स्कूलों ने अब कोडिंग और रोबोटिक्स क्लब शुरू किए हैं ताकि बच्चों में जल्दी ही डिजिटल साक्षरता बढ़े।',
    body: 'कार्यक्रमों में परियोजना-आधारित सीखने और मेंटरशिप शामिल है। छात्रों को कहते हैं कि इससे विज्ञान और गणित अवधारणाएं आसान लगने लगी हैं।',
    date: '2 जून, 2026',
    readTime: '3 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 4,
    category: 'प्रतियोगी परीक्षा',
    tag: 'मॉक टेस्ट',
    title: 'मॉक टेस्ट से बोर्ड परीक्षा की तैयारी मजबूत होती है',
    excerpt:
      'कोचिंग संस्थान अब साप्ताहिक मॉक टेस्ट और फीडबैक सेशन दे रहे हैं ताकि छात्र अपनी प्रगति जान सकें।',
    body: 'नियमित अभ्यास से परीक्षा तनाव कम होता है और समय प्रबंधन में मदद मिलती है। शिक्षक कहते हैं कि यह पढ़ाई को अधिक रणनीतिक बनाता है।',
    date: '1 जून, 2026',
    readTime: '2 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 5,
    category: 'छात्रवृत्ति',
    tag: 'सहायता',
    title: 'राज्य छात्रवृत्ति कार्यक्रम ग्रामीण छात्रों के लिए शुरू किया गया',
    excerpt:
      'एक नया राज्य कार्यक्रम ग्रामीण युवाओं को उच्च शिक्षा के लिए आर्थिक सहायता देगा।',
    body: 'यह योजना ट्यूशन, पुस्तकें और परीक्षा शुल्क के लिए धन मुहैया कराएगी। कार्यान्वयन टीम गांवों में जागरूकता बढ़ा रही है।',
    date: '31 मई, 2026',
    readTime: '3 मिनट',
    featured: false,
    url: null,
  },
  {
    id: 6,
    category: 'शिक्षा',
    tag: 'कैरियर',
    title: 'टियर-2 शहरों में करियर मार्गदर्शन बढ़ रहा है',
    excerpt:
      'और अधिक करियर काउंसलिंग सेंटर छात्र और माता-पिता को मार्गदर्शन दे रहे हैं।',
    body: 'सत्रों में छात्र की रुचि के अनुरूप कोर्स विकल्प और परीक्षा तैयारी पर चर्चा की जाती है। अभिभावक इसे सकारात्मक बदलाव मान रहे हैं।',
    date: '30 मई, 2026',
    readTime: '2 मिनट',
    featured: false,
    url: null,
  },
];

const getNewsFallback = (lang) => {
  if (lang === 'hi') return FALLBACK_NEWS_HI;
  return FALLBACK_NEWS_EN;
};

/**
 * POST /ai/chat
 * Body: { messages: [{ role: "user"|"assistant", content: string }] }
 * Streams the response back as Server-Sent Events
 */
export const chatWithAI = async (req, res) => {
  try {
    const {
      messages = [],
      language: requestedLanguage,
      conversationId,
      userRole = 'student',
    } = req.body;

    if (!messages.length) {
      return res.status(400).json({ message: 'Messages array is required.' });
    }

    const userId = req.user?._id;
    const resolvedConversationId =
      conversationId || `user:${userId || 'anonymous'}`;

    console.log(
      '[AI Chat] userId:',
      userId,
      'conversationId:',
      conversationId,
      'resolved:',
      resolvedConversationId,
      'role:',
      userRole
    );

    // The userId is used when creating AiChatMessage, falling back to null for anonymous users.

    const targetLang =
      normalizeLanguage(requestedLanguage) || requestedLanguage;
    const languageHint = targetLang
      ? `CRITICAL: You MUST respond entirely in ${targetLang}. Ignore the language of the student's query and respond in ${targetLang}.`
      : '';

    const activePrompt =
      userRole === 'instructor' ? SYSTEM_PROMPT_INSTRUCTOR : SYSTEM_PROMPT;

    const groqMessages = [
      { role: 'system', content: activePrompt },
      ...(languageHint ? [{ role: 'system', content: languageHint }] : []),
      // Only send last 20 messages to stay within context limits
      ...messages.slice(-20).map((m) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content ?? m.text ?? '',
      })),
    ].filter(
      (m) => typeof m.content === 'string' && m.content.trim().length > 0
    );

    // Perform database persistence asynchronously so streaming starts instantly
    const lastUserText =
      messages[messages.length - 1]?.content ??
      messages[messages.length - 1]?.text ??
      '';
    const userMessageText = String(lastUserText || '').trim();

    if (userMessageText) {
      (async () => {
        try {
          await AiChatMessage.create({
            userId: userId || null,
            conversationId: resolvedConversationId,
            role: 'user',
            content: userMessageText,
          });

          if (userId) {
            const existingConv = await AiConversation.findOne({
              conversationId: resolvedConversationId,
            });
            const defaultTitle =
              userMessageText.length > 42
                ? userMessageText.slice(0, 42) + '…'
                : userMessageText;

            const updateData = {
              userId,
              userRole,
              lastMessageAt: new Date(),
            };

            if (!existingConv || existingConv.title === 'New conversation') {
              updateData.title = defaultTitle;
            }

            await AiConversation.findOneAndUpdate(
              { conversationId: resolvedConversationId },
              updateData,
              { upsert: true }
            );

            deleteKey(`ai:conversations:${userId}:${userRole}`).catch(() => {});
          }
          deleteKey(`ai:history:${resolvedConversationId}`).catch(() => {});
        } catch (err) {
          console.error(
            '[AI Chat] Async user message save error:',
            err.message
          );
        }
      })();
    }

    const stream = await createGroqChatCompletion({
      messages: groqMessages,
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    // Set up SSE headers for streaming response after stream initialized
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let assistantText = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        assistantText += delta;
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: [DONE]\n\n`);
        break;
      }
    }

    if (assistantText.trim()) {
      (async () => {
        try {
          await AiChatMessage.create({
            userId: userId || null,
            conversationId: resolvedConversationId,
            role: 'assistant',
            content: assistantText.trim(),
          });
          deleteKey(`ai:history:${resolvedConversationId}`).catch(() => {});
        } catch (err) {
          console.error(
            '[AI Chat] Async assistant message save error:',
            err.message
          );
        }
      })();
    }

    res.end();
  } catch (err) {
    console.error('AI chat error:', err);

    if (!res.headersSent) {
      // Rate limit handling
      if (err.status === 429) {
        return res.status(503).json({
          message:
            'AI Tutor is temporarily unavailable. Please try again later.',
        });
      }
      return res
        .status(500)
        .json({ message: err.message || 'AI service unavailable.' });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`
      );
      res.end();
    }
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    if (!conversationId) {
      return res.status(400).json({
        message: 'Conversation id is required.',
      });
    }

    // Security check: ensure the conversation belongs to the logged-in user
    if (userId) {
      const conv = await AiConversation.findOne({ conversationId });
      if (conv && String(conv.userId) !== String(userId)) {
        return res.status(403).json({
          message: 'Forbidden: You do not own this conversation.',
        });
      }
    }

    const cacheKey = `ai:history:${conversationId}`;
    const cachedData = await getJson(cacheKey);
    if (cachedData !== null) {
      return res.json(cachedData);
    }

    const messages = await AiChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .select('role content createdAt');

    const responseData = { conversationId, messages };
    await setJson(cacheKey, responseData, 1800); // cache for 30 minutes

    res.json(responseData);
  } catch (err) {
    console.error('Get AI chat history error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch chat history.',
    });
  }
};

export const generateQuizAI = async (req, res) => {
  try {
    const { title, summary, className } = req.body;
    if (!title || !summary)
      return res
        .status(400)
        .json({ message: 'Title and summary are required.' });

    const prompt = `Generate exactly 5 multiple choice questions for a final course quiz based on the following course details.

Course Title (Subject): ${title}
${className ? `Class / Grade Level: ${className}\n` : ''}Course Summary: ${summary}

Calibrate the difficulty, vocabulary, and depth of every question strictly to the stated class/grade level${className ? ` (${className})` : ''} — do not write questions above or below that level, and do not include topics that fall outside a typical ${className || 'school'} syllabus for this subject.

Return valid JSON only in the following shape:
{
  "quiz": {
    "title": "Final Course Quiz",
    "questions": [
      {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctOptionIndex": 0
      }
    ]
  }
}

Each question must have exactly 4 options and a correctOptionIndex between 0 and 3.
`;

    const response = await createGroqChatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.7,
    });

    const text = response.choices?.[0]?.message?.content?.trim() ?? '';
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        throw new Error('AI returned invalid quiz JSON.');
      }
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    }

    const quiz = parsed.quiz;
    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 5 ||
      !quiz.questions.every(
        (q) =>
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt) => typeof opt === 'string') &&
          Number.isInteger(q.correctOptionIndex) &&
          q.correctOptionIndex >= 0 &&
          q.correctOptionIndex < 4
      )
    ) {
      return res.status(500).json({
        message: 'AI did not return a valid quiz format. Please try again.',
      });
    }

    res.json({ quiz });
  } catch (err) {
    console.error('AI quiz generation error:', err);
    res.status(500).json({
      message:
        err.response?.data?.message || err.message || 'Quiz generation failed.',
    });
  }
};

export const generateCourseTextAI = async (req, res) => {
  try {
    const { subject, className, board, examName, language, type } = req.body;
    if (!subject) {
      return res.status(400).json({ message: 'Subject is required.' });
    }

    const courseLabel =
      type === 'competitive'
        ? `Competitive exam: ${examName || 'General'}`
        : `Class: ${className || 'General'}${board ? `, Board: ${board}` : ''}`;
    const targetLanguage = language || 'English';

    const prompt = `Generate course copy for an EdTech instructor form.

Subject: ${subject}
${courseLabel}
Language: ${targetLanguage}

Return ONLY valid JSON in this exact shape:
{
  "description": "2-4 concise sentences describing the course overview, learning goals, and value to students.",
  "content": "A structured outline with 4-6 lines. Use chapter/topic style entries. If helpful, include numbered items or bullet-like lines separated by newline characters."
}

Rules:
- Keep the description polished and marketing-friendly.
- Keep the subject content practical and syllabus-oriented.
- Match the selected language naturally.
- Do not include markdown fences or any extra keys.`;

    const response = await createGroqChatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_INSTRUCTOR },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content?.trim() ?? '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
    const content = typeof parsed.content === 'string' ? parsed.content.trim() : '';

    if (!description || !content) {
      return res.status(500).json({ message: 'AI did not return valid course text.' });
    }

    return res.json({ description, content });
  } catch (err) {
    console.error('AI course text generation error:', err);
    return res.status(500).json({
      message: err.response?.data?.message || err.message || 'Course text generation failed.',
    });
  }
};

export const generateMockTestQuestionsAI = async (req, res) => {
  try {
    const { subject, className, board, difficulty, topic, count } = req.body;

    if (!subject || !className) {
      return res
        .status(400)
        .json({ message: 'Subject and class are required.' });
    }

    const questionCount = count || 5;
    const focusTopic = topic
      ? `Topic Focus: ${topic}`
      : 'General course syllabus';

    const prompt = `Generate exactly ${questionCount} multiple choice questions for a mock test based on the following details.

Subject: ${subject}
Class / Grade Level: ${className}
Board: ${board || 'General'}
Difficulty: ${difficulty || 'Medium'}
${focusTopic}

Calibrate the difficulty, vocabulary, and depth strictly to the stated class level and board. Ensure the difficulty matches the requested "${difficulty || 'Medium'}" level.

Return valid JSON only in the following exact shape:
{
  "questions": [
    {
      "questionText": "...",
      "options": ["...", "...", "...", "..."],
      "correctOption": 0,
      "explanation": "...",
      "marks": 1
    }
  ]
}

- "options" must be an array of exactly 4 string choices.
- "correctOption" must be an integer (0, 1, 2, or 3) representing the index of the correct answer in the options array.
- "explanation" must clearly explain why the answer is correct.
- "marks" should default to 1, or more if it's a very hard question.
Do NOT include markdown formatting outside the JSON block. Return ONLY the raw JSON string.`;

    const response = await createGroqChatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: Math.min(2500, questionCount * 300),
      temperature: 0.7,
    });

    const text = response.choices?.[0]?.message?.content?.trim() ?? '';
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        throw new Error('AI returned invalid JSON.');
      }
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    }

    const questions = parsed.questions;
    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !questions.every(
        (q) =>
          typeof q.questionText === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt) => typeof opt === 'string') &&
          Number.isInteger(q.correctOption) &&
          q.correctOption >= 0 &&
          q.correctOption < 4 &&
          typeof q.explanation === 'string'
      )
    ) {
      return res.status(500).json({
        message: 'AI did not return a valid question format. Please try again.',
      });
    }

    res.json({ questions });
  } catch (err) {
    console.error('AI mock test generation error:', err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        'Question generation failed.',
    });
  }
};

/**
 * GET /ai/news
 * Query: ?lang=en|hi
 * Fetches 6 AI-generated news/blog articles with detailed body text in the target language.
 */
export const getNewsAI = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';

    // Check cache
    const cacheEntry = await NewsCache.findOne({ lang });
    const CACHE_TTL = 12 * 60 * 60 * 1000;

    if (cacheEntry) {
      const isExpired =
        Date.now() - new Date(cacheEntry.updatedAt).getTime() > CACHE_TTL;
      if (!isExpired) {
        console.log(`[News Cache HIT] lang=${lang}`);
        return res.json(cacheEntry.articles);
      }
      console.log(`[News Cache EXPIRED] lang=${lang}, regenerating...`);
    }

    const langConfig = {
      hi: {
        name: 'Hindi',
        script: 'Devanagari script',
        categories:
          'one of "शिक्षा", "प्रतियोगी परीक्षा", "नीति", "तकनीकी", "छात्रवृत्ति"',
        dateExample: '"4 जून, 2026"',
        readTimeExample: '"3 मिनट"',
      },
      mr: {
        name: 'Marathi',
        script: 'Devanagari script (Marathi language)',
        categories:
          'one of "शिक्षण", "स्पर्धा परीक्षा", "धोरण", "तंत्रज्ञान", "शिष्यवृत्ती"',
        dateExample: '"4 जून, 2026"',
        readTimeExample: '"3 मिनिटे"',
      },
      gu: {
        name: 'Gujarati',
        script: 'Gujarati script',
        categories:
          'one of "શિક્ષણ", "સ્પર્ધાત્મક પરીક્ષા", "નીતિ", "ટેકનોલોજી", "શિષ્યવૃત્તિ"',
        dateExample: '"4 જૂન, 2026"',
        readTimeExample: '"3 મિનિટ"',
      },
      bn: {
        name: 'Bengali',
        script: 'Bengali script',
        categories:
          'one of "শিক্ষা", "প্রতিযোগিতামূলক পরীক্ষা", "নীতিমালা", "প্রযুক্তি", "বৃত্তি"',
        dateExample: '"৪ জুন, ২০২৬"',
        readTimeExample: '"৩ মিনিট"',
      },
      ta: {
        name: 'Tamil',
        script: 'Tamil script',
        categories:
          'one of "கல்வி", "போட்டித் தேர்வுகள்", "கொள்கை", "தொழில்நுட்பம்", "உதவித்தொகை"',
        dateExample: '"ஜூன் 4, 2026"',
        readTimeExample: '"3 நிமிடங்கள்"',
      },
      te: {
        name: 'Telugu',
        script: 'Telugu script',
        categories:
          'one of "విద్య", "పోటీ పరీక్షలు", "విధానం", "సాంకేతికత", "స్కాలర్‌షిప్‌లు"',
        dateExample: '"జూన్ 4, 2026"',
        readTimeExample: '"3 నిమిషాలు"',
      },
      en: {
        name: 'English',
        script: 'English language',
        categories:
          'one of "Education", "Competitive Exams", "Policy", "Technology", "Scholarships"',
        dateExample: '"June 4, 2026"',
        readTimeExample: '"3 min"',
      },
    };

    const cfg = langConfig[lang] || langConfig.en;
    const today = new Date().toLocaleDateString(
      lang === 'hi' || lang === 'mr' ? 'hi-IN' : 'en-IN',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    const prompt = `You are a news curator for an Indian education platform. Generate 6 realistic, current Indian education news articles as of ${today}.
Generate the fields "title", "excerpt", "body", "tag" and "category" in ${cfg.name} language (using ${cfg.script}).

Return a JSON object with a single key "articles" whose value is an array of 6 objects. Each object must have:
- id: number (1-6)
- category: ${cfg.categories}
- tag: short tag string in ${cfg.name}
- title: string (realistic ${cfg.name} headline)
- excerpt: string (2-3 sentences in ${cfg.name}, 60-80 words)
- body: string (250-400 words in ${cfg.name}, 2-3 paragraphs separated by \\n\\n)
- date: string (e.g. ${cfg.dateExample})
- readTime: string (e.g. ${cfg.readTimeExample})
- featured: boolean (true only for id 1)
- url: null`;

    try {
      const response = await createGroqChatCompletion({
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON generator. Always return a JSON object with a single key "articles" containing an array. No markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      });

      const text = response.choices?.[0]?.message?.content?.trim() ?? '';
      console.log('[Groq raw]', text.slice(0, 200));

      // Parse and unwrap
      let articles;
      try {
        // Strip markdown code fences if present
        const cleaned = text
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const raw = JSON.parse(cleaned);

        if (Array.isArray(raw)) {
          articles = raw;
        } else {
          const key = Object.keys(raw).find((k) => Array.isArray(raw[k]));
          if (!key) throw new Error('No array found in Groq JSON response.');
          articles = raw[key];
        }
      } catch (parseErr) {
        throw new Error('Failed to parse Groq response: ' + parseErr.message);
      }

      if (!Array.isArray(articles) || articles.length === 0) {
        throw new Error('Groq returned empty or invalid articles array.');
      }

      // Save to cache
      if (cacheEntry) {
        cacheEntry.articles = articles;
        cacheEntry.markModified('articles');
        await cacheEntry.save();
      } else {
        await NewsCache.create({ lang, articles });
      }

      console.log(
        `[News] Generated ${articles.length} articles for lang=${lang}`
      );
      return res.json(articles);
    } catch (groqErr) {
      console.error('[Groq Error]', groqErr.message);

      // Graceful degradation — serve expired cache rather than 500
      if (cacheEntry?.articles?.length) {
        console.warn(`[News] Serving stale cache for lang=${lang}`);
        return res.json(cacheEntry.articles);
      }

      // Fall back to built-in localized news when Groq is unavailable.
      const fallbackArticles = getNewsFallback(lang);
      console.warn(`[News] Returning built-in fallback news for lang=${lang}`);
      return res.json(fallbackArticles);
    }
  } catch (err) {
    console.error('[getNewsAI fatal]', err.message);
    return res.status(500).json({
      message: err.message || 'Failed to fetch AI news.',
    });
  }
};

export const deleteChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    if (!conversationId) {
      return res.status(400).json({
        message: 'Conversation id is required.',
      });
    }

    // Security check: ensure the conversation belongs to the logged-in user
    if (userId) {
      const conv = await AiConversation.findOne({ conversationId });
      if (conv && String(conv.userId) !== String(userId)) {
        return res.status(403).json({
          message: 'Forbidden: You do not own this conversation.',
        });
      }
    }

    const result = await AiChatMessage.deleteMany({ conversationId });
    const conv = await AiConversation.findOneAndDelete({ conversationId });

    // Invalidate Redis caches
    await deleteKey(`ai:history:${conversationId}`);
    if (userId) {
      const userRole = conv?.userRole || 'student';
      await deleteKey(`ai:conversations:${userId}:${userRole}`);
    }

    res.json({
      conversationId,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Delete AI chat history error:', err);
    res.status(500).json({
      message: err.message || 'Failed to delete chat history.',
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { role = 'student' } = req.query;

    const cacheKey = `ai:conversations:${userId}:${role}`;
    const cachedData = await getJson(cacheKey);
    if (cachedData !== null) {
      return res.json(cachedData);
    }

    const conversations = await AiConversation.find({
      userId,
      userRole: role,
    }).sort({ lastMessageAt: -1 });

    const formattedSessions = conversations.map((c) => ({
      id: c.conversationId,
      title: c.title,
      time: c.lastMessageAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      dateLabel: dateLabel(c.lastMessageAt),
      messages: [],
    }));

    const responseData = { sessions: formattedSessions };
    await setJson(cacheKey, responseData, 600); // cache for 10 minutes

    res.json(responseData);
  } catch (err) {
    console.error('Get conversations error:', err);
    res
      .status(500)
      .json({ message: err.message || 'Failed to fetch conversations.' });
  }
};

export const translateTextAI = async (req, res) => {
  try {
    const { texts = [], targetLang = 'Hindi' } = req.body;
    if (!Array.isArray(texts) || !texts.length) {
      return res.json({ translations: {} });
    }

    const uniqueTexts = [
      ...new Set(texts.map((t) => String(t ?? '').trim()).filter(Boolean)),
    ];
    if (!uniqueTexts.length) {
      return res.json({ translations: {} });
    }

    const prompt = `You are a translation assistant for an EdTech learning platform in India.
Translate the following course titles, subject names, chapter names, and lesson titles into ${targetLang}.
Maintain accurate Indian curriculum terminology (e.g. Physics -> भौतिक विज्ञान, Mathematics -> गणित, Chemistry -> रसायन विज्ञान, Biology -> जीव विज्ञान, History -> इतिहास, Chapter -> अध्याय).
Return ONLY a valid JSON object mapping each original English input text to its translated ${targetLang} string.
Do NOT include markdown formatting, code block markers, or commentary.

Input strings:
${JSON.stringify(uniqueTexts)}`;

    const completion = await createGroqChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try stripping markdown fences
      try {
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.warn('Failed to parse AI translation JSON:', raw.slice(0, 200));
      }
    }

    res.json({ translations: parsed });
  } catch (err) {
    console.error('AI Translation Error:', err);
    res.status(500).json({ message: 'Translation failed', translations: {} });
  }
};
