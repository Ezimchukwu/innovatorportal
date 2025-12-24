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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2.5 text-xs font-medium text-muted-foreground">
        <Link
          to="/"
          className={cn(
            "flex flex-1 flex-col items-center gap-1",
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-auto w-auto rounded-full bg-transparent px-0 py-0 text-[11px]",
            isActive("/") && "text-primary"
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          to={user ? dashboardPath : "/auth"}
          className={cn(
            "flex flex-1 flex-col items-center gap-1",
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-auto w-auto rounded-full bg-transparent px-0 py-0 text-[11px]",
            isActive(dashboardPath) && "text-primary"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/projects"
          className={cn(
            "flex flex-1 flex-col items-center gap-1",
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-auto w-auto rounded-full bg-transparent px-0 py-0 text-[11px]",
            isActive("/projects") && "text-primary"
          )}
        >
          <Sparkles className="h-5 w-5" />
          <span>Projects</span>
        </Link>
      </div>
    </nav>
  );
};
