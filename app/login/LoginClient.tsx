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
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

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
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="fw-bold mb-2">Welcome Back</h1>
                  <p className="text-muted">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      id="email"
                      className="form-control form-control-lg"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label htmlFor="password" className="form-label fw-semibold mb-0">
                        Password
                      </label>
                      {/* <a href="/forgot-password" className="text-decoration-none small">
                        Forgot password?
                      </a> */}
                    </div>
                    <input
                      id="password"
                      className="form-control form-control-lg"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-lg w-100 mb-3"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {message && (
                    <div className={`alert ${message.includes("successfully") ? "alert-success" : "alert-danger"} text-center`} role="alert">
                      {message}
                    </div>
                  )}
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don&apos;t have an account?{" "}
                    <a href="/signup" className="text-decoration-none fw-semibold">
                      Sign Up
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}