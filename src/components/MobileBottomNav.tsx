import { Home, LayoutDashboard, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { getPrimaryDashboardPath } from "@/lib/roleRouting";

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const dashboardPath = getPrimaryDashboardPath(roles, "/parent");
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-2 text-[11px] font-medium text-muted-foreground">
        <Link
          to="/"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 hover-scale interactive-button transition-all duration-300",
            "rounded-full px-2 py-1",
            isActive("/") && "bg-secondary/90 text-secondary-foreground shadow-[var(--shadow-soft)]"
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          to={user ? dashboardPath : "/auth"}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 hover-scale interactive-button transition-all duration-300",
            "rounded-full px-2 py-1",
            isActive(dashboardPath) && "bg-secondary/90 text-secondary-foreground shadow-[var(--shadow-soft)]"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/projects"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 hover-scale interactive-button transition-all duration-300",
            "rounded-full px-2 py-1",
            isActive("/projects") && "bg-secondary/90 text-secondary-foreground shadow-[var(--shadow-soft)]"
          )}
        >
          <Sparkles className="h-5 w-5" />
          <span>Projects</span>
        </Link>
      </div>
    </nav>
  );
};
