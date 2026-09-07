import {
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "@/contexts/auth-context";
import { decodeIdToken, login as authenticate } from "@/lib/authService";
import type { UserRole } from "@/types";

const APP_ROLES = ["HOD", "ADMIN", "FACULTY", "STUDENT"] as const;
const AUTH_STORAGE_KEY = "notice-portal-auth";

interface StoredAuth {
  accessToken: string;
  currentUser: AuthUser;
}

function isUserRole(value: unknown): value is UserRole {
  return APP_ROLES.some((role) => role === value);
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    const user = parsed.currentUser;
    if (
      typeof parsed.accessToken !== "string" ||
      !user ||
      typeof user.sub !== "string" ||
      typeof user.username !== "string" ||
      (user.role !== null && !isUserRole(user.role))
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      currentUser: user,
    };
  } catch {
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth | null) {
  if (!auth) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function resolveRoleFromGroups(groups: string[]): AuthUser["role"] {
  return (
    APP_ROLES.find((role) => groups.includes(role)) ?? null
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const storedAuth = readStoredAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    storedAuth?.currentUser ?? null,
  );
  const [accessToken, setAccessToken] = useState<string | null>(
    storedAuth?.accessToken ?? null,
  );

  const login = useCallback(
    async (username: string, password: string): Promise<AuthUser> => {
      const tokens = await authenticate(username, password);
      const claims = decodeIdToken(tokens.idToken);
      const user: AuthUser = {
        sub: claims.sub,
        username: claims.username,
        role: resolveRoleFromGroups(claims.groups),
      };

      setAccessToken(tokens.accessToken);
      setCurrentUser(user);
      writeStoredAuth({
        accessToken: tokens.accessToken,
        currentUser: user,
      });

      return user;
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAccessToken(null);
    writeStoredAuth(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      accessToken,
      get role() {
        return currentUser?.role ?? null;
      },
      login,
      logout,
      signOut: logout,
    }),
    [accessToken, currentUser, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
