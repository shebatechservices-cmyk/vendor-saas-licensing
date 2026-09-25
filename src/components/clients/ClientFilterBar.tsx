"use client";

import React from "react";
import { Search } from "lucide-react";

interface ClientFilterBarProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ClientFilterBar({
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
}: ClientFilterBarProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {["ALL", "ACTIVE", "BLOCKED", "SUSPENDED", "EXPIRED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === status
                ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by name, domain, client code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>
    </div>
  );
}
