import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            authService
                .getMe()
                .then((res) => setUser(res.data.data))
                .catch(() => {
                    localStorage.removeItem("token");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        const { token, ...userData } = response.data.data;
        localStorage.setItem("token", token);
        setUser(userData);
        return response.data;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
