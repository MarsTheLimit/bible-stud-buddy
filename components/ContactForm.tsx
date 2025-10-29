"use client";
import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending...");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("Message sent!");
      setForm({ name: "", email: "", message: "" });
    } else {
      setStatus("Failed to send message");
    }
  }

return (
    <div className="container py-5">
      {/* Container for centering and max-width */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded justify-content-center text-light" // Dark background for the form container
          >
            <h3 className="text-center mb-4 text-light">Contact Us</h3> {/* Header for flair */}

            {/* Name Input */}
            <div className="mb-3">
              <label htmlFor="nameInput" className="form-label visually-hidden">Your Name</label>
              <input
                type="text"
                className="p-2 w-75 m-2 border border-light rounded border-none bg-light"
                id="nameInput"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email Input */}
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label visually-hidden">Your Email</label>
              <input
                type="email"
                className="p-2 w-75 m-2 border border-light rounded border-none bg-light"
                id="emailInput"
                placeholder="Your Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Message Textarea */}
            <div className="mb-4">
              <label htmlFor="messageTextarea" className="form-label visually-hidden">Your Message</label>
              <textarea
                className="p-2 w-75 m-2 border border-light rounded border-none bg-light"
                id="messageTextarea"
                placeholder="Your Message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
            type="submit"
            className="btn btn-primary btn-lg fw-light shadow"
            >
            Send Message
            </button>

            {/* Status Message */}
            {status && (
              <p className="text-center mt-3 small text-success">
                {status}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}