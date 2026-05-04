import { createContext, useContext, useEffect, useState } from 'react';

const AUTH_TOKEN_KEY = 'wastedhours_token';
const AUTH_USER_KEY = 'wastedhours_user';

const AuthContext = createContext(null);

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function getInitialUser() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(AUTH_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(getAuthToken);

  useEffect(() => {
    const currentUser = getInitialUser();
    const currentToken = getAuthToken();
    setUser(currentUser);
    setToken(currentToken);
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setStoredUser(userData);
    setAuthToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
