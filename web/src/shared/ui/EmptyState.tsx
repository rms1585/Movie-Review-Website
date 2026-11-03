import type { ReactNode } from "react";
import { LimereelSymbol } from "./Logo";

type EmptyStateProps = {
  title: string;
  text: string;
  /** design.md §7.15: never a dead end, so one next action is required. */
  action: ReactNode;
};

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <LimereelSymbol className="empty-state__mark" />
      {/* An h2 in document order under the page's h1, set at h3 size per design.md §7.15. */}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{text}</p>
      <div className="empty-state__action">{action}</div>
    </section>
  );
}
