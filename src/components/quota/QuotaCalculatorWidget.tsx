"use client";

import React from "react";
import { Calculator, Sparkles, RefreshCw, PlusCircle } from "lucide-react";

interface QuotaCalculatorWidgetProps {
  calcMode: "credits" | "students";
  setCalcMode: (mode: "credits" | "students") => void;
  calcCredits: number;
  setCalcCredits: (val: number) => void;
  calcStudents: number;
  setCalcStudents: (val: number) => void;
  calcFromCreditResult: any;
  calcFromStudentResult: any;
  batchQuantity: number;
  setBatchQuantity: (val: number) => void;
  batchName: string;
  setBatchName: (val: string) => void;
  generating: boolean;
  onGenerateBatch: (e: React.FormEvent) => void;
}

export function QuotaCalculatorWidget({
  calcMode,
  setCalcMode,
  calcCredits,
  setCalcCredits,
  calcStudents,
  setCalcStudents,
  calcFromCreditResult,
  calcFromStudentResult,
  batchQuantity,
  setBatchQuantity,
  batchName,
  setBatchName,
  generating,
  onGenerateBatch,
}: QuotaCalculatorWidgetProps) {
  return (
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
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                calcMode === "credits" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              By Credits
            </button>
            <button
              onClick={() => setCalcMode("students")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
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
                  className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
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
                  className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
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

          <form onSubmit={onGenerateBatch} className="space-y-4 mt-4">
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
  );
}
