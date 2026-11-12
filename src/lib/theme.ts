export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_CLASS = "dark";

const listeners = new Set<() => void>();

/**
 * The `dark` class on <html> is the single source of truth. index.html applies
 * the saved (or system) preference before first paint to avoid a flash; this
 * module only reads that class and flips it.
 */
export const getTheme = (): Theme =>
  document.documentElement.classList.contains(DARK_CLASS) ? "dark" : "light";

export const getServerTheme = (): Theme => "light";

export const subscribeToTheme = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const persistTheme = (theme: Theme): void => {
  // Storage can be blocked (private windows, some embedded web viewers).
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice still applies for this session.
  }
};

export const setTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
  persistTheme(theme);
  for (const listener of listeners) {
    listener();
  }
};

export const toggleTheme = (): void => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
};
