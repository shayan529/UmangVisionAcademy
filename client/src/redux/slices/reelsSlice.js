import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchReels = createAsyncThunk("reels/fetch", async () => {
  const res = await fetch("/api/reels");
  if (!res.ok) throw new Error("Failed to load reels");
  return res.json();
});

export const createReel = createAsyncThunk("reels/create", async (payload) => {
  const res = await fetch(`/api/reels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create reel");
  return res.json();
});

export const likeReel = createAsyncThunk("reels/like", async (id) => {
  const res = await fetch(`/api/reels/${id}/like`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to like");
  const json = await res.json();
  return { id, ...json };
});

const reelsSlice = createSlice({
  name: "reels",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReels.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchReels.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchReels.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(createReel.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
      })
      .addCase(likeReel.fulfilled, (s, a) => {
        const { id, likes, liked } = a.payload || {};
        const idx = s.items.findIndex((r) => r._id === id || r.id === id);
        if (idx !== -1) {
          s.items[idx].likes = Array.isArray(s.items[idx].likes)
            ? // try to reconcile length if likes number provided
              new Array(likes).fill(null)
            : s.items[idx].likes;
          // store a convenience count
          s.items[idx].likesCount = likes;
          s.items[idx].likedByMe = liked;
        }
      });
  },
});

export default reelsSlice.reducer;
