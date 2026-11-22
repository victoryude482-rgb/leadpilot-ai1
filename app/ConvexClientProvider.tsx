"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { getSupabaseBrowserClient } from "../src/auth/supabase-browser";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
};

function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthState({ isLoading: false, isAuthenticated: false });
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setAuthState({
            isLoading: false,
            isAuthenticated: Boolean(session?.access_token),
          });
        }
      },
    );

    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setAuthState({
          isLoading: false,
          isAuthenticated: !error && Boolean(data.session?.access_token),
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return null;

      const result = forceRefreshToken
        ? await supabase.auth.refreshSession()
        : await supabase.auth.getSession();

      return result.data.session?.access_token ?? null;
    },
    [],
  );

  return { ...authState, fetchAccessToken };
}

function ConnectedConvexProvider({
  children,
  deploymentUrl,
}: {
  children: ReactNode;
  deploymentUrl: string;
}) {
  const client = useMemo(() => new ConvexReactClient(deploymentUrl), [deploymentUrl]);
  return (
    <ConvexProviderWithAuth client={client} useAuth={useSupabaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) return <>{children}</>;
  return (
    <ConnectedConvexProvider deploymentUrl={deploymentUrl}>
      {children}
    </ConnectedConvexProvider>
  );
}
