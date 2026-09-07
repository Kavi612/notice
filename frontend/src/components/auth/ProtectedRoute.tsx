import { ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  allowedRoles: readonly UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { currentUser, role } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/login"
      />
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-lg border bg-card p-10 text-center shadow-soft">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <ShieldAlert aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Unauthorized
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your account does not have permission to access this area.
          </p>
          <Link
            className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            to="/login"
          >
            Return to sign in
          </Link>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
