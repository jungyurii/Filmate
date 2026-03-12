export const storage = {
  get(key, fallback = "") {
    try {
      const v = localStorage.getItem(key);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  },
  getJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (!v) return fallback;
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  },
};
