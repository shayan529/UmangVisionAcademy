import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import courseReducer from "./slices/courseSlice";
import applicationsReducer from "./slices/applicationsSlice";
import sessionReducer from "./slices/sessionSlice";
import studentReducer from "./slices/studentSlice";
import cartReducer from "./slices/cartSlice";
import billingReducer from "./slices/billingSlice";
import aiTutorReducer from "./slices/aiTutorSlice";
import settingsReducer from "./slices/settingsSlice";
import mockReducer from "./slices/mockTestSlice";
import walletReducer from "./slices/walletSlice";
import achievementReducer from "./slices/achievementSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    courses: courseReducer,
    applications: applicationsReducer,
    sessions: sessionReducer,
    students: studentReducer,
    cart: cartReducer,
    billing: billingReducer,
    aiTutor: aiTutorReducer,
    settings: settingsReducer,
    mockTest: mockReducer,
    wallet: walletReducer,
    achievements: achievementReducer,
  },
});

export default store;
