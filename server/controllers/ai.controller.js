import Groq from "groq-sdk";
import NewsCache from "../models/newsCache.model.js";
import AiChatMessage from "../models/aiChatMessage.model.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Default model — fast & capable Groq-hosted model
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// System prompt — scoped to Umang Vision Academy's EdTech context
const SYSTEM_PROMPT = `You are an expert AI Tutor for Umang Vision Academy, an EdTech platform for Indian students in Classes 1–12 studying under CBSE, ICSE, and MP Board curricula.

Your role:
- Help students understand concepts from their courses clearly and concisely
- Use simple language appropriate for school students
- Give examples relevant to the Indian education system where possible
- Support subjects: Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Social Studies, History, Geography, Computer Science
- Keep answers focused and educational
- If asked something unrelated to education, gently redirect to academic topics
- Respond in the same language the student uses (Hindi or English)

Always be encouraging, patient, and supportive.`;

const normalizeLanguage = (lang) => {
  if (!lang) return null;
  const normalized = String(lang).trim().toLowerCase();
  if (normalized === "hi" || normalized.startsWith("hi")) return "Hindi";
  if (normalized === "en" || normalized.startsWith("en")) return "English";
  return null;
};

const detectLanguage = (text) => {
  if (!text) return "English";
  if (/[^\u0000-\u007F]/.test(text)) return "Hindi";
  if (
    /\b(?:kya|hai|nahi|ka|ke|ki|aur|toh|hoga|hogi|maine|tum|aap|hum|yeh|woh|ye|wo|hain)\b/i.test(
      text,
    )
  ) {
    return "Hindi";
  }
  return "English";
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
    } = req.body;

    if (!messages.length) {
      return res.status(400).json({ message: "Messages array is required." });
    }

    const userId = req.user?._id;
    const resolvedConversationId =
      conversationId || `user:${userId || "anonymous"}`;

    console.log(
      "[AI Chat] userId:",
      userId,
      "conversationId:",
      conversationId,
      "resolved:",
      resolvedConversationId,
    );

    // Allow saving for both authenticated and anonymous users
    const saveUserId = userId || conversationId || "anonymous";

    const languageHint = requestedLanguage
      ? `Respond in ${requestedLanguage}.`
      : "";

    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: languageHint },
      // Only send last 20 messages to stay within context limits
      ...messages.slice(-20).map((m) => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content ?? m.text ?? "",
      })),
    ];

    const lastUserText =
      messages[messages.length - 1]?.content ??
      messages[messages.length - 1]?.text ??
      "";
    const userMessageText = String(lastUserText || "").trim();
    if (userMessageText) {
      try {
        const saved = await AiChatMessage.create({
          userId: saveUserId !== "anonymous" ? saveUserId : null,
          conversationId: resolvedConversationId,
          role: "user",
          content: userMessageText,
        });
        console.log("[AI Chat] User message saved:", saved._id);
      } catch (err) {
        console.error("[AI Chat] Error saving user message:", err.message);
      }
    } else {
      console.log(
        "[AI Chat] Skipping user message save - userMessageText empty",
      );
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    let assistantText = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        assistantText += delta;
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason === "stop") {
        res.write(`data: [DONE]\n\n`);
        break;
      }
    }

    if (assistantText.trim()) {
      try {
        const saved = await AiChatMessage.create({
          userId: saveUserId !== "anonymous" ? saveUserId : null,
          conversationId: resolvedConversationId,
          role: "assistant",
          content: assistantText.trim(),
        });
        console.log("[AI Chat] Assistant message saved:", saved._id);
      } catch (err) {
        console.error("[AI Chat] Error saving assistant message:", err.message);
      }
    } else {
      console.log(
        "[AI Chat] Skipping assistant message save - assistantText empty",
      );
    }

    res.end();
  } catch (err) {
    console.error("AI chat error:", err);

    if (!res.headersSent) {
      // Rate limit handling
      if (err.status === 429) {
        return res.status(503).json({
          message:
            "AI Tutor is temporarily unavailable. Please try again later.",
        });
      }
      return res
        .status(500)
        .json({ message: err.message || "AI service unavailable." });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: "Stream interrupted." })}\n\n`,
      );
      res.end();
    }
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation id is required.",
      });
    }

    const messages = await AiChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .select("role content createdAt");

    res.json({ conversationId, messages });
  } catch (err) {
    console.error("Get AI chat history error:", err);
    res.status(500).json({
      message: err.message || "Failed to fetch chat history.",
    });
  }
};

export const generateQuizAI = async (req, res) => {
  try {
    const { title, summary, className } = req.body;
    if (!title || !summary)
      return res
        .status(400)
        .json({ message: "Title and summary are required." });

    const prompt = `Generate exactly 5 multiple choice questions for a final course quiz based on the following course details.

Course Title (Subject): ${title}
${className ? `Class / Grade Level: ${className}\n` : ""}Course Summary: ${summary}

Calibrate the difficulty, vocabulary, and depth of every question strictly to the stated class/grade level${className ? ` (${className})` : ""} — do not write questions above or below that level, and do not include topics that fall outside a typical ${className || "school"} syllabus for this subject.

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

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.7,
    });

    const text = response.choices?.[0]?.message?.content?.trim() ?? "";
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1 || end < start) {
        throw new Error("AI returned invalid quiz JSON.");
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
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt) => typeof opt === "string") &&
          Number.isInteger(q.correctOptionIndex) &&
          q.correctOptionIndex >= 0 &&
          q.correctOptionIndex < 4,
      )
    ) {
      return res.status(500).json({
        message: "AI did not return a valid quiz format. Please try again.",
      });
    }

    res.json({ quiz });
  } catch (err) {
    console.error("AI quiz generation error:", err);
    res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Quiz generation failed.",
    });
  }
};

export const generateMockTestQuestionsAI = async (req, res) => {
  try {
    const { subject, className, board, difficulty, topic, count } = req.body;
    
    if (!subject || !className) {
      return res.status(400).json({ message: "Subject and class are required." });
    }

    const questionCount = count || 5;
    const focusTopic = topic ? `Topic Focus: ${topic}` : "General course syllabus";

    const prompt = `Generate exactly ${questionCount} multiple choice questions for a mock test based on the following details.

Subject: ${subject}
Class / Grade Level: ${className}
Board: ${board || "General"}
Difficulty: ${difficulty || "Medium"}
${focusTopic}

Calibrate the difficulty, vocabulary, and depth strictly to the stated class level and board. Ensure the difficulty matches the requested "${difficulty || "Medium"}" level.

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

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: Math.min(2500, questionCount * 300),
      temperature: 0.7,
    });

    const text = response.choices?.[0]?.message?.content?.trim() ?? "";
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1 || end < start) {
        throw new Error("AI returned invalid JSON.");
      }
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    }

    const questions = parsed.questions;
    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !questions.every(
        (q) =>
          typeof q.questionText === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt) => typeof opt === "string") &&
          Number.isInteger(q.correctOption) &&
          q.correctOption >= 0 &&
          q.correctOption < 4 &&
          typeof q.explanation === "string"
      )
    ) {
      return res.status(500).json({
        message: "AI did not return a valid question format. Please try again.",
      });
    }

    res.json({ questions });
  } catch (err) {
    console.error("AI mock test generation error:", err);
    res.status(500).json({
      message: err.response?.data?.message || err.message || "Question generation failed.",
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
    const lang = req.query.lang || "en";

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

    const isHindi = lang === "hi";
    const today = new Date().toLocaleDateString(isHindi ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const prompt = isHindi
      ? `You are a news curator for an Indian education platform. Generate 6 realistic, current Indian education news articles as of ${today}.
Generate the fields "title", "excerpt", "body" and "category" in Hindi language (using Devnagari script).
Category must be translated: "Education" -> "शिक्षा", "Competitive Exams" -> "प्रतियोगी परीक्षा", "Policy" -> "नीति", "Technology" -> "तकनीकी", "Scholarships" -> "छात्रवृत्ति".

Return a JSON object with a single key "articles" whose value is an array of 6 objects. Each object must have:
- id: number (1-6)
- category: one of "शिक्षा", "प्रतियोगी परीक्षा", "नीति", "तकनीकी", "छात्रवृत्ति"
- tag: short tag string in Hindi
- title: string (realistic Hindi headline)
- excerpt: string (2-3 sentences in Hindi, 60-80 words)
- body: string (250-400 words in Hindi, 2-3 paragraphs separated by \\n\\n)
- date: string (e.g. "4 जून, 2026")
- readTime: string (e.g. "3 मिनट")
- featured: boolean (true only for id 1)
- url: null`
      : `You are a news curator for an Indian education platform. Generate 6 realistic, current Indian education news articles as of ${today}.

Return a JSON object with a single key "articles" whose value is an array of 6 objects. Each object must have:
- id: number (1-6)
- category: one of "Education", "Competitive Exams", "Policy", "Technology", "Scholarships"
- tag: short tag string (e.g. "CBSE", "JEE", "NEP 2020", "EdTech", "NEET")
- title: string (realistic English headline)
- excerpt: string (2-3 sentences, 60-80 words)
- body: string (250-400 words, 2-3 paragraphs separated by \\n\\n)
- date: string (e.g. "June 4, 2026")
- readTime: string (e.g. "3 min")
- featured: boolean (true only for id 1)
- url: null`;

    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a JSON generator. Always return a JSON object with a single key "articles" containing an array. No markdown, no explanation.',
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      });

      const text = response.choices?.[0]?.message?.content?.trim() ?? "";
      console.log("[Groq raw]", text.slice(0, 200));

      // Parse and unwrap
      let articles;
      try {
        // Strip markdown code fences if present
        const cleaned = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const raw = JSON.parse(cleaned);

        if (Array.isArray(raw)) {
          articles = raw;
        } else {
          const key = Object.keys(raw).find((k) => Array.isArray(raw[k]));
          if (!key) throw new Error("No array found in Groq JSON response.");
          articles = raw[key];
        }
      } catch (parseErr) {
        throw new Error("Failed to parse Groq response: " + parseErr.message);
      }

      if (!Array.isArray(articles) || articles.length === 0) {
        throw new Error("Groq returned empty or invalid articles array.");
      }

      // Save to cache
      if (cacheEntry) {
        cacheEntry.articles = articles;
        cacheEntry.markModified("articles");
        await cacheEntry.save();
      } else {
        await NewsCache.create({ lang, articles });
      }

      console.log(
        `[News] Generated ${articles.length} articles for lang=${lang}`,
      );
      return res.json(articles);
    } catch (groqErr) {
      console.error("[Groq Error]", groqErr.message);

      // Graceful degradation — serve expired cache rather than 500
      if (cacheEntry?.articles?.length) {
        console.warn(`[News] Serving stale cache for lang=${lang}`);
        return res.json(cacheEntry.articles);
      }

      throw groqErr;
    }
  } catch (err) {
    console.error("[getNewsAI fatal]", err.message);
    return res.status(500).json({
      message: err.message || "Failed to fetch AI news.",
    });
  }
};

export const deleteChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation id is required.",
      });
    }

    const result = await AiChatMessage.deleteMany({ conversationId });

    res.json({
      conversationId,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Delete AI chat history error:", err);
    res.status(500).json({
      message: err.message || "Failed to delete chat history.",
    });
  }
};
