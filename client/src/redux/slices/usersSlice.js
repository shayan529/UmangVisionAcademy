import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api, { API_ENDPOINTS } from "../../config/api"

// Async thunks
export const fetchUsers = createAsyncThunk("users/fetchUsers", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get(API_ENDPOINTS.USERS.LIST)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const fetchUserById = createAsyncThunk("users/fetchUserById", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(API_ENDPOINTS.USERS.GET(id))
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const updateUser = createAsyncThunk("users/updateUser", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(API_ENDPOINTS.USERS.UPDATE(id), payload)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const deleteUser = createAsyncThunk("users/deleteUser", async (payload, { rejectWithValue }) => {
  try {
    const id = typeof payload === "object" ? payload.id : payload
    const role = typeof payload === "object" ? payload.role : undefined
    const url = role ? `${API_ENDPOINTS.USERS.DELETE(id)}?role=${role}` : API_ENDPOINTS.USERS.DELETE(id)
    const { data } = await api.delete(url)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message)
  }
})

const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Fetch User By ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false
        state.users = state.users.map((u) =>
          u._id === action.payload._id ? action.payload : u
        )
        if (state.currentUser?._id === action.payload._id) {
          state.currentUser = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false
        const targetId = typeof action.meta.arg === "object" ? action.meta.arg.id : action.meta.arg
        if (action.payload.deleted || action.payload.deleted === undefined) {
          // If deleted is undefined, fallback to old behavior (assume fully deleted)
          state.users = state.users.filter((u) => u._id !== targetId)
          if (state.currentUser?._id === targetId) {
            state.currentUser = null
          }
        } else {
          // Just update the user in the list (since they only lost a role but still exist)
          state.users = state.users.map((u) =>
            u._id === targetId ? action.payload.user : u
          )
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = usersSlice.actions
export default usersSlice.reducer
