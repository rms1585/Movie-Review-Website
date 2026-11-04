import { withReturnTo } from "../../features/auth/returnTo";
import { useAuth } from "../providers/AuthProvider";
import { AppLink, useNavigation } from "../router/navigation";
import { UserMenu } from "./UserMenu";

/** Account pages that would only link back to themselves from the header. */
const ACCOUNT_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password", "/activate"]);

export function AccountButton() {
  const { status } = useAuth();
  const { path, search } = useNavigation();

  if (status === "authenticated") return <UserMenu />;

  // Log in carries the current page along, so signing in lands back here.
  const returnTo = ACCOUNT_PATHS.has(path) ? "/" : `${path}${search}`;

  return (
    <div className="account-buttons">
      {path !== "/signup" && (
        <AppLink className="button button--secondary button--sm" to={withReturnTo("/signup", returnTo)}>Sign up</AppLink>
      )}
      {path !== "/login" && (
        <AppLink className="button button--primary button--sm" to={withReturnTo("/login", returnTo)}>Log in</AppLink>
      )}
    </div>
  );
}
