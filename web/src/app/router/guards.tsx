import type { ReactNode } from "react";
import { withReturnTo } from "../../features/auth/returnTo";
import { EmptyState } from "../../shared/ui/EmptyState";
import { PageHead } from "../../shared/ui/PageHead";
import { StatusLine } from "../../shared/ui/StatusLine";
import { useAuth } from "../providers/AuthProvider";
import { AppLink, useNavigation } from "./navigation";

// A protected page asks for sign-in in place instead of bouncing to a login
// route, so the visitor keeps their address and returns to it afterwards.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { path, search } = useNavigation();

  if (status === "loading") return <StatusLine label="Checking your session…" />;
  if (status === "authenticated") return <>{children}</>;

  const action = <AppLink className="button button--primary" to={withReturnTo("/login", `${path}${search}`)}>Log in</AppLink>;

  return (
    <>
      <PageHead title="Sign in to continue" />
      <EmptyState
        action={action}
        text="This page is yours, so we need to know it's you."
        title="This page needs an account"
      />
    </>
  );
}
