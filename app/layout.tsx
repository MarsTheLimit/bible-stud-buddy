import Script from "next/script";
import "./css/landing-page.css";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Analytics } from "@vercel/analytics/next";
// import { SupabaseProvider } from "@/components/SupabaseProvider";
import ClientApp from "@/components/ClientApp";

const DESCRIPTION = "Grow closer to God by generating a personalized Bible study plan fitted around your schedule using AI."

export const metadata = {
  title: {
    default: "Bible Study Buddy",
    template: "%s | Bible Study Buddy"
  },
  description: DESCRIPTION,

  openGraph: {
    title: "Bible Study Buddy",
    description:
      DESCRIPTION,
    url: process.env.NEXT_PUBLIC_PROJECT_URL!,
    siteName: "Bible Study Buddy",
    images: [
      {
        url: "/dashboard-preview.png",
        width: 1200,
        height: 630,
        alt: "Bible Study Buddy preview image",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Bible Study Buddy",
    description:
      DESCRIPTION,
    // creator: "@your_twitter_handle",
    images: ["/og-image.png"],
  },

  metadataBase: new URL(process.env.NEXT_PUBLIC_PROJECT_URL!),
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

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
            <small>© 2025 <a href="https://marsthelimit.com" target="_blank" style={{color:"white"}}>Mars The Limit</a>. All rights reserved. <a href="/privacy-policy" style={{color:"white"}}>Privacy Policy</a> | <a href="/terms-of-service" style={{color:"white"}}>Terms of Service</a></small>
          </div>
        </footer>
      </body>
    </html>
  );
}
