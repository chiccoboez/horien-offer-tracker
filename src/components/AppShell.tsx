import { Link } from "@tanstack/react-router";
import { BarChart3, Building2, FolderKanban, LayoutDashboard, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/horien-logo.svg";
import { useOffersRealtime } from "@/lib/offers";
import { useCustomersRealtime } from "@/lib/customers";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/offerte", label: "Gestione Offerte", icon: ListChecks },
  { to: "/statistiche", label: "Statistiche", icon: BarChart3 },
  { to: "/clienti", label: "Clienti", icon: Building2 },
  { to: "/progetti", label: "Progetti", icon: FolderKanban },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useOffersRealtime();
  useCustomersRealtime();
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div className="flex flex-col gap-3 border-b border-sidebar-border p-5">
          <div className="w-fit rounded-md bg-card px-3 py-2"><img src={logo} alt="Horien" className="h-7" /></div>
          <p className="text-xs font-bold tracking-[0.2em] text-sidebar-primary">HORIEN OFFER TRACKER</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to !== "/clienti" }}
              className="flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
