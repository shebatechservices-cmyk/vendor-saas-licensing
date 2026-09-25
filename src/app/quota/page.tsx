"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Coins, Users, DollarSign } from "lucide-react";
import { calculateFromCredits, calculateFromStudents } from "@/lib/quota-calc";
import { QuotaCalculatorWidget } from "@/components/quota/QuotaCalculatorWidget";
import { ClientQuotaTable } from "@/components/quota/ClientQuotaTable";

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
      <QuotaCalculatorWidget
        calcMode={calcMode}
        setCalcMode={setCalcMode}
        calcCredits={calcCredits}
        setCalcCredits={setCalcCredits}
        calcStudents={calcStudents}
        setCalcStudents={setCalcStudents}
        calcFromCreditResult={calcFromCreditResult}
        calcFromStudentResult={calcFromStudentResult}
        batchQuantity={batchQuantity}
        setBatchQuantity={setBatchQuantity}
        batchName={batchName}
        setBatchName={setBatchName}
        generating={generating}
        onGenerateBatch={handleGenerateQuotaBatch}
      />

      {/* Madrasa Student Quota Utilization Overview */}
      <ClientQuotaTable clients={clients} />
    </div>
  );
}
