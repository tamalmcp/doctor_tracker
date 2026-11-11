'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { fetchCurrentUser } from './slices/authSlice';

function AppInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
    dispatch(fetchCurrentUser());

    const handleWindowFocus = () => {
      dispatch(fetchCurrentUser());
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [dispatch]);

  return children;
}

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
