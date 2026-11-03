import { AppLink } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { PageHead } from "../../shared/ui/PageHead";

// Shells for routes whose content arrives with ratings and reviews (Phase 3).
// Each says so honestly and offers one way forward, rather than faking content.

const homeAction = <AppLink className="button button--secondary" to="/">Back to home</AppLink>;

export function ReviewsPage() {
  return (
    <>
      <PageHead title="Reviews" />
      <EmptyState action={homeAction} text="Reviews arrive with the ratings release." title="No reviews yet" />
    </>
  );
}

export function WriteReviewPage() {
  return (
    <>
      <PageHead title="Your review" />
      <EmptyState action={homeAction} text="Rating and reviewing arrive with the ratings release." title="Reviewing isn't open yet" />
    </>
  );
}

export function PublicProfilePage({ username }: { username: string }) {
  return (
    <>
      <PageHead title={username} />
      <EmptyState
        action={<AppLink className="button button--secondary" to="/browse">Find a film to rate</AppLink>}
        text="Ratings, reviews and watchlists show here once reviewing opens."
        title="No reviews yet"
      />
    </>
  );
}

export function InfoPage({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} />
      <EmptyState action={homeAction} text="This page is being written." title="Coming soon" />
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <PageHead title="Page not found" />
      <EmptyState
        action={homeAction}
        text="That address doesn't match anything on Limereel. The link may be old, or mistyped."
        title="Nothing here"
      />
    </>
  );
}
