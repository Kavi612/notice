import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Landmark,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RoleOption {
  buttonClassName: string;
  cardClassName: string;
  description: string;
  featureClassName: string;
  features: readonly string[];
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  path: string;
}

const roleOptions: readonly RoleOption[] = [
  {
    buttonClassName:
      "bg-linear-to-r from-indigo-600 to-violet-600 group-hover:from-indigo-700 group-hover:to-violet-700",
    cardClassName: "border-t-indigo-500",
    description:
      "Oversee department activities and manage the portal with complete control.",
    featureClassName: "bg-indigo-50 text-indigo-600",
    features: [
      "Monitor department communications",
      "Manage notices and approvals",
      "Access reports and analytics",
    ],
    icon: ShieldCheck,
    iconClassName: "bg-indigo-100 text-indigo-600",
    label: "HOD",
    path: "/login/hod",
  },
  {
    buttonClassName:
      "bg-linear-to-r from-blue-600 to-indigo-600 group-hover:from-blue-700 group-hover:to-indigo-700",
    cardClassName: "border-t-blue-500",
    description:
      "Create, review, schedule, and publish notices for your department.",
    featureClassName: "bg-blue-50 text-blue-600",
    features: [
      "Create and publish notices",
      "Schedule and manage timelines",
      "Track acknowledgements and responses",
    ],
    icon: GraduationCap,
    iconClassName: "bg-blue-100 text-blue-600",
    label: "Faculty",
    path: "/login/faculty",
  },
  {
    buttonClassName:
      "bg-linear-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-700 group-hover:to-teal-700",
    cardClassName: "border-t-emerald-500",
    description:
      "Stay updated with department notices and acknowledge them on time.",
    featureClassName: "bg-emerald-50 text-emerald-600",
    features: [
      "View latest department notices",
      "Acknowledge and respond",
      "Stay informed and never miss updates",
    ],
    icon: BookOpen,
    iconClassName: "bg-emerald-100 text-emerald-600",
    label: "Student",
    path: "/login/student",
  },
];

const roleHomes = {
  ADMIN: "/admin",
  HOD: "/hod",
  FACULTY: "/faculty",
  STUDENT: "/student",
} as const;

export function Login() {
  const { role } = useAuth();

  if (role && role in roleHomes) {
    return <Navigate replace to={roleHomes[role]} />;
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-linear-to-b from-white via-indigo-50/20 to-slate-50 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <header className="border-b border-white/10 bg-linear-to-r from-slate-950 via-slate-950 to-indigo-950 px-6 py-3 text-white sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-indigo-600 text-white shadow-sm">
              <Landmark aria-hidden="true" className="size-5" />
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

          <span className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-medium text-slate-300 sm:inline-flex">
            <Shield aria-hidden="true" className="size-3.5" />
            Enterprise Grade Security
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-emerald-400"
            />
          </span>
        </div>
      </header>

      <section className="relative flex flex-1 flex-col px-6 py-8 sm:px-10 lg:py-5">
        <div
          aria-hidden="true"
          className="absolute -right-28 top-8 size-72 rounded-full border border-indigo-100/70"
        />
        <div
          aria-hidden="true"
          className="absolute left-6 top-6 grid grid-cols-4 gap-2.5 opacity-30"
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              className="size-1.5 rounded-full bg-indigo-400"
              key={index}
            />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-8 right-6 grid grid-cols-4 gap-2.5 opacity-30"
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              className="size-1.5 rounded-full bg-indigo-400"
              key={index}
            />
          ))}
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              <Shield aria-hidden="true" className="size-3.5" />
              Secure role access
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">
              Choose your{" "}
              <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                portal
              </span>
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-5 text-slate-500">
              Select your departmental role to access the appropriate portal
              and manage academic communications seamlessly.
            </p>
            <span className="mx-auto mt-3 flex w-fit items-center gap-2">
              <span className="size-1.5 rounded-full bg-indigo-300" />
              <span className="h-0.5 w-8 rounded-full bg-indigo-500" />
              <span className="size-1.5 rounded-full bg-violet-400" />
            </span>
          </div>

          <div className="mx-auto mt-6 grid w-full max-w-5xl gap-5 md:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;

              return (
                <Link
                  className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  key={option.path}
                  to={option.path}
                >
                  <Card
                    className={cn(
                      "h-full rounded-2xl border-t-2 bg-white/95 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-soft",
                      option.cardClassName,
                    )}
                  >
                    <CardHeader className="h-full p-5 lg:p-6">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/60",
                          option.iconClassName,
                        )}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <CardTitle className="mt-3 text-xl text-slate-950">
                        {option.label}
                      </CardTitle>
                      <CardDescription className="min-h-12 text-xs leading-4 text-slate-500">
                        {option.description}
                      </CardDescription>
                      <ul className="mt-1 space-y-2 border-t border-slate-100 pt-3">
                        {option.features.map((feature) => (
                          <li
                            className="flex items-center gap-2.5 text-[0.7rem] leading-4 text-slate-600"
                            key={feature}
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md",
                                option.featureClassName,
                              )}
                            >
                              <CheckCircle2
                                aria-hidden="true"
                                className="size-3"
                              />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-5">
                        <span
                          className={cn(
                            "flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all group-hover:shadow-md",
                            option.buttonClassName,
                          )}
                        >
                          Continue
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>

          <p className="mt-auto flex items-center justify-center gap-2 pt-4 text-xs text-slate-400">
            <Shield aria-hidden="true" className="size-3.5" />
            Your access is protected with enterprise-grade security.
          </p>
        </div>
      </section>
    </main>
  );
}
