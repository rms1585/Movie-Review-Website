import type { ReactNode } from "react";
import { FadeImage } from "../movies/components/FadeImage";
import { backdropSource } from "../movies/images";
import { useTrending } from "../movies/queries";

/**
 * The frame every account page shares (SPEC §7.9): one narrow column of
 * form on the left, a film still fading in from the right on wide screens.
 */
export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="account-page">
      <AccountArt />
      <div className="container account-page__body">
        <div className="account">{children}</div>
      </div>
    </div>
  );
}

/**
 * The top trending film's backdrop, which the home page has usually loaded
 * already; a fixed pick could disappear from TMDB. Purely decorative.
 */
function AccountArt() {
  const trending = useTrending();
  const path = trending.data?.find((movie) => movie.backdropPath)?.backdropPath;
  if (!path) return null;

  const backdrop = backdropSource(path);
  return (
    <div aria-hidden="true" className="account-page__art">
      {/* Lazy, so phones (where CSS hides the art) never download it. */}
      <FadeImage alt="" className="account-page__image" loading="lazy" sizes="60vw" src={backdrop.src} srcSet={backdrop.srcSet} />
    </div>
  );
}

type AccountMessageProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  actions: ReactNode;
};

/** A finished step: what happened, and where to go next. */
export function AccountMessage({ icon, title, children, actions }: AccountMessageProps) {
  return (
    <section aria-live="polite" className="account__sent">
      {icon}
      <h1>{title}</h1>
      <div className="account__sent-text">{children}</div>
      <div className="account__sent-actions">{actions}</div>
    </section>
  );
}

export function AccountHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {lede && <p className="page-head__lede">{lede}</p>}
    </div>
  );
}
