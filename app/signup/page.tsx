"use client";
import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

export default function SignupPage() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      console.error(error);
      return;
    } else {
      setMessage("Signup successful! Check your email to confirm your account.");
    }

    // if (data.user) {
    //   // Create a matching profile for this new user
    //   const { error: insertError } = await supabase.from("profiles").insert({
    //     id: data.user.id,
    //     email: data.user.email,
    //     group_join_code: null,
    //   });
    //   if (insertError) {
    //     setMessage("Unable to sign you up: an insert error has occured");
    //   }
    // }
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
        <button className="btn btn-primary w-100 mb-2" type="submit">
          Sign Up
        </button>
        {message && <p className="mt-3 text-muted text-center">{message}</p>}
      </form>
    </div>
  );
}
