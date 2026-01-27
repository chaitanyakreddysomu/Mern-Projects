import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import type { User, Role } from "@/types";
import { USERS } from "@/data/mock";

interface AuthContextType {
    user: User | null;
    login: (role: Role, userData?: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const refreshUser = async () => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("hrms_user");

        if (!token || !storedUser) return;

        try {
            const currentUser = JSON.parse(storedUser);
            let endpoint = "";

            switch (currentUser.role) {
                case "ADMIN": endpoint = "/api/admin/profile"; break;
                case "HR": endpoint = "/api/hr/profile"; break;
                case "EMPLOYEE": endpoint = "/api/employee/profile"; break;
                default: return;
            }

            const res = await apiFetch(endpoint, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const fetchedUser = data.user || data; // Handle wrapper if any

                // Preserve cache busting if image hasn't changed, or add new one
                const userWithCacheBust = {
                    ...fetchedUser,
                    profileImage: fetchedUser.profileImage
                        ? `${fetchedUser.profileImage}?t=${Date.now()}`
                        : fetchedUser.profileImage
                };

                setUser(userWithCacheBust);
                localStorage.setItem("hrms_user", JSON.stringify(userWithCacheBust));
            } else {
                if (res.status === 401) logout();
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    useEffect(() => {
        // Check localStorage
        const storedUser = localStorage.getItem("hrms_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            // Fetch fresh data in background
            refreshUser();
        }
    }, []);

    const login = (role: Role, userData?: User) => {
        if (userData) {
            setUser(userData);
            localStorage.setItem("hrms_user", JSON.stringify(userData));
        } else {
            // Find mock user by role (Fallback/Demo)
            const mockUser = USERS.find((u) => u.role === role);
            if (mockUser) {
                setUser(mockUser);
                localStorage.setItem("hrms_user", JSON.stringify(mockUser));
            }
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("hrms_user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
