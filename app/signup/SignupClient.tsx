"use client";
import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

export default function SignupClient() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Attempt to sign the user up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Signup error:", error.message);
        setMessage(error.message);
        return;
      }

      // Successful signup: show message to confirm email
      if (data.user) {
        setMessage("Signup successful! Please check your email to confirm your account.");
      } else {
        setMessage("Signup initiated. Please check your email for confirmation.");
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4 text-center">Sign Up</h1>
      <form onSubmit={handleSignup} className="w-50 mx-auto">
        <input
          className="form-control w-100 mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="form-control w-100 mb-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="btn btn-primary w-100 mb-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Please wait..." : "Sign Up"}
        </button>

        {message && <p className="mt-3 text-muted text-center">{message}</p>}
      </form>
    </div>
  );
}
