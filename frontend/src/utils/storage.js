const TOKEN_KEY = 'ai_smart_lms_token';
const USER_KEY = 'ai_smart_lms_user';
const REMEMBER_KEY = 'ai_smart_lms_remember';

const stores = [localStorage, sessionStorage];

const getStoredValue = (key) => {
  for (const store of stores) {
    const value = store.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
};

const setStoredValue = (key, value, remember = true) => {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  other.removeItem(key);
  target.setItem(key, value);
};

const clearStoredValue = (key) => {
  for (const store of stores) {
    store.removeItem(key);
  }
};

export const storage = {
  getRemember: () => getStoredValue(REMEMBER_KEY) !== 'false',
  setRemember: (remember) => setStoredValue(REMEMBER_KEY, String(Boolean(remember)), remember),
  getToken: () => getStoredValue(TOKEN_KEY),
  setToken: (token, remember = true) => setStoredValue(TOKEN_KEY, token, remember),
  clearToken: () => clearStoredValue(TOKEN_KEY),
  getUser: () => {
    const user = getStoredValue(USER_KEY);
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      clearStoredValue(USER_KEY);
      return null;
    }
  },
  setUser: (user, remember = true) =>
    setStoredValue(USER_KEY, JSON.stringify(user), remember),
  clearUser: () => clearStoredValue(USER_KEY),
  clearAuth: () => {
    clearStoredValue(TOKEN_KEY);
    clearStoredValue(USER_KEY);
    clearStoredValue(REMEMBER_KEY);
  },
};
