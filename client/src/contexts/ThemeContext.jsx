import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "ems-theme"; // localStorage key

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("system"); // "light" | "dark" | "system"

    // Apply theme to <html> element
    const applyThemeToDocument = (value) => {
        const root = document.documentElement;
        const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

        const effectiveTheme =
            value === "system" ? (systemPrefersDark ? "dark" : "light") : value;

        if (effectiveTheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
            setTheme(stored);
            applyThemeToDocument(stored);
        } else {
            // default to system
            setTheme("system");
            applyThemeToDocument("system");
        }

        // If system theme changes & user is on "system", react to that
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (theme === "system") {
                applyThemeToDocument("system");
            }
        };
        mq.addEventListener("change", handleChange);

        return () => mq.removeEventListener("change", handleChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When user changes theme
    const changeTheme = (value) => {
        setTheme(value);
        localStorage.setItem(THEME_KEY, value);
        applyThemeToDocument(value);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeSetting = () => useContext(ThemeContext);
