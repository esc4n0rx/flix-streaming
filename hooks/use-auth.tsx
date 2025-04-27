// hooks/use-auth.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getUserInfo } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Modificado para evitar problemas de hidratação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("jellyfin_token");
        const storedUser = localStorage.getItem("jellyfin_user");

        if (!token || !storedUser) {
          setIsLoading(false);
          return;
        }

        // Usar dados do localStorage primeiro para evitar problemas de hidratação
        setUser(JSON.parse(storedUser));
        
        // Depois verificar com o servidor
        try {
          await getUserInfo();
          // Se chegou aqui, o token é válido
        } catch (error) {
          // Token inválido, fazer logout
          localStorage.removeItem("jellyfin_token");
          localStorage.removeItem("jellyfin_user");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("jellyfin_token", token);
    localStorage.setItem("jellyfin_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("jellyfin_token");
    localStorage.removeItem("jellyfin_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);