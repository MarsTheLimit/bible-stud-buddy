"use client";

import { useUserAccount } from '@/lib/hooks/useUserAccount';
import ProPill from './ProPill';

export default function Navbar() {
  const { 
    supabase,
    user, 
    accountData, 
    loading, 
    accessLevel, 
    hasActiveTrial,
    hasProAccess 
  } = useUserAccount();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white py-3">
      <div className="container px-5">
        <a className="navbar-brand" href="/">
          <span className="fw-bolder text-primary">
            Bible Study Buddy
          </span>
        </a>
        <ProPill accessLevel={accessLevel} hasActiveTrial={hasActiveTrial} />
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 small fw-bolder">
            <li className="nav-item">
              <a className="nav-link" href="/">Home</a>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <a className="nav-link" href="/dashboard">Dashboard</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/groups">Groups</a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    href="/login"
                    onClick={async (e) => {
                      e.preventDefault();
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                  >
                    Logout
                  </a>
                </li>
              </>
            )}
            {!user && (
              <>
                <li className="nav-item">
                  <a className="nav-link" href="/login">Login</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/signup">Signup</a>
                </li>
              </>
            )}
            <li className="nav-item">
              <a className="nav-link" href="/pricing">Pricing</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}