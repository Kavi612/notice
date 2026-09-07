import { useState } from "react";
import {
  Archive,
  Bell,
  CalendarDays,
  ChevronDown,
  Landmark,
  LayoutDashboard,
  LogOut,
  Plus,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { currentUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/hod";
  const adminNavigation = [
    { icon: LayoutDashboard, label: "Dashboard", path: workspaceBase },
    { icon: Plus, label: "Create Notice", path: `${workspaceBase}/create-notice` },
    { icon: Users, label: "Users", path: `${workspaceBase}/users` },
    { icon: Bell, label: "Notices", path: `${workspaceBase}/notices` },
    { icon: Archive, label: "Archive", path: `${workspaceBase}/archive` },
  ] as const;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const currentDate = new Date();
  const academicYearStart =
    currentDate.getMonth() >= 5
      ? currentDate.getFullYear()
      : currentDate.getFullYear() - 1;
  const academicYear = `${academicYearStart}–${academicYearStart + 1}`;
  const displayName = currentUser?.username ?? "HOD";
  const profileInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[16rem_1fr]">
      <aside
        aria-label="HOD navigation"
        className="flex border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-soft backdrop-blur-md md:sticky md:top-0 md:h-screen md:flex-col md:border-b-0 md:border-r md:px-5 md:py-6"
      >
        <div className="flex shrink-0 items-center gap-3 px-1">
          <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-md">
            <Landmark aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              Notice Portal
            </p>
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400">
              HOD Workspace
            </p>
          </div>
        </div>
        <nav
          aria-label="HOD workspace"
          className="ml-5 flex gap-1 overflow-x-auto md:ml-0 md:mt-8 md:flex-col"
        >
          {adminNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive && "bg-indigo-50 text-indigo-700 shadow-sm",
                  )
                }
                end={item.path === workspaceBase}
                key={item.path}
                to={item.path}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="relative mt-auto hidden md:block">
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-xl border bg-white shadow-soft">
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut aria-hidden="true" className="size-3.5" />
                Sign out
              </button>
            </div>
          )}

          <button
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-soft transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white">
              {profileInitial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {displayName}
              </span>
              <span className="block truncate text-[0.65rem] text-slate-400">
                Head of Department
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3.5 text-slate-400 transition-transform",
                isProfileMenuOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 shadow-sm backdrop-blur-md lg:px-8">
          <p className="text-sm font-semibold text-slate-800">
            HOD Administration
          </p>
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
            >
              <Bell aria-hidden="true" className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-rose-500" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border px-3 py-2 sm:flex">
              <CalendarDays
                aria-hidden="true"
                className="size-4 text-indigo-500"
              />
              <div>
                <p className="text-[0.55rem] uppercase tracking-wider text-slate-400">
                  Academic Year
                </p>
                <p className="text-[0.65rem] font-medium text-slate-700">
                  {academicYear}
                </p>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="size-3 text-slate-400"
              />
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
