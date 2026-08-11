/**
 * instructorChatSlice.js
 *
 * Manages:
 *  - availableInstructors  — courses+instructors the student can chat with
 *  - conversations         — thread list (student or instructor view)
 *  - activeConversation    — currently open thread metadata
 *  - messages              — messages for the open thread
 *  - unreadCount           — total unread across all threads (for badge)
 *  - typing                — { userId, name, isTyping } for the open thread
 *  - loading / error states
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";

// ── Async thunks ──────────────────────────────────────────────────────────────

/** Fetch enrolled courses + instructor details for the selector UI */
export const fetchAvailableInstructors = createAsyncThunk(
  "instructorChat/fetchAvailableInstructors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.AVAILABLE_INSTRUCTORS,
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/** Create or resume a conversation thread */
export const getOrCreateConversation = createAsyncThunk(
  "instructorChat/getOrCreateConversation",
  async ({ instructorId, courseId, subject }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CONVERSATIONS,
        { instructorId, courseId, subject },
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/** Fetch thread list for current user (student = own threads, instructor = their threads) */
export const fetchConversations = createAsyncThunk(
  "instructorChat/fetchConversations",
  async ({ archived = false } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CONVERSATIONS,
        { params: { archived: archived ? "true" : "false" } },
      );
      // Server returns { conversations, total } — normalise defensively
      if (Array.isArray(data)) return { conversations: data, total: data.length };
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/** Fetch a single conversation with its messages */
export const fetchConversation = createAsyncThunk(
  "instructorChat/fetchConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        API_ENDPOINTS.INSTRUCTOR_CHAT.CONVERSATION(conversationId),
      );
      return data; // { conversation, messages, total }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/** Archive a thread */
export const archiveConversation = createAsyncThunk(
  "instructorChat/archiveConversation",
  async ({ conversationId, archived = true }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(
        API_ENDPOINTS.INSTRUCTOR_CHAT.ARCHIVE(conversationId),
        { archived },
      );
      return { conversationId, archived: data.archived };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/** Soft-delete one message */
export const deleteMessage = createAsyncThunk(
  "instructorChat/deleteMessage",
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await api.delete(
        API_ENDPOINTS.INSTRUCTOR_CHAT.DELETE_MESSAGE(conversationId, messageId),
      );
      return { conversationId, messageId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  // Selector data (student side)
  availableInstructors: [],   // [{ courseId, courseTitle, instructor, subjects }]
  availableLoading: false,

  // Thread list
  conversations: [],
  conversationsLoading: false,
  conversationsTotal: 0,

  // Open thread
  activeConversation: null,   // conversation metadata
  messages: [],               // messages for the open thread
  messagesLoading: false,

  // Typing indicator for the open thread
  typing: null,               // { userId, name, isTyping }

  // Unread badge for nav item
  unreadCount: 0,

  error: null,
};

const instructorChatSlice = createSlice({
  name: "instructorChat",
  initialState,

  reducers: {
    // ── Socket-driven updates (called from the component via dispatch) ────────

    /** Append a message that arrived over the socket */
    socketMessageReceived(state, { payload }) {
      const { message, conversationId } = payload;
      const isActiveThread =
        state.activeConversation?._id?.toString() === conversationId?.toString();

      if (isActiveThread) {
        // Deduplicate by _id (sender echo + broadcast can both arrive)
        const exists = state.messages.some(
          (m) => m._id?.toString() === message._id?.toString(),
        );
        if (!exists) state.messages.push(message);
        if (state.activeConversation) {
          state.activeConversation.instructorUnread = 0;
          state.activeConversation.studentUnread = 0;
        }
      }

      // Update lastMessage and unread count in thread list
      state.conversations = state.conversations.map((c) => {
        if (c._id?.toString() !== conversationId?.toString()) return c;

        const isStudentMsg = message.senderRole === "student";
        const isInstructorMsg = message.senderRole === "instructor";

        return {
          ...c,
          lastMessage: {
            text: message.text,
            at: message.createdAt,
            senderRole: message.senderRole,
          },
          // If this thread is actively open, keep unread at 0
          instructorUnread: isActiveThread
            ? 0
            : isStudentMsg
              ? (c.instructorUnread ?? 0) + 1
              : c.instructorUnread ?? 0,
          studentUnread: isActiveThread
            ? 0
            : isInstructorMsg
              ? (c.studentUnread ?? 0) + 1
              : c.studentUnread ?? 0,
          updatedAt: message.createdAt,
        };
      });

      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0),
        0,
      );
    },

    /** Update typing indicator */
    socketTypingReceived(state, { payload }) {
      state.typing = payload; // { userId, name, isTyping, conversationId }
    },

    /** Mark messages as read (other side read our messages) */
    socketReadReceived(state, { payload }) {
      const { conversationId } = payload;
      if (
        state.activeConversation?._id?.toString() === conversationId?.toString()
      ) {
        state.activeConversation = {
          ...state.activeConversation,
          instructorUnread: 0,
          studentUnread: 0,
        };
      }
      state.conversations = state.conversations.map((c) =>
        c._id?.toString() === conversationId?.toString()
          ? { ...c, instructorUnread: 0, studentUnread: 0 }
          : c,
      );
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0),
        0,
      );
    },

    /** Explicitly mark a conversation as read */
    markConversationRead(state, { payload: conversationId }) {
      if (!conversationId) return;
      state.conversations = state.conversations.map((c) =>
        c._id?.toString() === conversationId?.toString()
          ? { ...c, instructorUnread: 0, studentUnread: 0 }
          : c,
      );
      if (
        state.activeConversation?._id?.toString() ===
        conversationId?.toString()
      ) {
        state.activeConversation = {
          ...state.activeConversation,
          instructorUnread: 0,
          studentUnread: 0,
        };
      }
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0),
        0,
      );
    },

    /** Replace a soft-deleted message with a tombstone */
    markMessageDeleted(state, { payload: messageId }) {
      state.messages = state.messages.map((m) =>
        m._id?.toString() === messageId?.toString()
          ? { ...m, deleted: true, text: "", media: [] }
          : m,
      );
    },

    /** Set the active conversation without a network fetch (from socket history or list click) */
    setActiveConversation(state, { payload }) {
      if (!payload) {
        state.activeConversation = null;
        return;
      }
      state.activeConversation = {
        ...payload,
        instructorUnread: 0,
        studentUnread: 0,
      };
      // Immediately clear unread status in the thread list
      state.conversations = state.conversations.map((c) =>
        c._id?.toString() === payload._id?.toString()
          ? { ...c, instructorUnread: 0, studentUnread: 0 }
          : c,
      );
      state.unreadCount = state.conversations.reduce(
        (sum, c) => sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0),
        0,
      );
    },

    /** Bulk-replace messages (e.g. from ic:history socket event) */
    setMessages(state, { payload }) {
      state.messages = payload;
    },

    /** Reset typing after timeout */
    clearTyping(state) {
      state.typing = null;
    },

    clearError(state) {
      state.error = null;
    },

    resetChat(state) {
      state.activeConversation = null;
      state.messages = [];
      state.typing = null;
      state.error = null;
    },

    /** Compute total unread from conversation list */
    recomputeUnread(state) {
      state.unreadCount = state.conversations.reduce((sum, c) => {
        return sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0);
      }, 0);
    },

    setUnreadCount(state, { payload }) {
      state.unreadCount = payload;
    },
  },

  extraReducers: (builder) => {
    // ── fetchAvailableInstructors ─────────────────────────────────────────────
    builder
      .addCase(fetchAvailableInstructors.pending, (state) => {
        state.availableLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableInstructors.fulfilled, (state, { payload }) => {
        state.availableLoading = false;
        state.availableInstructors = payload;
      })
      .addCase(fetchAvailableInstructors.rejected, (state, { payload }) => {
        state.availableLoading = false;
        state.error = payload;
      });

    // ── getOrCreateConversation ───────────────────────────────────────────────
    builder
      .addCase(getOrCreateConversation.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(getOrCreateConversation.fulfilled, (state, { payload }) => {
        state.messagesLoading = false;
        state.activeConversation = payload;
        state.messages = [];
        // Upsert into list
        const idx = state.conversations.findIndex(
          (c) => c._id?.toString() === payload._id?.toString(),
        );
        if (idx === -1) {
          state.conversations.unshift(payload);
        } else {
          state.conversations[idx] = payload;
        }
      })
      .addCase(getOrCreateConversation.rejected, (state, { payload }) => {
        state.messagesLoading = false;
        state.error = payload;
      });

    // ── fetchConversations ────────────────────────────────────────────────────
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, { payload }) => {
        state.conversationsLoading = false;
        state.conversations = payload.conversations ?? [];
        state.conversationsTotal = payload.total ?? 0;
        // Recompute unread badge
        state.unreadCount = (payload.conversations ?? []).reduce(
          (sum, c) => sum + (c.studentUnread ?? 0) + (c.instructorUnread ?? 0),
          0,
        );
      })
      .addCase(fetchConversations.rejected, (state, { payload }) => {
        state.conversationsLoading = false;
        state.error = payload;
      });

    // ── fetchConversation ─────────────────────────────────────────────────────
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, { payload }) => {
        state.messagesLoading = false;
        state.activeConversation = payload.conversation;
        state.messages = payload.messages ?? [];
      })
      .addCase(fetchConversation.rejected, (state, { payload }) => {
        state.messagesLoading = false;
        state.error = payload;
      });

    // ── archiveConversation ───────────────────────────────────────────────────
    builder.addCase(archiveConversation.fulfilled, (state, { payload }) => {
      state.conversations = state.conversations.filter(
        (c) => c._id?.toString() !== payload.conversationId?.toString(),
      );
      if (
        state.activeConversation?._id?.toString() ===
        payload.conversationId?.toString()
      ) {
        state.activeConversation = null;
        state.messages = [];
      }
    });

    // ── deleteMessage ─────────────────────────────────────────────────────────
    builder.addCase(deleteMessage.fulfilled, (state, { payload }) => {
      state.messages = state.messages.map((m) =>
        m._id?.toString() === payload.messageId?.toString()
          ? { ...m, deleted: true, text: "", media: [] }
          : m,
      );
    });
  },
});

export const {
  socketMessageReceived,
  socketTypingReceived,
  socketReadReceived,
  markConversationRead,
  markMessageDeleted,
  setActiveConversation,
  setMessages,
  clearTyping,
  clearError,
  resetChat,
  recomputeUnread,
  setUnreadCount,
} = instructorChatSlice.actions;

export default instructorChatSlice.reducer;
