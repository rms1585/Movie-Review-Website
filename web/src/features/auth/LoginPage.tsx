import { useEffect } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useNavigation } from "../../app/router/navigation";
import { AccountHead, AccountLayout } from "./AccountLayout";
import { LoginForm } from "./LoginForm";
import { safeReturnTo } from "./returnTo";

/** /login?returnTo=… — signs in on Limereel and goes back where the person was (SPEC §7.9). */
export function LoginPage({ returnTo }: { returnTo: string | null }) {
  const { status } = useAuth();
  const { navigate } = useNavigation();
  const target = safeReturnTo(returnTo);

  // Someone already signed in (another tab, or Back after logging in) has nothing to do here.
  useEffect(() => {
    if (status === "authenticated") navigate(target);
  }, [navigate, status, target]);

  return (
    <AccountLayout>
      <AccountHead lede="Welcome back. Pick up where you left off." title="Log in" />
      <LoginForm onSuccess={() => navigate(target)} returnTo={target} />
    </AccountLayout>
  );
}
