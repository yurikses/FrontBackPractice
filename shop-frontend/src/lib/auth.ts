const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export const auth = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
  },

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(ACCESS_KEY),
};
