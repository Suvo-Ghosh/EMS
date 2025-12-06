import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token") || "");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!token); // if token exists, verify with /me first

    // Load current user if token exists
    useEffect(() => {
        const fetchMe = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get("/api/auth/me");
                if (data.ok && data.user) {
                    setUser({
                        ...data.user,
                        permissions: Array.isArray(data.user.permissions)
                            ? data.user.permissions
                            : [],
                    });
                } else {
                    setUser(null);
                    setToken("");
                    localStorage.removeItem("token");
                }
            } catch (err) {
                console.error("Error fetching current user:", err);
                setUser(null);
                setToken("");
                localStorage.removeItem("token");
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [token]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/api/auth/login", { email, password });

            if (!data.ok) {
                throw new Error(data.message || "Login failed");
            }

            setToken(data.token);
            localStorage.setItem("token", data.token);

            setUser({
                ...data.user,
                permissions: Array.isArray(data.user.permissions)
                    ? data.user.permissions
                    : [],
            });

            return { ok: true };
        } catch (err) {
            console.error("Login error:", err);
            return {
                ok: false,
                message:
                    err.response?.data?.message || "Invalid email or password",
            };
        }
    };

    const logout = () => {
        setUser(null);
        setToken("");
        localStorage.removeItem("token");
    };

    const updateUser = (updatedUser) => {
        setUser((prev) => {
            if (!prev) {
                return {
                    ...updatedUser,
                    permissions: Array.isArray(updatedUser?.permissions)
                        ? updatedUser.permissions
                        : [],
                };
            }

            const merged = { ...prev, ...updatedUser };
            if (!Array.isArray(merged.permissions)) {
                merged.permissions = [];
            }
            return merged;
        });
    };

    // 🔹 Permission helpers
    const hasPermission = (perm) => {
        if (!user || !perm) return false;
        const perms = Array.isArray(user.permissions) ? user.permissions : [];
        return perms.includes("*") || perms.includes(perm);
    };

    const hasAnyPermission = (permList = []) => {
        if (!user) return false;
        if (!permList.length) return true;
        return permList.some((p) => hasPermission(p));
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        hasPermission,
        hasAnyPermission,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
