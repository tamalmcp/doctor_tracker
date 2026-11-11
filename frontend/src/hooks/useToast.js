'use client';

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';

export function useToast() {
  const dispatch = useDispatch();

  const showToast = useCallback(
    ({ title, message, variant = 'success', duration = 4000 }) => {
      dispatch(addToast({ title, message, variant, duration }));
    },
    [dispatch]
  );

  const toastSuccess = useCallback(
    (message, title = 'Success') =>
      showToast({ title, message, variant: 'success' }),
    [showToast]
  );

  const toastError = useCallback(
    (message, title = 'Error') =>
      showToast({ title, message, variant: 'danger' }),
    [showToast]
  );

  const toastWarning = useCallback(
    (message, title = 'Notice') =>
      showToast({ title, message, variant: 'warning' }),
    [showToast]
  );

  return {
    showToast,
    toastSuccess,
    toastError,
    toastWarning,
  };
}
