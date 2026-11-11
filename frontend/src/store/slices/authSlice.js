import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/apiClient';

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        statusCode: err.statusCode,
      });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        statusCode: err.statusCode,
        errors: err.errors,
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/logout');
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  user: null,
  roles: [],
  permissions: [],
  isSuperAdmin: false,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    resetAuthState(state) {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.isSuperAdmin = false;
      state.isAuthenticated = false;
      state.initialized = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.roles = action.payload.roles || [];
        state.permissions = action.payload.permissions || [];
        state.isSuperAdmin = Boolean(action.payload.isSuperAdmin);
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.roles = [];
        state.permissions = [];
        state.isSuperAdmin = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.roles = action.payload.roles || [];
        state.permissions = action.payload.permissions || [];
        state.isSuperAdmin = Boolean(action.payload.isSuperAdmin);
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.roles = [];
        state.permissions = [];
        state.isSuperAdmin = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearAuthError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
