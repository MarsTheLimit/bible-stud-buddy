"use client";
import React from "react";

export default function Logo() {
  return (
    <div className="d-flex align-items-center gap-2">
      {/* Icon */}
      <div
        className="rounded-circle d-flex align-items-center justify-content-center"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "var(--bs-primary)",
          boxShadow: "0 0 10px rgba(0,0,0,0.15)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="white"
          viewBox="0 0 16 16"
        >
          <path d="M8.5 1.75a.75.75 0 0 0-1.5 0v12.5a.75.75 0 0 0 1.5 0V1.75zM4.5 3a.5.5 0 0 1 .5-.5h6.5A1.5 1.5 0 0 1 13 4v9a1 1 0 0 1-1 1H5a.5.5 0 0 1-.5-.5V3z" />
        </svg>
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
