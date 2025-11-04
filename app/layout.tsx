import Script from "next/script";
import "./css/landing-page.css";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Analytics } from "@vercel/analytics/next";
// import { SupabaseProvider } from "@/components/SupabaseProvider";
import ClientApp from "@/components/ClientApp";

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" className="h-100">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="d-flex flex-column h-100">
        <div className="flex-grow-1">
          <ClientApp>{children}</ClientApp>
          <Analytics />
        </div>

        {/* FOOTER */}
        <footer className="mt-auto py-4 bg-secondary text-white-50">
          <div className="container py-10 text-center">
            <small>© 2025 <a href="https://marsthelimit.com" target="_blank" style={{color:"white"}}>Mars The Limit</a>. All rights reserved. <a href="/privacy-policy" style={{color:"white"}}>Privacy Policy</a> <a href="/terms-of-service" style={{color:"white"}}>Terms of Service</a></small>
          </div>
        </footer>
      </body>
    </html>
  );
}
