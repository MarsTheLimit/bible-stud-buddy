"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function LoginClient() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setMessage("Login succeeded, but no session found — try refreshing.");
      return;
    }

    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking profile:", selectError);
    }

    if (!existingProfile) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        group_join_code: null,
      });

      if (insertError) {
        console.error("Profile creation error:", insertError);
        setMessage("Login succeeded, but profile creation failed.");
      } else {
        console.log("Profile created for user:", user.email);
      }
    }

    setMessage("Logged in successfully!");
    router.push("/dashboard");
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <input
          className="form-control mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="form-control mb-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary w-100 mb-2" type="submit">
          Login
        </button>
      </form>
      {message && <p className="mt-3 text-muted text-center">{message}</p>}
    </div>
  );
}
