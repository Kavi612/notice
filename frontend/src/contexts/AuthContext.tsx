import {
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  APP_ROLES,
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "@/contexts/auth-context";
import { decodeIdToken, login as authenticate } from "@/lib/authService";
import type { UserRole } from "@/types";

const AUTH_STORAGE_KEY = "notice-portal-auth";

interface StoredAuth {
  accessToken: string;
  idToken?: string;
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
      idToken: typeof parsed.idToken === "string" ? parsed.idToken : undefined,
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
  // Matching exact priority order from backend/src/middleware/auth.js
  if (groups.includes("PRINCIPAL")) {
    return "PRINCIPAL";
  }
  if (groups.includes("ADMIN")) {
    return "ADMIN";
  }
  if (groups.includes("HOD")) {
    return "HOD";
  }
  if (groups.includes("FACULTY")) {
    return "FACULTY";
  }
  if (groups.includes("STUDENT")) {
    return "STUDENT";
  }
  return APP_ROLES.find((role) => groups.includes(role)) ?? null;
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
        idToken: tokens.idToken,
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
