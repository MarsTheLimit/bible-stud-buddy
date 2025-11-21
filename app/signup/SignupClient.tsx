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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Signup error:", error.message);
        setMessage(error.message);
        return;
      }

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
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="fw-bold mb-2">Create Account</h1>
                  <p className="text-muted">Join us today and get started</p>
                </div>

                <form onSubmit={handleSignup}>
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
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <input
                      id="password"
                      className="form-control form-control-lg"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <small className="text-muted">Must be at least 6 characters</small>
                  </div>

                  <button
                    className="btn btn-primary btn-lg w-100 mb-3"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>

                  {message && (
                    <div className={`alert ${message.includes("successful") ? "alert-success" : "alert-danger"} text-center`} role="alert">
                      {message}
                    </div>
                  )}
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Already have an account?{" "}
                    <a href="/login" className="text-decoration-none fw-semibold">
                      Sign In
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