import type { ReactElement } from "react";
import { CallbackPage } from "../../features/auth/CallbackPage";
import { BrowsePage } from "../../features/browse/BrowsePage";
import { HomePage } from "../../features/home/HomePage";
import { MoviePage } from "../../features/movie/MoviePage";
import {
  InfoPage,
  NotFoundPage,
  PublicProfilePage,
  ReviewsPage
} from "../../features/pages/pendingPages";
import { MyProfilePage } from "../../features/profile/MyProfilePage";
import { RatePage } from "../../features/ratings/RatePage";
import { SearchPage } from "../../features/search/SearchPage";
import { AppShell } from "../layout/AppShell";
import { RequireAuth } from "./guards";
import { useNavigation } from "./navigation";

type Route = {
  pattern: RegExp;
  /** Login is asked for only on these routes; browsing and reading never need it (SPEC §2). */
  requiresAuth?: boolean;
  render: (params: string[], search: URLSearchParams) => ReactElement;
};

// Ordered: the first match wins, so the longer /movie/:id/... paths sit above /movie/:id.
const routes: Route[] = [
  { pattern: /^\/$/, render: () => <HomePage /> },
  { pattern: /^\/search$/, render: (_, search) => <SearchPage query={search.get("q") ?? ""} /> },
  { pattern: /^\/browse$/, render: (_, search) => <BrowsePage search={search} /> },
  { pattern: /^\/movie\/(\d+)\/reviews$/, render: () => <ReviewsPage /> },
  { pattern: /^\/movie\/(\d+)\/review$/, requiresAuth: true, render: ([id]) => <RatePage key={id} tmdbMovieId={Number(id)} /> },
  { pattern: /^\/movie\/(\d+)$/, render: ([id]) => <MoviePage id={Number(id)} key={id} /> },
  { pattern: /^\/me(\/watchlist)?$/, requiresAuth: true, render: () => <MyProfilePage /> },
  { pattern: /^\/u\/([^/]+)$/, render: ([username = ""]) => <PublicProfilePage username={username} /> },
  { pattern: /^\/about$/, render: () => <InfoPage title="About Limereel" /> },
  { pattern: /^\/terms$/, render: () => <InfoPage title="Terms" /> },
  { pattern: /^\/privacy$/, render: () => <InfoPage title="Privacy" /> }
];

function resolve(path: string, search: string): { element: ReactElement; requiresAuth: boolean } {
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (match) {
      const params = match.slice(1).map((value) => decodeURIComponent(value ?? ""));
      return { element: route.render(params, new URLSearchParams(search)), requiresAuth: Boolean(route.requiresAuth) };
    }
  }
  return { element: <NotFoundPage />, requiresAuth: false };
}

export function AppRouter() {
  const { path, search } = useNavigation();

  if (path === "/login/callback") return <CallbackPage />;

  const { element, requiresAuth } = resolve(path, search);
  // Keyed by path only: changing a Browse filter or search term updates the
  // page in place instead of replaying the page-enter animation.
  return (
    <AppShell animateEnter={!/^\/movie\/\d+$/.test(path)} pageKey={path}>
      {requiresAuth ? <RequireAuth>{element}</RequireAuth> : element}
    </AppShell>
  );
}
