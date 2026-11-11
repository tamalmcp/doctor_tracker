import { createSlice } from '@reduxjs/toolkit';

let nextToastId = 1;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    sidebarCollapsed: false,
  },
  reducers: {
    addToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ title, message, variant = 'success', duration = 4000 }) {
        return {
          payload: {
            id: nextToastId++,
            title:
              title ||
              (variant === 'danger'
                ? 'Error'
                : variant === 'warning'
                ? 'Notice'
                : 'Success'),
            message,
            variant,
            duration,
          },
        };
      },
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { addToast, removeToast, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
