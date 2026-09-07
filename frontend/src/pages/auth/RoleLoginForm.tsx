import {
  type FormEvent,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Eye,
  EyeOff,
  IdCard,
  Landmark,
  LockKeyhole,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface LoginFormState {
  identifier: string;
  password: string;
}

interface RoleLoginFormProps {
  identifierAutocomplete: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierType: "email" | "text";
  role: UserRole;
  title: string;
}

const initialFormState: LoginFormState = {
  identifier: "",
  password: "",
};

const roleStyles: Record<
  UserRole,
  { badge: string; button: string; highlight: string }
> = {
  ADMIN: {
    badge: "bg-indigo-50 text-indigo-600",
    button:
      "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    highlight: "text-violet-400",
  },
  HOD: {
    badge: "bg-indigo-50 text-indigo-600",
    button:
      "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    highlight: "text-violet-400",
  },
  FACULTY: {
    badge: "bg-blue-50 text-blue-600",
    button:
      "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
    highlight: "text-blue-400",
  },
  STUDENT: {
    badge: "bg-emerald-50 text-emerald-600",
    button:
      "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
    highlight: "text-emerald-400",
  },
};

const roleDestinations: Record<UserRole, string> = {
  ADMIN: "/admin",
  HOD: "/hod",
  FACULTY: "/faculty",
  STUDENT: "/student",
};

export function RoleLoginForm({
  identifierAutocomplete,
  identifierLabel,
  identifierPlaceholder,
  identifierType,
  role,
  title,
}: RoleLoginFormProps) {
  const [formState, setFormState] =
    useState<LoginFormState>(initialFormState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const styles = roleStyles[role];
  const IdentifierIcon = identifierType === "email" ? Mail : IdCard;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const signedInUser = await login(
        formState.identifier,
        formState.password,
      );

      if (!signedInUser.role) {
        logout();
        setAuthError("Your account does not have an assigned role.");
        return;
      }

      navigate(roleDestinations[signedInUser.role]);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Login failed, please try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[1.02fr_0.98fr] lg:overflow-hidden">
      <section className="relative hidden overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950 p-8 text-white lg:flex lg:flex-col xl:p-10">
        <div
          aria-hidden="true"
          className="absolute right-8 top-7 grid grid-cols-4 gap-2 opacity-15"
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              className="size-1 rounded-full bg-indigo-300"
              key={index}
            />
          ))}
        </div>
        <Landmark
          aria-hidden="true"
          className="absolute -bottom-12 right-0 size-80 text-white/[0.035]"
          strokeWidth={0.8}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-indigo-600 text-white shadow-sm">
            <Landmark aria-hidden="true" className="size-5.5" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight">
              Department Notice Portal
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              AWS-based academic communication
            </p>
          </div>
        </div>

        <div className="relative my-auto max-w-lg">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">
            <Shield aria-hidden="true" className="size-4" />
            Secure role access
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Professional notices from source information{" "}
            <span className={styles.highlight}>to students.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            Access the workspace assigned to your departmental role with
            secure authentication.
          </p>

          <ul className="mt-7 space-y-3">
            <li className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-indigo-300">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <span>
                <strong className="block font-medium text-white">
                  Role-based Access
                </strong>
                Secure login for authorized departmental users only.
              </span>
            </li>
            <li className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-indigo-300">
                <LockKeyhole aria-hidden="true" className="size-4" />
              </span>
              <span>
                <strong className="block font-medium text-white">
                  Protected &amp; Private
                </strong>
                Your data and communications remain protected.
              </span>
            </li>
            <li className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-indigo-300">
                <Bell aria-hidden="true" className="size-4" />
              </span>
              <span>
                <strong className="block font-medium text-white">
                  Stay Updated
                </strong>
                Manage, publish, and receive important notices.
              </span>
            </li>
          </ul>
        </div>

        <div className="relative flex max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <p className="text-[0.7rem] leading-5 text-slate-300">
            <strong className="block font-medium text-white">
              Your security is our priority.
            </strong>
            Enterprise-grade protection for academic communication.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-8 sm:px-10 lg:min-h-0">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 size-64 rounded-full border border-indigo-100/50 bg-indigo-50/70"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -right-24 size-80 rounded-full bg-violet-50/60"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-5 right-6 grid grid-cols-4 gap-2 opacity-15"
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              className="size-1 rounded-full bg-indigo-500"
              key={index}
            />
          ))}
        </div>

        <div className="relative w-full max-w-md">
          <Button
            asChild
            className="-ml-3 mb-4"
            size="sm"
            variant="ghost"
          >
            <Link to="/login">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Choose another role
            </Link>
          </Button>

          <Card className="rounded-xl border-slate-200/80 bg-white/95 shadow-soft">
            <div
              className={cn(
                "h-0.5 rounded-t-xl",
                styles.button,
              )}
            />
            <CardHeader className="space-y-3 p-7 pb-5">
              <span
                className={cn(
                  "w-fit rounded-full px-3 py-1 text-[0.65rem] font-semibold",
                  styles.badge,
                )}
              >
                {role}
              </span>
              <CardTitle className="text-2xl text-slate-950">
                {title}
              </CardTitle>
              <CardDescription className="text-xs">
                Enter your authorized credentials to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 pb-7">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor={`${role.toLowerCase()}-identifier`}>
                    {identifierLabel}
                  </Label>
                  <div className="relative">
                    <IdentifierIcon
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      autoComplete={identifierAutocomplete}
                      className="pl-9"
                      disabled={isSubmitting}
                      id={`${role.toLowerCase()}-identifier`}
                      name="identifier"
                      onChange={(event) => {
                        setAuthError(null);
                        setFormState((current) => ({
                          ...current,
                          identifier: event.target.value,
                        }));
                      }}
                      placeholder={identifierPlaceholder}
                      required
                      type={identifierType}
                      value={formState.identifier}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${role.toLowerCase()}-password`}>
                    Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      autoComplete="current-password"
                      className="px-9"
                      disabled={isSubmitting}
                      id={`${role.toLowerCase()}-password`}
                      name="password"
                      onChange={(event) => {
                        setAuthError(null);
                        setFormState((current) => ({
                          ...current,
                          password: event.target.value,
                        }));
                      }}
                      placeholder="Enter your password"
                      required
                      type={isPasswordVisible ? "text" : "password"}
                      value={formState.password}
                    />
                    <button
                      aria-label={
                        isPasswordVisible
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() =>
                        setIsPasswordVisible((current) => !current)
                      }
                      type="button"
                    >
                      {isPasswordVisible ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                    <input
                      checked={rememberMe}
                      className="size-3.5 accent-indigo-600"
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      type="checkbox"
                    />
                    Remember me
                  </label>
                  <button
                    className="text-xs font-medium text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                  >
                    Forgot password?
                  </button>
                </div>

                {authError && (
                  <div
                    className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                    role="alert"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 size-3.5 shrink-0"
                    />
                    {authError}
                  </div>
                )}

                <Button
                  className={cn("w-full text-white", styles.button)}
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mx-auto mt-5 flex max-w-sm items-start gap-3 text-xs text-slate-500">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Shield aria-hidden="true" className="size-4" />
            </span>
            <p className="leading-5">
              <strong className="block font-medium text-slate-700">
                Only authorized {role.toLowerCase()} users can access this
                portal.
              </strong>
              All activities are monitored and logged.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
