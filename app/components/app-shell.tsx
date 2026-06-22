import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { useAuth } from "~/modules/authentication";
import { getSiloamProfile, roleLabel, type SiloamRole } from "~/lib/siloam";
import { cn } from "~/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: SiloamRole[] | "all";
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z",
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  tasks: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <Icon d={ICONS.dashboard} />, roles: "all" },
  { to: "/evaluations/new", label: "New Evaluation", icon: <Icon d={ICONS.upload} />, roles: "all" },
  { to: "/evaluations", label: "Evaluations", icon: <Icon d={ICONS.list} />, roles: "all" },
  { to: "/action-plans", label: "Action Plans", icon: <Icon d={ICONS.tasks} />, roles: "all" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { config } = useConfigurables();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = getSiloamProfile(user?.profile);
  const role = (profile?.role ?? "staff") as SiloamRole;

  const appName = config.appName || "Siloam";
  const items = NAV.filter((i) => i.roles === "all" || !i.roles || (i.roles as SiloamRole[]).includes(role));

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/auth/login";
    }
  }

  const initials = (profile?.fullName || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            {appName.charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
              {appName}
            </div>
            <div className="text-[11px] text-sidebar-foreground/60">Quality Evaluation</div>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{profile?.fullName || user?.username}</div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">{roleLabel(role)}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-sidebar-border px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (mobile + context) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[var(--navbar-background)] px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold md:hidden">
              {appName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ fontFamily: "var(--heading-font)" }}>
                {profile?.hospital || "Siloam Hospitals"}
              </div>
              <div className="text-[11px] text-muted-foreground">{profile?.unit || "All Units"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/evaluations/new")}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              + New
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
