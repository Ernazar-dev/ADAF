import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextValue { dark: boolean; toggle: () => void; }
const ThemeContext = createContext<ThemeContextValue>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("adaf_dark") === "true");
  useEffect(() => {
    localStorage.setItem("adaf_dark", String(dark));
    dark ? document.documentElement.setAttribute("data-dark", "true") : document.documentElement.removeAttribute("data-dark");
  }, [dark]);
  return <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
