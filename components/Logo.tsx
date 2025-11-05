"use client";
import React from "react";

export default function Logo() {
  return (
    <div className="d-flex align-items-center gap-2">
      {/* Icon */}
      <div
        className="rounded-circle d-flex align-items-center justify-content-center bg-gradient-primary-to-secondary"
        style={{
          width: "40px",
          height: "40px",
          boxShadow: "0 0 10px rgba(0,0,0,0.15)",
        }}
      >
        <i className="bi bi-book text-white"></i>
      </div>

      {/* Text */}
      <div>
        <span
          className="fw-bold"
          style={{
            fontSize: "1.25rem",
            color: "var(--bs-primary)",
          }}
        >
          Bible
        </span>
        <span
          className="fw-light"
          style={{
            fontSize: "1.25rem",
            color: "var(--bs-dark)",
          }}
        >
          Study Buddy
        </span>
      </div>
    </div>
  );
}
