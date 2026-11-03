import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { NavigationProvider } from "../router/navigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

// LazyMotion keeps Motion's features out of the first-load bundle
// (animation.md §2). The poster-to-film transition needs domMax's layout
// animation, so the full set loads in the background right after first
// paint. reducedMotion="user" follows the OS setting.
const loadMotionFeatures = () => import("../../lib/motionFeatures").then((module) => module.default);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <NavigationProvider>{children}</NavigationProvider>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
