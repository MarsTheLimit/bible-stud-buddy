"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import Navbar from "@/components/Navbar";

export default function ClientApp({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  return (
    <SupabaseProvider client={supabase}>
      <Navbar />
      {children}
    </SupabaseProvider>
  );
}