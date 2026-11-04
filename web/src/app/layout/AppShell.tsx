import { m } from "motion/react";
import type { ReactNode } from "react";
import { distance, duration, ease } from "../../lib/motion";
import { cn } from "../../lib/utils";
import { ToastHost } from "../../shared/ui/Toast";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type AppShellProps = {
  children: ReactNode;
  pageKey: string;
  /** Off for pages that choreograph their own entrance, such as the film page's travelling poster. */
  animateEnter?: boolean;
  /** For pages with an edge-to-edge band: they place their own containers. */
  fullBleed?: boolean;
};

// The header and footer stay put; only the page content enters (animation.md
// §4.2). There is deliberately no exit animation, so a click is never held
// back waiting for the old page to leave.
export function AppShell({ children, pageKey, animateEnter = true, fullBleed = false }: AppShellProps) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main className={cn("app-main", fullBleed && "app-main--bleed")} id="main" tabIndex={-1}>
        <m.div
          animate={{ opacity: 1, y: 0 }}
          className={fullBleed ? undefined : "container"}
          initial={animateEnter ? { opacity: 0, y: distance.sm } : false}
          key={pageKey}
          transition={{ duration: duration.base, ease: ease.enter }}
        >
          {children}
        </m.div>
      </main>
      <SiteFooter />
      <ToastHost />
    </>
  );
}
