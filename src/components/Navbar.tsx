"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SecuritySettingsModal from "./SecuritySettingsModal";
import { 
  ShieldCheck, 
  Users, 
  KeyRound, 
  GraduationCap, 
  BookOpen, 
  Terminal, 
  Activity,
  LayoutDashboard,
  Shield,
  LogOut,
  Lock,
  Globe,
  Smartphone
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { admin, logout, step } = useAuth();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/license-manager", label: "License Engine & Killswitch", icon: KeyRound },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/codes", label: "Code Vault", icon: ShieldCheck },
    { href: "/quota", label: "Quota Engine", icon: GraduationCap },
    { href: "/ledger", label: "Ledger", icon: BookOpen },
    { href: "/simulator", label: "Client SDK & Simulator", icon: Terminal },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">VENDOR SaaS</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Control Hub
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Central Client Licensing & Quota Control</p>
              </div>
            </Link>

            {/* Navigation Links */}
            {step === "authenticated" && (
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-slate-800 text-white shadow-inner border border-slate-700/50 text-emerald-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {step === "authenticated" ? (
                <>
                  {/* Security & 2FA Modal Button */}
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all cursor-pointer shadow-sm hover:border-teal-500/50"
                    title="Configure 2FA and IP Whitelisting"
                  >
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span className="hidden sm:inline font-semibold">2FA & 3FA Security</span>
                    {admin?.two_factor_enabled ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </button>

                  {/* Admin Profile & Logout */}
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                    <div className="hidden md:block text-right">
                      <div className="text-xs font-bold text-slate-200 font-mono truncate max-w-[120px]">
                        {admin?.email}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        Master Admin
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={logout}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer"
                      title="Log Out of Vendor Console"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-300">Secure 3FA Gateway</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {step === "authenticated" && (
            <div className="lg:hidden flex items-center justify-start gap-1 pb-3 overflow-x-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200 bg-slate-800/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </>
  );
}
