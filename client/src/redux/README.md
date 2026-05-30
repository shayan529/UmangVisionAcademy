# Redux Setup Documentation

## Project Structure

```
src/
├── redux/
│   ├── slices/
│   │   ├── authSlice.js      # Authentication state & thunks
│   │   └── usersSlice.js     # User management state & thunks
│   ├── store.js              # Redux store configuration
│   └── README.md             # This file
├── config/
│   └── api.js                # Centralized API configuration & endpoints
└── context/
    └── AppContext.jsx        # Context wrapper using Redux internally
```

## How It Works

### 1. **API Configuration** (`src/config/api.js`)
- Centralized API base URL and endpoints
- Axios interceptors for:
  - Adding authentication tokens to requests
  - Handling 401 unauthorized responses

### 2. **Redux Slices**

#### `authSlice.js`
- **State**: `user`, `loading`, `error`, `isAuthenticated`
- **Async Thunks**: `login`, `register`
- **Reducers**: `logout`, `clearError`

#### `usersSlice.js`
- **State**: `users[]`, `currentUser`, `loading`, `error`
- **Async Thunks**: `fetchUsers`, `fetchUserById`, `updateUser`, `deleteUser`
- **Reducers**: `clearError`

### 3. **Store** (`src/redux/store.js`)
- Combines both slices
- Exports configured store

### 4. **AppContext** (`src/context/AppContext.jsx`)
- Wraps Redux actions for backward compatibility
- Uses `useDispatch` and `useSelector` hooks internally
- Maintains the same API as before

## Usage

### In Components

```javascript
import { useApp } from "../context/AppContext"

function MyComponent() {
  const { user, authLoading, login, logout } = useApp()
  
  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
      <button onClick={() => login(credentials)}>Login</button>
    </div>
  )
}
```

### Using Redux Hooks Directly

```javascript
import { useDispatch, useSelector } from "react-redux"
import { login } from "../redux/slices/authSlice"

function MyComponent() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector(state => state.auth)
  
  const handleLogin = (credentials) => {
    dispatch(login(credentials))
  }
  
  return <button onClick={() => handleLogin(creds)}>Login</button>
}
```

## Adding New Features

### 1. Create a new slice in `src/redux/slices/`

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export const fetchCoursesThunk = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    // API call here
  }
)

const coursesSlice = createSlice({
  name: 'courses',
  initialState: { courses: [], loading: false, error: null },
  extraReducers: (builder) => {
    // Handle async thunks
  }
})

export default coursesSlice.reducer
```

### 2. Add to store in `src/redux/store.js`

```javascript
import coursesReducer from "./slices/coursesSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    courses: coursesReducer,  // New slice
  },
})
```

### 3. Add endpoints to `src/config/api.js`

```javascript
export const API_ENDPOINTS = {
  // ... existing endpoints
  COURSES: {
    LIST: "/courses",
    GET: (id) => `/courses/${id}`,
  }
}
```

## Environment Variables

Create a `.env` file in the client directory:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

If not set, defaults to `http://localhost:5000/api`

## Key Benefits

✅ **Centralized State Management** - All data flows through Redux  
✅ **Centralized API Config** - Single source of truth for URLs  
✅ **Interceptors** - Automatic token handling and error responses  
✅ **Backward Compatible** - AppContext wrapper maintains existing component APIs  
✅ **DevTools Ready** - Redux DevTools extension support included  
✅ **Type-Safe** - Async thunks handle errors gracefully  

