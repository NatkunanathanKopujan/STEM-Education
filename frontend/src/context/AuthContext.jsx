import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { getRoleHomePath } from '../utils/constants';
import { isTokenExpired } from '../utils/jwt';
import { storage } from '../utils/storage';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedToken = storage.getToken();
    return storedToken && !isTokenExpired(storedToken) ? storage.getUser() : null;
  });
  const [token, setToken] = useState(() => {
    const storedToken = storage.getToken();
    return storedToken && !isTokenExpired(storedToken) ? storedToken : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(Boolean(token));
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);

    try {
      const response = await authService.login(credentials);
      const remember = Boolean(credentials.rememberMe);
      storage.setRemember(remember);
      storage.setToken(response.token, remember);
      storage.setUser(response.user, remember);
      setToken(response.token);
      setUser(response.user);
      setIsSessionExpired(false);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async ({ remote = true } = {}) => {
    if (remote && storage.getToken()) {
      try {
        await authService.logout();
      } catch {
        // Local cleanup still wins if the server already rejected the session.
      }
    }

    storage.clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = { ...currentUser, ...updates };
      storage.setUser(nextUser, storage.getRemember());
      return nextUser;
    });
  }, []);

  const verifySession = useCallback(async () => {
    const storedToken = storage.getToken();

    if (!storedToken || isTokenExpired(storedToken)) {
      storage.clearAuth();
      setToken(null);
      setUser(null);
      setIsInitializing(false);
      return;
    }

    try {
      const response = await authService.verify();
      storage.setUser(response.user);
      setUser(response.user);
      setToken(storedToken);
    } catch {
      storage.clearAuth();
      setToken(null);
      setUser(null);
      setIsSessionExpired(true);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    if (isTokenExpired(token)) {
      setIsSessionExpired(true);
      logout({ remote: false });
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (isTokenExpired(token)) {
        setIsSessionExpired(true);
        logout({ remote: false });
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [logout, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role,
      isAuthenticated: Boolean(token),
      isLoading,
      isInitializing,
      isSessionExpired,
      homePath: getRoleHomePath(user?.role),
      login,
      logout,
      updateCurrentUser,
    }),
    [isInitializing, isLoading, isSessionExpired, login, logout, token, updateCurrentUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
