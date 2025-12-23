import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";

type UserRoleRow = Tables<"user_roles">;

export type AppRole = UserRoleRow["role"];

interface UseUserRolesResult {
  roles: AppRole[];
  isLoading: boolean;
  isError: boolean;
}

export const useUserRoles = (): UseUserRolesResult => {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserRoleRow[];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const roles = (data ?? []).map((row) => row.role);

  return {
    roles,
    isLoading,
    isError,
  };
};
