// File: context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthResponse } from "../services/api";

export interface AuthContextType {
  user: User | null;
  loading: boolean; // ✅ Added loading state
  login: (authData: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Default is TRUE (Loading)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = sessionStorage.getItem("authUser");
        const storedToken = sessionStorage.getItem("authToken");

        if (storedUser && storedToken) {
          // I-restore ang user data
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth restoration failed", error);
        sessionStorage.removeItem("authUser");
        sessionStorage.removeItem("authToken");
      } finally {
        setLoading(false); // ✅ Tapos na mag-load, pwede na mag-render
      }
    };

    initAuth();
  }, []);

  const login = (authData: AuthResponse) => {
    const { user, token } = authData;
    setUser(user);
    sessionStorage.setItem("authUser", JSON.stringify(user));
    sessionStorage.setItem("authToken", token);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("authToken");
    window.location.href = "/"; // Force redirect to home
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated }}
    >
      {/* ✅ HABANG LOADING, WAG MAG-RENDER NG ANAK (DASHBOARD) */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
