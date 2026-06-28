import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { getPrimaryDashboardPath } from "@/lib/roleRouting";
import { Menu, X } from "lucide-react";

export const MainNavbar = () => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const primaryDashboardPath = getPrimaryDashboardPath(roles, "/parent");
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:gap-6">
      <Link
        to="/projects"
        onClick={onClick}
        className="text-primary-foreground/80 transition-colors hover:text-secondary hover-scale"
      >
        View Projects
      </Link>
      <Link
        to="/school"
        onClick={onClick}
        className="text-primary-foreground/80 transition-colors hover:text-secondary hover-scale"
      >
        For Schools
      </Link>
      {user ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <Button asChild size="sm" variant="secondary" className="hover-scale">
            <Link to={primaryDashboardPath} onClick={onClick}>
              Go to dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClick?.();
              void handleSignOut();
            }}
            className="border-background/20 bg-background/10 text-primary-foreground hover:bg-background/20 hover-scale"
          >
            Sign out
          </Button>
        </div>
      ) : (
        <>
          <Link
            to="/auth"
            onClick={onClick}
            className="text-primary-foreground/80 transition-colors hover:text-secondary hover-scale"
          >
            Parent / School Login
          </Link>
          <Button
            asChild
            size="sm"
            className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
          >
            <Link to="/auth" onClick={onClick}>
              Enroll a Child
            </Link>
          </Button>
        </>
      )}
    </nav>
  );

  return (
    <header className="border-b border-primary/20 bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
      <div className="container flex items-center justify-between py-3 md:py-4">
        <Link to="/" className="flex items-center gap-2 hover-scale">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-background/10 ring-1 ring-background/40">
            <span className="text-lg font-semibold">AI</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">AI SUMMER HOLIDAY PROGRAM</span>
            <span className="text-xs text-primary-foreground/80">Practical AI + Creativity + Innovation</span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLinks />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex items-center rounded-full bg-background/10 p-2 text-primary-foreground hover:bg-background/20 md:hidden"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-primary/15 bg-primary/95 text-primary-foreground md:hidden">
          <div className="container pb-4 pt-2">
            <NavLinks onClick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
};
