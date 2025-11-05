"use client";

import { useUserAccount } from '@/lib/hooks/useUserAccount';
import ProPill from './ProPill';
import Link from 'next/link';
import Logo from './Logo';

export default function Navbar() {
  const { 
    supabase,
    user,
    accessLevel, 
    hasActiveTrial,
  } = useUserAccount();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white py-3">
      <div className="container px-5">
        <Link className="navbar-brand" href="/">
          <Logo />
        </Link>
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
              <Link className="nav-link" href="/">Home</Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/groups">Groups</Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link"
                    href="/login"
                    onClick={async (e) => {
                      e.preventDefault();
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                  >
                    Logout
                  </Link>
                </li>
              </>
            )}
            {!user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/signup">Signup</Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link className="nav-link" href="/pricing">Pricing</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}