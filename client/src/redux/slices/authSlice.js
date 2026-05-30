import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api, { API_ENDPOINTS } from "../../config/api"

// Async thunks
export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    localStorage.setItem("user", JSON.stringify(data))
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const register = createAsyncThunk("auth/register", async (values, { rejectWithValue }) => {
  try {
    const { data } = await api.post(API_ENDPOINTS.AUTH.REGISTER, values)
    localStorage.setItem("user", JSON.stringify(data))
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

const initialState = {
  user: (() => {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  })(),
  loading: false,
  error: null,
  isAuthenticated: (() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("user")
    return !!stored
  })(),
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem("user")
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
