import type { BlocksUser } from "@seliseblocks/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/AuthProvider";
import { blocksClient } from "../../lib/blocks/client";

/** Blocks user records carry a photo address the SDK type doesn't declare yet (checked against a live record). */
export type CurrentUser = BlocksUser & { profileImageUrl?: string | null };

export const currentUserKey = ["iam", "me"] as const;

/** The signed-in user's IAM record; idle while signed out. */
export function useCurrentUser() {
  const { status } = useAuth();
  return useQuery({
    enabled: status === "authenticated",
    queryKey: currentUserKey,
    // iam.me() wraps the record in a { data } envelope.
    queryFn: async () => ((await blocksClient.iam.me()).data ?? null) as CurrentUser | null,
    staleTime: 5 * 60_000
  });
}

export function fullName(user: CurrentUser | null | undefined): string {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
}

/** The friendliest short label: first name, else the full name, else the email. */
export function shortName(user: CurrentUser | null | undefined): string {
  return user?.firstName?.trim() || fullName(user) || user?.email || "";
}

export function initials(user: CurrentUser | null | undefined): string {
  const first = user?.firstName?.trim()[0];
  const last = user?.lastName?.trim()[0];
  if (first || last) return `${first ?? ""}${last ?? ""}`.toUpperCase();
  return (user?.email?.[0] ?? "").toUpperCase();
}
