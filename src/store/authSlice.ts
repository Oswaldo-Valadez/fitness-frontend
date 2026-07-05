import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authApi } from '@/api/auth'
import type { LoginPayload, RegisterPayload } from '@/api/auth'
import type { User } from '@/types/models'

interface AuthState {
  user: (User & { has_profile: boolean; has_active_consents: boolean }) | null
  status: 'idle' | 'loading' | 'failed'
  initialized: boolean
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  initialized: false,
}

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  return await authApi.me()
})

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload) => {
  const data = await authApi.login(payload)
  return data.user
})

export const register = createAsyncThunk('auth/register', async (payload: RegisterPayload) => {
  const data = await authApi.register(payload)
  return data.user
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser(state) {
      state.user = null
      state.initialized = true
    },
  },
  extraReducers: (builder) => {
    // fetchMe
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload as AuthState['user']
        state.status = 'idle'
        state.initialized = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.status = 'idle'
        state.initialized = true
      })

    // login
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload as AuthState['user']
        state.status = 'idle'
        state.initialized = true
      })
      .addCase(login.rejected, (state) => {
        state.status = 'failed'
      })

    // register
    builder
      .addCase(register.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload as AuthState['user']
        state.status = 'idle'
        state.initialized = true
      })
      .addCase(register.rejected, (state) => {
        state.status = 'failed'
      })

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null
      state.initialized = true
    })
  },
})

export const { clearUser } = authSlice.actions
export default authSlice.reducer
