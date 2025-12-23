import type { AppRole } from "@/hooks/useUserRoles";

const ROLE_PRIORITY: AppRole[] = ["admin", "school", "parent", "student"];

export const getPrimaryDashboardPath = (roles: AppRole[] | undefined | null, fallback: string = "/"): string => {
  if (!roles || roles.length === 0) return fallback;

  const sorted = ROLE_PRIORITY.filter((role) => roles.includes(role));

  const primary = sorted[0];

  switch (primary) {
    case "admin":
      return "/admin";
    case "school":
      return "/school";
    case "parent":
      return "/parent";
    case "student":
      return "/student";
    default:
      return fallback;
  }
};
