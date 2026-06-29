import type { AppRole } from "@/hooks/useUserRoles";

const ROLE_PRIORITY: AppRole[] = ["admin", "student", "school"];

const getPreferredRole = (): AppRole | null => {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem("portal:selected-role");
  if (value === "admin" || value === "student" || value === "school" || value === "parent") {
    return value as AppRole;
  }

  return null;
};

export const setPreferredDashboardRole = (role: AppRole | null) => {
  if (typeof window === "undefined") return;

  if (!role) {
    window.localStorage.removeItem("portal:selected-role");
    return;
  }

  window.localStorage.setItem("portal:selected-role", role);
};

export const getPrimaryDashboardPath = (roles: AppRole[] | undefined | null, fallback: string = "/"): string => {
  if (!roles || roles.length === 0) return fallback;

  const preferredRole = getPreferredRole();

  if (preferredRole === "admin" && roles.includes("admin")) return "/admin";
  if (preferredRole === "student" && roles.includes("student")) return "/student";
  if (preferredRole === "school" && roles.includes("school")) return "/school";
  if (preferredRole === "parent") {
    return roles.includes("student") ? "/student" : "/access-pending";
  }

  const sorted = ROLE_PRIORITY.filter((role) => roles.includes(role));
  const primary = sorted[0];

  switch (primary) {
    case "admin":
      return "/admin";
    case "student":
      return "/student";
    case "school":
      return "/school";
    default:
      return fallback;
  }
};
