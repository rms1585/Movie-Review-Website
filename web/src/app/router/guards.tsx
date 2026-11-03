import type { ReactNode } from "react";
import { isLoginConfigured } from "../../lib/blocks/config";
import { EmptyState } from "../../shared/ui/EmptyState";
import { PageHead } from "../../shared/ui/PageHead";
import { StatusLine } from "../../shared/ui/StatusLine";
import { useAuth } from "../providers/AuthProvider";
import { AppLink, useNavigation } from "./navigation";

// A protected page asks for sign-in in place instead of bouncing to a login
// route, so the visitor keeps their address and returns to it afterwards.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, login } = useAuth();
  const { path, search } = useNavigation();

  if (status === "loading") return <StatusLine label="Checking your session…" />;
  if (status === "authenticated") return <>{children}</>;

  const action = isLoginConfigured()
    ? <button className="button button--primary" onClick={() => void login(`${path}${search}`)} type="button">Log in</button>
    : <AppLink className="button button--secondary" to="/">Back to home</AppLink>;

  return (
    <>
      <PageHead title="Sign in to continue" />
      <EmptyState
        action={action}
        text={isLoginConfigured() ? "This page is yours, so we need to know it's you." : "Sign-in isn't set up yet."}
        title="This page needs an account"
      />
    </>
  );
}
