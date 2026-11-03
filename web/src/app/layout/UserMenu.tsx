import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { initials, shortName, useCurrentUser } from "../../features/profile/useCurrentUser";
import { distance, duration, exitFactor } from "../../lib/motion";
import { Avatar, AvatarSkeleton } from "../../shared/ui/Avatar";
import { useAuth } from "../providers/AuthProvider";
import { useNavigation } from "../router/navigation";

/** A WAI-ARIA menu button: Enter/Space/ArrowDown open it, arrows move, Esc closes and returns focus. */
export function UserMenu() {
  const { logout } = useAuth();
  const { navigate, path } = useNavigation();
  const me = useCurrentUser();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = me.data;
  const name = shortName(user);

  useEffect(() => setIsOpen(false), [path]);

  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  function close({ returnFocus }: { returnFocus: boolean }) {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => Boolean(item));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close({ returnFocus: true });
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? items[0] : items[items.length - 1])?.focus();
    } else if (event.key === "Tab") {
      close({ returnFocus: false });
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      close({ returnFocus: false });
    }
  }

  if (me.isPending) {
    return (
      <span className="user-menu__trigger" role="status">
        <AvatarSkeleton />
        <span className="sr-only">Loading your account…</span>
      </span>
    );
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={name ? `Account menu for ${name}` : "Account menu"}
        className="user-menu__trigger"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <Avatar imageUrl={user?.profileImageUrl} initials={initials(user)} />
        {name && <span className="user-menu__name">{name}</span>}
        <ChevronDown aria-hidden="true" className="icon user-menu__chevron" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            animate={{ opacity: 1, y: 0 }}
            aria-label="Account"
            className="user-menu__list"
            exit={{ opacity: 0, transition: { duration: duration.fast * exitFactor } }}
            id={menuId}
            initial={{ opacity: 0, y: -distance.xs }}
            onKeyDown={handleMenuKeyDown}
            role="menu"
            transition={{ duration: duration.fast }}
          >
            <button
              className="user-menu__item"
              onClick={() => {
                close({ returnFocus: false });
                navigate("/me");
              }}
              ref={(node) => {
                itemRefs.current[0] = node;
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <UserRound aria-hidden="true" className="icon" />
              Your profile
            </button>
            <button
              aria-disabled={isLoggingOut}
              className="user-menu__item"
              onClick={isLoggingOut ? undefined : () => void handleLogout()}
              ref={(node) => {
                itemRefs.current[1] = node;
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <LogOut aria-hidden="true" className="icon" />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
