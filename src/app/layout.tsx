import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Vendor SaaS Licensing & Central Management System",
  description: "Live Tracking, Killswitch Control, Code Pre-generation, Quota Expansion, Client Accounting Ledger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>Vendor SaaS Remote Licensing Engine &copy; 2026. All rights reserved.</div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Financial Standard: 1000 Credits = 2000 BDT</span>
                <span>•</span>
                <span>Quota Ratio: 10 Credits = 1 Student</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
