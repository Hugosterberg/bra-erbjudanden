"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

// Theme preference is a pure UI setting persisted in a cookie (read by the
// inline script in the root layout before hydration to avoid theme flashes).
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function subscribeToThemeClass(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains("dark");
}

function getServerIsDark() {
  // Dark mode is the default experience; users opt into light.
  return true;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToThemeClass,
    getIsDark,
    getServerIsDark,
  );

  function toggleTheme() {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.cookie = `theme=${nextIsDark ? "dark" : "light"}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-8"
      onClick={toggleTheme}
      aria-label={isDark ? "Byt till ljust läge" : "Byt till mörkt läge"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
