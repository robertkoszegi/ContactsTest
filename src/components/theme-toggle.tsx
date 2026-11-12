import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  getServerTheme,
  getTheme,
  subscribeToTheme,
  toggleTheme,
} from "@/lib/theme";

export const ThemeToggle = () => {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    getServerTheme
  );
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      aria-label={label}
      className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-2"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
};
