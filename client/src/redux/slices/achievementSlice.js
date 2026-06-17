import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";

export const fetchAchievements = createAsyncThunk(
  "achievements/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/achievements");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const checkAndAwardAchievements = createAsyncThunk(
  "achievements/checkAndAward",
  async (activityData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/achievements/check", activityData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const markAchievementsViewed = createAsyncThunk(
  "achievements/markViewed",
  async (badgeIds, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/achievements/viewed", { badgeIds });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

const initialState = {
  earnedBadges: {}, // { badgeId: { earnedAt, viewed, _id }, ... }
  totalEarned: 0,
  newAchievements: [], // badgeIds that were just earned
  loading: false,
  checkingAchievements: false,
  error: null,
};

const achievementSlice = createSlice({
  name: "achievements",
  initialState,
  reducers: {
    clearNewAchievements: (state) => {
      state.newAchievements = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAchievements
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.earnedBadges = action.payload?.earnedBadges || {};
        state.totalEarned = action.payload?.totalEarned || 0;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // checkAndAwardAchievements
      .addCase(checkAndAwardAchievements.pending, (state) => {
        state.checkingAchievements = true;
        state.error = null;
      })
      .addCase(checkAndAwardAchievements.fulfilled, (state, action) => {
        state.checkingAchievements = false;
        state.newAchievements = action.payload?.newAchievements || [];
        if (action.payload?.earnedBadges) {
          state.earnedBadges = action.payload.earnedBadges;
        }
        if (typeof action.payload?.totalEarned === "number") {
          state.totalEarned = action.payload.totalEarned;
        } else if (action.payload?.newAchievements?.length > 0) {
          state.totalEarned =
            (state.totalEarned || 0) + action.payload.newAchievements.length;
        }
      })
      .addCase(checkAndAwardAchievements.rejected, (state, action) => {
        state.checkingAchievements = false;
        state.error = action.payload;
      })

      // markAchievementsViewed
      .addCase(markAchievementsViewed.fulfilled, (state, action) => {
        // Update viewed status in local state
        const badgeIds = action.meta.arg;
        badgeIds.forEach((badgeId) => {
          if (state.earnedBadges[badgeId]) {
            state.earnedBadges[badgeId].viewed = true;
          }
        });
      });
  },
});

export const { clearNewAchievements, clearError } = achievementSlice.actions;
export default achievementSlice.reducer;
