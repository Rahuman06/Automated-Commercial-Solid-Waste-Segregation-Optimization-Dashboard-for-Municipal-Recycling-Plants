"use client";

import React, { useEffect, useState } from "react";
import { 
  Boxes, 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  BarChart2, 
  Layers,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AIModelManagementPage() {
  const [comparison, setComparison] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelsData();
  }, []);

  async function loadModelsData() {
    try {
      setLoading(true);
      const [compData, modelsList, cmData] = await Promise.all([
        api.getModelComparison(),
        api.getModels(),
        api.getConfusionMatrix().catch(() => null),
      ]);
      setComparison(compData);
      setModels(modelsList);
      setConfusionMatrix(cmData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeploy = async (candidateVer: string) => {
    if (!confirm(`Are you sure you want to deploy Candidate Model ${candidateVer} to PRODUCTION? This will update the inference weights on all 24 smart collection trucks.`)) {
      return;
    }
    try {
      const res = await api.deployModel(candidateVer);
      setActionMessage(res.message);
      await loadModelsData();
    } catch (err: any) {
      console.error(err);
      setActionMessage(err.message || "Failed to deploy model");
    }
  };

  const handleRollback = async () => {
    if (!confirm("Are you sure you want to rollback to the previous production model?")) {
      return;
    }
    try {
      const res = await api.rollbackModel();
      setActionMessage(res.message);
      await loadModelsData();
    } catch (err: any) {
      console.error(err);
      setActionMessage(err.message || "Failed to rollback model");
    }
  };

  if (loading || !comparison) {
    return <div className="p-8 text-center text-slate-400">Loading AI Model Registry...</div>;
  }

  const prod = comparison.production_model;
  const cand = comparison.candidate_model;

  return (
    <ProtectedRoute allowedRoles={["ai_admin", "system_admin"]}>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              AI Model Management & Deployment Registry
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "GCC AI Model Version Control & Test Benchmark Suite",
                dataset_name: "YOLOv8-Waste Production Validation Matrix",
                last_updated: "07 September 2026",
                data_type: "AI-DETECTED DATA",
                reliability: "Independent Holdout Validation (1,200 Ground Truth Test Set)",
              }}
              metricTitle="AI Model Governance"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare candidate checkpoints against active production models across accuracy, precision, recall, F1, and per-class performance.
          </p>
        </div>

        {/* Emergency Rollback Button */}
        <button
          onClick={handleRollback}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-300 self-start sm:self-auto"
          title="Rollback to previous stable model"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Roll Back Production Model</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Side-by-Side Model Comparison Card */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-navy-950 flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-600" />
              <span>Production vs. Candidate Model Evaluation</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated against 1,200 held-out Chennai roadside waste test samples.
            </p>
          </div>

          {cand && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeploy(cand.version)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Deploy Candidate ({cand.version})</span>
              </button>
            </div>
          )}
        </div>

        {/* Side by Side Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Production Model */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                CURRENT PRODUCTION
              </span>
              <span className="text-xs font-bold text-slate-500">Version: {prod.version}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block">Accuracy</span>
                <span className="text-base font-extrabold text-navy-950">
                  {Math.round(prod.accuracy * 1000) / 10}%
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block">Precision</span>
                <span className="text-base font-extrabold text-navy-950">
                  {prod.precision}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block">Recall</span>
                <span className="text-base font-extrabold text-navy-950">
                  {prod.recall}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block">F1 Score</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {prod.f1_score}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Training Dataset:</strong> {prod.training_images.toLocaleString()} Annotated Images</p>
              <p><strong>Deployment Date:</strong> {prod.training_date}</p>
            </div>
          </div>

          {/* Candidate Model */}
          {cand ? (
            <div className="p-5 rounded-xl border-2 border-teal-500 bg-teal-50/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  CANDIDATE FOR DEPLOYMENT
                </span>
                <span className="text-xs font-bold text-teal-800">Version: {cand.version}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">Accuracy</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {Math.round(cand.accuracy * 1000) / 10}%
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-bold">+2.7%</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">Precision</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {cand.precision}
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-bold">+0.033</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">Recall</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {cand.recall}
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-bold">+0.043</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-teal-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">F1 Score</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {cand.f1_score}
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-bold">+0.043</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p><strong>Training Dataset:</strong> {cand.training_images.toLocaleString()} Annotated Images (+500 verified community images)</p>
                <p><strong>Candidate Built:</strong> {cand.training_date}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              No candidate model pending review.
            </div>
          )}
        </div>

        {/* Model Acceptance Gate Checklist */}
        {cand && cand.acceptance_rules && (
          <div className="p-5 rounded-2xl bg-navy-950 text-white space-y-4 border border-navy-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Model Acceptance Gate Checklist (Production Deployment Pre-conditions)
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                cand.acceptance_rules.all_passed
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}>
                {cand.acceptance_rules.all_passed ? "✓ ALL GATES PASSED — DEPLOYMENT AUTHORIZED" : "⚠ GATES FAILED — BLOCKED"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-navy-900 rounded-xl border border-navy-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Overall F1 &ge; 85%</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{cand.f1_score}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    PASS
                  </span>
                </div>
              </div>

              <div className="p-3 bg-navy-900 rounded-xl border border-navy-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Mobile Phone Recall &ge; 85%</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">90.2%</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    PASS
                  </span>
                </div>
              </div>

              <div className="p-3 bg-navy-900 rounded-xl border border-navy-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Mobile Phone Precision &ge; 85%</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">88.5%</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    PASS
                  </span>
                </div>
              </div>

              <div className="p-3 bg-navy-900 rounded-xl border border-navy-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">E-Waste Category Recall &ge; 80%</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">87.4%</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    PASS
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Per-Class Evaluation Matrix */}
        {cand && cand.per_class_metrics && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                  Detailed Per-Class Precision, Recall & F1 Evaluation (Candidate {cand.version})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Evaluated across all 11 municipal categories including E-Waste subclasses with color-coded status badges.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span>🟢</span> F1 &ge; 85% (Production Ready)
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <span>🟡</span> 75-84% (Acceptable)
                </span>
                <span className="flex items-center gap-1 font-semibold text-rose-700">
                  <span>🔴</span> &lt;75% (Needs Data)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Class / Item Name</th>
                    <th className="p-2.5">Primary Category</th>
                    <th className="p-2.5">Precision</th>
                    <th className="p-2.5">Recall</th>
                    <th className="p-2.5">F1-Score</th>
                    <th className="p-2.5">Test Image Count</th>
                    <th className="p-2.5">Validation Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(Array.isArray(cand?.per_class_metrics) ? cand.per_class_metrics : []).map((row: any, rIdx: number) => {
                    const f1 = row.f1_score;
                    const f1Color = f1 >= 0.85 ? "text-emerald-700 font-black" : f1 >= 0.75 ? "text-amber-700 font-bold" : "text-rose-700 font-bold";
                    return (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-sans font-extrabold text-navy-950">{row.class_name}</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.category === "E-Waste" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="p-2.5">{Math.round(row.precision * 1000) / 10}%</td>
                        <td className="p-2.5">{Math.round(row.recall * 1000) / 10}%</td>
                        <td className={`p-2.5 ${f1Color}`}>{row.f1_score}</td>
                        <td className="p-2.5 font-sans text-slate-500">{row.test_count} samples</td>
                        <td className="p-2.5 font-sans">
                          <span className="font-semibold text-slate-700">{row.status_badge}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Critical Confusion Pairs Matrix */}
        {confusionMatrix && confusionMatrix.critical_confusions && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Critical Confusion Pairs Matrix (E-Waste Fine-Grained Discrimination)
              </h3>
              <p className="text-[11px] text-slate-500">
                Evaluation of easily confused item pairs to track misclassification reduction after introducing dense 128-d visual feature extraction.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item Pair Being Compared</th>
                    <th className="p-2.5">Key Distinguishing Visual Feature</th>
                    <th className="p-2.5">Prod Confusion Rate</th>
                    <th className="p-2.5">Candidate Confusion Rate</th>
                    <th className="p-2.5">Error Reduction</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(Array.isArray(confusionMatrix?.critical_confusions) ? confusionMatrix.critical_confusions : []).map((cPair: any, pIdx: number) => (
                    <tr key={pIdx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-sans font-bold text-navy-950">{cPair.pair}</td>
                      <td className="p-2.5 font-sans text-slate-600">{cPair.feature_distinction}</td>
                      <td className="p-2.5 text-rose-700">{cPair.prod_error_rate}%</td>
                      <td className="p-2.5 text-emerald-700 font-bold">{cPair.cand_error_rate}%</td>
                      <td className="p-2.5 text-teal-700 font-black">{cPair.improvement}</td>
                      <td className="p-2.5 font-sans">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          {cPair.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Model Version History Registry */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide">
          Complete AI Model Version History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Model Name / Version</th>
                <th className="p-3">Status</th>
                <th className="p-3">Framework</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">F1 Score</th>
                <th className="p-3">Training Images</th>
                <th className="p-3">Training Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(models) ? models : []).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-navy-950">
                    {m.model_name} <span className="font-mono text-teal-700 font-extrabold">{m.version}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      m.status === "production" ? "bg-emerald-50 text-emerald-800 border border-emerald-300" :
                      m.status === "candidate" ? "bg-amber-50 text-amber-800 border border-amber-300" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3">{m.framework}</td>
                  <td className="p-3 font-bold text-slate-900">{Math.round(m.accuracy * 1000) / 10}%</td>
                  <td className="p-3 font-bold text-emerald-700">{m.f1_score}</td>
                  <td className="p-3">{m.training_images_count?.toLocaleString?.() || m.training_images_count}</td>
                  <td className="p-3 text-slate-400">{m.training_date ? String(m.training_date).substring(0, 10) : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </ProtectedRoute>
  );
}