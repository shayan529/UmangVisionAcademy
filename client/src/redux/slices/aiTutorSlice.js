import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [
    {
      role: 'ai',
      content:
        "Hi! I'm your AI Tutor 🎓 Ask me anything about your courses — Maths, Science, English, Hindi, or any subject. I'm here to help!",
    },
  ],
  input: '',
  streaming: false,
  error: null,
  mode: 'chat',
};

const aiTutorSlice = createSlice({
  name: 'aiTutor',
  initialState,
  reducers: {
    setInput: (state, action) => {
      state.input = action.payload;
    },
    addUserMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    addAiPlaceholder: (state) => {
      state.messages.push({ role: 'ai', content: '', streaming: true });
    },
    appendAiText: (state, action) => {
      const lastIndex = state.messages.length - 1;
      const lastMessage = state.messages[lastIndex];
      if (lastMessage?.streaming) {
        state.messages[lastIndex] = {
          ...lastMessage,
          content: lastMessage.content + action.payload,
        };
      }
    },
    removeStreamingPlaceholders: (state) => {
      state.messages = state.messages.filter(
        (message) => !message.streaming || message.content
      );
    },
    markStreamingDone: (state) => {
      state.messages = state.messages.map((message) =>
        message.streaming ? { ...message, streaming: false } : message
      );
    },
    setStreaming: (state, action) => {
      state.streaming = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    resetMessages: (state) => {
      state.messages = initialState.messages;
      state.error = null;
      state.streaming = false;
      state.input = '';
    },
  },
});

export const {
  setInput,
  addUserMessage,
  addAiPlaceholder,
  appendAiText,
  removeStreamingPlaceholders,
  markStreamingDone,
  setStreaming,
  setError,
  clearError,
  setMode,
  resetMessages,
} = aiTutorSlice.actions;

export default aiTutorSlice.reducer;
