import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt — scoped to SkillSphere's EdTech context
const SYSTEM_PROMPT = `You are an expert AI Tutor for SkillSphere, an EdTech platform for Indian students in Classes 1–12 studying under CBSE, ICSE, and MP Board curricula.

Your role:
- Help students understand concepts from their courses clearly and concisely
- Use simple language appropriate for school students
- Give examples relevant to the Indian education system where possible
- Support subjects: Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Social Studies, History, Geography, Computer Science
- Keep answers focused and educational
- If asked something unrelated to education, gently redirect to academic topics
- Respond in the same language the student uses (Hindi or English)

Always be encouraging, patient, and supportive.`;

/**
 * POST /ai/chat
 * Body: { messages: [{ role: "user"|"assistant", content: string }] }
 * Streams the response back as Server-Sent Events
 */
export const chatWithAI = async (req, res) => {
  try {
    const { messages = [] } = req.body;

    if (!messages.length) {
      return res.status(400).json({ message: 'Messages array is required.' });
    }

    // Build the messages array with system prompt
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Only send last 20 messages to stay within context limits
      ...messages.slice(-20).map((m) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content ?? m.text ?? '',
      })),
    ];

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // cheap + fast
      messages: openaiMessages,
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        // SSE format: data: <text>\n\n
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: [DONE]\n\n`);
      }
    }

    res.end();
  } catch (err) {
    console.error('AI chat error:', err);

    if (!res.headersSent) {
      // Give a user-friendly message for quota errors
      if (err.status === 429 || err.code === 'insufficient_quota') {
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
