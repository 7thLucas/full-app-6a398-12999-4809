import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication";
import { getSiloamProfile } from "~/lib/siloam";
import { AppShell } from "~/components/app-shell";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

/**
 * Gates a page behind authentication + a completed Siloam profile, and wraps
 * the children in the AppShell. Redirects to /auth/login when unauthenticated
 * and to /onboarding when the profile is incomplete.
 */
export function RequireSiloam({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const profile = getSiloamProfile(user?.profile);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }
    if (!profile?.completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, isAuthenticated, profile?.completed, navigate]);

  if (loading || !isAuthenticated || !profile?.completed) {
    return <FullScreenSpinner />;
  }

  return <AppShell>{children}</AppShell>;
}
