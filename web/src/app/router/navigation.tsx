import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type Location = { path: string; search: string };

type NavigationValue = Location & { navigate: (to: string) => void };

const NavigationContext = createContext<NavigationValue | undefined>(undefined);

function readLocation(): Location {
  return { path: window.location.pathname, search: window.location.search };
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Stable identity: guards and effects list `navigate` as a dependency.
  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setLocation(readLocation());
    // A new page starts at the top; Back keeps the browser's own restoration.
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
}

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; matchExact?: boolean };

/** A real link (middle-click and copy still work) that navigates in-app on a plain click. */
export function AppLink({ to, matchExact = true, onClick, ...rest }: AppLinkProps) {
  const { path, navigate } = useNavigation();
  const isCurrent = matchExact ? path === to : path.startsWith(to);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (event.defaultPrevented || isModified) return;
    event.preventDefault();
    navigate(to);
  }

  return <a aria-current={isCurrent ? "page" : undefined} href={to} onClick={handleClick} {...rest} />;
}
