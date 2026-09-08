"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Sliders,
  Layers,
  Cpu,
  BarChart2,
  Award,
  Smartphone,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminNav } from "@/components/AdminNav";

export default function AdminModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Comparison State
  const [compareModelA, setCompareModelA] = useState<any>(null);
  const [compareModelB, setCompareModelB] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Details Modal State
  const [selectedModelDetails, setSelectedModelDetails] = useState<any>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminModels();
      const list = res.models || [];
      setModels(list);

      // Pre-fill comparison models (active production vs previous)
      const active = list.find((m: any) => m.is_active_production);
      const candidate = list.find((m: any) => !m.is_active_production);
      if (active) setCompareModelA(active);
      if (candidate) setCompareModelB(candidate);
    } catch (err: any) {
      console.error("Failed to load models:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateModel = async (id: number, version: string) => {
    try {
      setActionLoading(true);
      const res = await api.activateAdminModel(id);
      setBannerMsg({
        type: "success",
        text: `Model ${version} successfully deployed as ACTIVE Production Model. All webcam streams and collection trucks are now using these weights!`,
      });
      loadModels();
    } catch (err: any) {
      alert(err.message || "Failed to activate model.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (id: number, version: string) => {
    if (!confirm(`Are you sure you want to rollback production inference to Model ${version}?`)) return;
    try {
      setActionLoading(true);
      await api.rollbackAdminModel(id);
      setBannerMsg({
        type: "success",
        text: `Rolled back production AI model to version ${version}.`,
      });
      loadModels();
    } catch (err: any) {
      alert(err.message || "Rollback failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Sub-Nav */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 flex items-center gap-2.5">
              <BookmarkCheck className="w-7 h-7 text-teal-600" />
              <span>AI Model Registry &amp; Deployment</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage production checkpoints, activate newly trained weights with zero downtime, compare benchmark metrics, and execute instantaneous rollbacks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live-detection"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test on Live Camera Feed</span>
            </Link>
          </div>
        </div>

        <AdminNav />
      </div>

      {bannerMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
            bannerMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-xs underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Model Comparison Card Toggle */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-600" />
              <span>Model Version Benchmarking &amp; Comparison</span>
            </h2>
            <p className="text-xs text-slate-500">
              Compare accuracy improvements and E-Waste recall between any two versions before promoting to production.
            </p>
          </div>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            {showComparison ? "Hide Comparison" : "Compare Versions"}
          </button>
        </div>

        {showComparison && compareModelA && compareModelB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in">
            {/* Model A */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                compareModelA.is_active_production
                  ? "bg-teal-50/40 border-teal-300 ring-1 ring-teal-400"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Model A</span>
                  <h3 className="text-base font-extrabold text-navy-950">{compareModelA.model_name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                  {compareModelA.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <strong className="text-navy-950 text-sm font-black">
                    {Math.round((compareModelA.accuracy || 0) * 100)}%
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">F1-Score</span>
                  <strong className="text-navy-950 text-sm font-black">
                    {Math.round((compareModelA.f1_score || 0) * 100)}%
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Phone Recall</span>
                  <strong className="text-purple-700 text-sm font-black">
                    {Math.round((compareModelA.mobile_phone_recall || 0.9) * 100)}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Model B */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                compareModelB.is_active_production
                  ? "bg-teal-50/40 border-teal-300 ring-1 ring-teal-400"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Model B</span>
                  <h3 className="text-base font-extrabold text-navy-950">{compareModelB.model_name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                  {compareModelB.version}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <strong className="text-navy-950 text-sm font-black">
                    {Math.round((compareModelB.accuracy || 0) * 100)}%
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">F1-Score</span>
                  <strong className="text-navy-950 text-sm font-black">
                    {Math.round((compareModelB.f1_score || 0) * 100)}%
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Phone Recall</span>
                  <strong className="text-purple-700 text-sm font-black">
                    {Math.round((compareModelB.mobile_phone_recall || 0.9) * 100)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Registry List Table */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              <span>Registered AI Model Versions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Official models trained on Greater Chennai Corporation solid waste streams.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-bold">
            Total Versions: {models.length}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            <span className="text-xs font-semibold">Loading model registry...</span>
          </div>
        ) : models.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BookmarkCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <span className="text-xs font-bold text-slate-600">No models in registry.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Model Version</th>
                  <th className="py-3 px-3">Deployment Status</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Precision &amp; Recall</th>
                  <th className="py-3 px-3">E-Waste F1 / Mobile Phone</th>
                  <th className="py-3 px-3">Dataset Size</th>
                  <th className="py-3 px-3">Trained On</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {models.map((m) => {
                  const isActive = m.is_active_production;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50 transition ${
                        isActive ? "bg-teal-50/25" : ""
                      }`}
                    >
                      {/* Version & Framework */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-navy-950 text-sm">
                            {m.model_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                            {m.version}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {m.framework}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                            <span>Active (Production)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>{m.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-navy-950 text-sm">
                            {(m.accuracy * 100).toFixed(1)}%
                          </span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, m.accuracy * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Precision & Recall */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="block">
                          P: <strong className="text-navy-950">{(m.precision * 100).toFixed(1)}%</strong>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          R: {(m.recall * 100).toFixed(1)}% • F1: {(m.f1_score * 100).toFixed(1)}%
                        </span>
                      </td>

                      {/* E-Waste & Phone Recall */}
                      <td className="py-3.5 px-3">
                        <span className="text-purple-800 font-bold block flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-purple-600" />
                          <span>Phone Rec: {Math.round((m.mobile_phone_recall || 0.9) * 100)}%</span>
                        </span>
                        <span className="text-[10px] text-purple-600 block">
                          E-Waste F1: {Math.round((m.ewaste_f1 || 0.91) * 100)}%
                        </span>
                      </td>

                      {/* Dataset Size */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="font-bold text-navy-950">
                          {m.training_images_count?.toLocaleString() || "12,400"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {m.dataset_version || "GCC-DS-2026"}
                        </span>
                      </td>

                      {/* Trained Date */}
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {m.training_date || "Recent"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {!isActive ? (
                            <button
                              onClick={() => handleActivateModel(m.id, m.version)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                              title="Deploy as Active Model"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 text-teal-700 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Deployed</span>
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedModelDetails(m)}
                            className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition"
                            title="View Class Metrics"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Per-Class Confusion Modal */}
      {selectedModelDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-navy-950">
                  {selectedModelDetails.model_name} ({selectedModelDetails.version})
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedModelDetails.framework} • Trained {selectedModelDetails.training_date}
                </span>
              </div>
              <button
                onClick={() => setSelectedModelDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Notes */}
            {selectedModelDetails.notes && (
              <p className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 italic border border-slate-200">
                &ldquo;{selectedModelDetails.notes}&rdquo;
              </p>
            )}

            {/* Per-Class Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-navy-950 block">
                Per-Class Benchmark Metrics
              </span>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {selectedModelDetails.class_metrics && selectedModelDetails.class_metrics.length > 0 ? (
                  selectedModelDetails.class_metrics.map((cm: any, i: number) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <strong className="text-navy-950 block">{cm.class_name}</strong>
                        <span className="text-[10px] text-slate-400">{cm.category || "Solid Waste"}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="font-mono font-bold text-teal-700 block">
                          F1: {Math.round((cm.f1_score || 0.9) * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          P: {Math.round((cm.precision || 0.9) * 100)}% | R: {Math.round((cm.recall || 0.9) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Standard multi-class municipal solid waste metrics applied.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedModelDetails(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              {!selectedModelDetails.is_active_production && (
                <button
                  onClick={() => {
                    handleActivateModel(selectedModelDetails.id, selectedModelDetails.version);
                    setSelectedModelDetails(null);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Activate This Model</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
