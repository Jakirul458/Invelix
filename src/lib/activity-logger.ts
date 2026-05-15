import { supabase } from "@/integrations/supabase/client";

/** No-op: activity / analytics logging removed per product requirements. */
export async function logOwnerActivity(_params: Record<string, unknown>): Promise<void> {
  return;
}

export async function getOwnerActivityLogs(_ownerId: string, _limit = 50): Promise<never[]> {
  return [];
}

export function formatActivityTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function getActivityLabel(type: string): string {
  return type;
}

export function getActivityColor(_type: string): string {
  return "bg-muted text-muted-foreground";
}
