"use client";

import { usePermissions as usePermissionsContext } from "@/contexts/PermissionsContext";

export function usePermissions() {
  return usePermissionsContext();
}
