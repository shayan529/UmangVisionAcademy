// settingsSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api";

export const fetchProfile = createAsyncThunk(
  "settings/fetchProfile",
  async () => {
    const { data } = await api.get("/settings/profile");
    return data;
  },
);

export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async (payload) => {
    const { data } = await api.put("/settings/profile", payload);
    return data;
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    profile: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export default settingsSlice.reducer;
