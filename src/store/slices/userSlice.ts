import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  user: {
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
    email: string | null;
    preferred_username: string | null;
    phone_number: string | null;
    birthdate: string | null;
    isAdmin: boolean;
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  cartCount: number;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  cartCount: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<UserState['user']>) => {
      console.log("this is action",action.payload)
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.cartCount = 0;
    },
    setCartCount: (state, action: PayloadAction<number>) => {
      state.cartCount = action.payload;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setCartCount } = userSlice.actions;
export default userSlice.reducer; 