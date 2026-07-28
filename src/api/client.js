import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // needed so the refresh-token cookie is sent
});

// The access token lives in memory only (never localStorage) - this
// function is called by the auth context whenever it changes.
let currentAccessToken = null;
export function setAccessToken(token) {
  currentAccessToken = token;
}

client.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

export default client;
