import { createContext, useContext } from "react";

import type { UserRole } from "@/types";

export interface AuthUser {
  sub: string;
  username: string;
  role: UserRole | null;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  accessToken: string | null;
  readonly role: UserRole | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
