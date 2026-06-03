import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import courseReducer from "./slices/courseSlice";
import applicationsReducer from "./slices/applicationsSlice";
import sessionReducer from "./slices/sessionSlice";
import studentReducer from "./slices/studentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    courses: courseReducer,
    applications: applicationsReducer,
    sessions: sessionReducer,
    students: studentReducer,
  },
});

export default store;
