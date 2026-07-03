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

  },
});

export default reelsSlice.reducer;
