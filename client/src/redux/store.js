import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import usersReducer from "./slices/usersSlice"
import courseReducer from "./slices/courseSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    courses: courseReducer,
  },
})

export default store
