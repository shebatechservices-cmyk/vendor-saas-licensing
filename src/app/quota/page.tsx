"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Calculator,
  Coins,
  DollarSign,
  Users,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
  RefreshCw
} from "lucide-react";
import { calculateFromCredits, calculateFromStudents } from "@/lib/quota-calc";

export default function QuotaPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Calculator inputs
  const [calcCredits, setCalcCredits] = useState<number>(1000);
  const [calcStudents, setCalcStudents] = useState<number>(100);
  const [calcMode, setCalcMode] = useState<"credits" | "students">("credits");

  // Batch generator input
  const [batchQuantity, setBatchQuantity] = useState(5);
  const [batchName, setBatchName] = useState("Madrasa 2026 Student Quotas (+100)");

  const calcFromCreditResult = calculateFromCredits(calcCredits);
  const calcFromStudentResult = calculateFromStudents(calcStudents);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleGenerateQuotaBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await fetch("/api/codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "STUDENT_QUOTA_UPGRADE",
          quotaCredits: calcMode === "credits" ? calcCredits : calcFromStudentResult.credits,
          quantity: batchQuantity,
          batchName: batchName || undefined,
          notes: `+${
            calcMode === "credits" ? calcFromCreditResult.students : calcStudents
          } Students Quota Expansion`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          `Successfully generated ${batchQuantity} Quota Upgrade keys! (${
            calcMode === "credits" ? calcFromCreditResult.students : calcStudents
          } students each).`
        );
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Quota generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/40 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-purple-400" />
              <h1 className="text-2xl font-black text-white">Madrasa & School Quota Expansion Module</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configure student capacity upgrades, quota credit formulas, and automated financial billing.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 px-3.5 py-2 rounded-xl text-purple-200 text-xs font-bold">
            <Coins className="w-4 h-4 text-purple-300" />
            <span>Standard: 1000 Credits = 2000 BDT = 100 Students</span>
          </div>
        </div>
      </div>

      {/* Financial & Quota Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Credit Valuation</div>
            <div className="text-2xl font-black text-white mt-1">1000 Credits = 2,000 BDT</div>
            <div className="text-xs text-slate-400 mt-1">
              Unit Rate: <span className="text-purple-300 font-semibold">2.00 BDT</span> per 1 Credit
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Usage Quota Ratio</div>
            <div className="text-2xl font-black text-white mt-1">10 Credits = 1 Student</div>
            <div className="text-xs text-slate-400 mt-1">
              Expanding 100 students requires <span className="text-teal-300 font-semibold">1,000 Credits</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Per Student Cost</div>
            <div className="text-2xl font-black text-amber-400 mt-1">20.00 BDT / Student</div>
            <div className="text-xs text-slate-400 mt-1">
              100 students bundle: <span className="text-white font-semibold">2,000 BDT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quota Calculator & Batch Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Calculator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Interactive Quota & Price Calculator</h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setCalcMode("credits")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  calcMode === "credits" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                By Credits
              </button>
              <button
                onClick={() => setCalcMode("students")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  calcMode === "students" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                By Students
              </button>
            </div>
          </div>

          {calcMode === "credits" ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Input Credits to convert:</span>
                  <span className="text-purple-400 font-mono text-sm">{calcCredits.toLocaleString()} Credits</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={calcCredits}
                  onChange={(e) => setCalcCredits(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCalcCredits(preset)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      calcCredits === preset
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {preset.toLocaleString()} Credits
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Student Capacity Unlocked</span>
                  <span className="text-2xl font-black text-purple-300">
                    +{calcFromCreditResult.students.toLocaleString()} Students
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Total Upgrade Price</span>
                  <span className="text-2xl font-black text-amber-400">
                    {calcFromCreditResult.priceFormatted}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Input Student Capacity to add:</span>
                  <span className="text-purple-400 font-mono text-sm">{calcStudents.toLocaleString()} Students</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={calcStudents}
                  onChange={(e) => setCalcStudents(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 250, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCalcStudents(preset)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      calcStudents === preset
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    +{preset} Students
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Required Credit Balance</span>
                  <span className="text-2xl font-black text-purple-300">
                    {calcFromStudentResult.credits.toLocaleString()} Credits
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Total Upgrade Price</span>
                  <span className="text-2xl font-black text-amber-400">
                    {calcFromStudentResult.priceFormatted}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Quota Batch Keys */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Generate Student Quota Key Batch</h2>
            </div>

            <form onSubmit={handleGenerateQuotaBatch} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Batch Key Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Batch Identifier Name</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Each Key Value:</span>
                  <span className="font-bold text-purple-300">
                    +{calcMode === "credits" ? calcFromCreditResult.students : calcStudents} Students Quota
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Price:</span>
                  <span className="font-bold text-amber-400">
                    {calcMode === "credits"
                      ? calcFromCreditResult.priceFormatted
                      : calcFromStudentResult.priceFormatted}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-800/40">
                  <span className="text-slate-300 font-bold">Total Batch Value:</span>
                  <span className="font-black text-white text-sm">
                    {(
                      (calcMode === "credits"
                        ? calcFromCreditResult.priceBdt
                        : calcFromStudentResult.priceBdt) * batchQuantity
                    ).toLocaleString()}{" "}
                    BDT
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                Generate {batchQuantity} Quota Key(s)
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Madrasa Student Quota Utilization Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Connected Madrasa Quota Capacity & Usage</h3>
          </div>
          <span className="text-xs text-slate-400">Live Telemetry Synchronized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Madrasa / School</th>
                <th className="py-4 px-6">Base Limit</th>
                <th className="py-4 px-6">Extra Upgrades</th>
                <th className="py-4 px-6">Total Limit</th>
                <th className="py-4 px-6">Enrolled Students</th>
                <th className="py-4 px-6">Capacity Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {clients.map((c) => {
                const used = c.quotas?.usedStudents || 0;
                const total = c.studentQuota || 200;
                const percent = Math.min(100, Math.round((used / total) * 100));

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.clientCode}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">
                      {c.quotas?.baseStudents || 200}
                    </td>
                    <td className="py-4 px-6 font-mono text-purple-400 font-bold">
                      +{c.quotas?.extraStudents || 0}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-white">{total}</td>
                    <td className="py-4 px-6 font-mono font-bold text-cyan-300">{used}</td>
                    <td className="py-4 px-6">
                      <div className="w-full max-w-[160px] space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">{percent}% Used</span>
                          <span className="text-slate-400">{total - used} Free</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 90
                                ? "bg-rose-500"
                                : percent > 75
                                ? "bg-amber-500"
                                : "bg-purple-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
