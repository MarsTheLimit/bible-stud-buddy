"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type ContextType = {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
};

const SupabaseContext = createContext<ContextType | undefined>(undefined);

export function SupabaseProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [supabase] = useState(() => client);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // initial load
    let mounted = true;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (mounted) setUser(user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // subscribe to changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used within a SupabaseProvider");
  return ctx;
}
