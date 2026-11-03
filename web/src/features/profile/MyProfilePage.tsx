import { AppLink } from "../../app/router/navigation";
import { Avatar, AvatarSkeleton } from "../../shared/ui/Avatar";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { fullName, initials, useCurrentUser } from "./useCurrentUser";

/** The signed-in user's own profile (/me). RequireAuth guarantees a session before this renders. */
export function MyProfilePage() {
  const me = useCurrentUser();
  const user = me.data;
  const name = fullName(user) || user?.email || "Your profile";

  return (
    <>
      {me.isError ? (
        <div className="profile-head">
          <h1>Your profile</h1>
          <ErrorState
            isRetrying={me.isFetching}
            message="We couldn't load your profile. Try again shortly."
            onRetry={() => void me.refetch()}
          />
        </div>
      ) : me.isPending ? (
        <div aria-busy="true" className="profile-head">
          <AvatarSkeleton size="lg" />
          <div className="profile-head__text">
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
          <p className="sr-only" role="status">Loading your profile…</p>
        </div>
      ) : (
        <div className="profile-head">
          <Avatar imageUrl={user?.profileImageUrl} initials={initials(user)} size="lg" />
          <div className="profile-head__text">
            <h1>{name}</h1>
            {/* Only ever on your own profile; public reviewer pages never show an email. */}
            {user?.email && name !== user.email && <p className="profile-head__email">{user.email}</p>}
          </div>
        </div>
      )}

      <EmptyState
        action={<AppLink className="button button--secondary" to="/browse">Find a film to rate</AppLink>}
        text="Your ratings, reviews and watchlist will show here once reviewing opens."
        title="No reviews yet"
      />
    </>
  );
}
