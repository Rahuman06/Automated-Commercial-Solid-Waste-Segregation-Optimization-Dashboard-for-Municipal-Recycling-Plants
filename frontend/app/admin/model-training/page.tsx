"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  BookmarkCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminNav } from "@/components/AdminNav";

export default function AdminModelTrainingPage() {
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hyperparameters
  const [candidateVersion, setCandidateVersion] = useState("");
  const [totalEpochs, setTotalEpochs] = useState(20);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.001);

  const terminalRef = useRef<HTMLPreElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStatus();

    // Set up polling every 1.5 seconds
    pollIntervalRef.current = setInterval(fetchStatus, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Auto scroll terminal log to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [trainingStatus?.log_output]);

  const fetchStatus = async () => {
    try {
      const data = await api.getAdminTrainingStatus();
      setTrainingStatus(data);
      if (!candidateVersion && data.candidate_version) {
        setCandidateVersion(data.candidate_version);
      }
    } catch (err: any) {
      console.error("Error polling training status:", err);
    }
  };

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsStarting(true);
      setErrorMsg(null);
      await api.startAdminTraining({
        candidate_version: candidateVersion || undefined,
        total_epochs: totalEpochs,
        batch_size: batchSize,
        learning_rate: learningRate,
      });
      fetchStatus();
    } catch (err: any) {
      console.error("Start training error:", err);
      setErrorMsg(err.message || "Failed to start training pipeline.");
    } finally {
      setIsStarting(false);
    }
  };

  const isTrainingActive =
    trainingStatus?.is_training ||
    ["running", "validating", "preparing", "training", "evaluating", "saving"].includes(
      trainingStatus?.status || ""
    );

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "validating":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "preparing":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "training":
        return "bg-purple-100 text-purple-900 border-purple-300 animate-pulse";
      case "evaluating":
        return "bg-cyan-100 text-cyan-900 border-cyan-300";
      case "saving":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "completed":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "failed":
        return "bg-rose-100 text-rose-900 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const stagesList = [
    { key: "validating", label: "1. Dataset Validation" },
    { key: "preparing", label: "2. Train/Val/Test Split" },
    { key: "training", label: "3. Epoch Training" },
    { key: "evaluating", label: "4. Benchmark Evaluation" },
    { key: "saving", label: "5. Checkpoint Saving" },
  ];

  const currentStage = trainingStatus?.stage || "idle";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Sub-Nav */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 flex items-center gap-2.5">
              <Cpu className="w-7 h-7 text-teal-600" />
              <span>Real AI Model Retraining Pipeline</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Trigger background deep learning jobs across verified municipal solid waste datasets. Generates production candidate weights with specialized E-Waste accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/models"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-xs"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Model Registry &amp; Deployments</span>
            </Link>
          </div>
        </div>

        <AdminNav />
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Training Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Job Trigger & Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Progress Bar Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                  Live Training Telemetry
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wide ${getStageBadge(
                  currentStage
                )}`}
              >
                {currentStage.toUpperCase()}
              </span>
            </div>

            {/* Pipeline Stage Steps Indicator */}
            <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
              {stagesList.map((st, idx) => {
                const stageIdx = stagesList.findIndex((s) => s.key === currentStage);
                const isPast = stageIdx > idx || currentStage === "completed";
                const isCurrent = currentStage === st.key;
                return (
                  <div
                    key={st.key}
                    className={`p-2 rounded-lg border text-center transition ${
                      isCurrent
                        ? "bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500"
                        : isPast
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="block truncate">{st.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar & Epoch Counter */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-navy-950 flex items-center gap-2">
                  <span>Progress</span>
                  <span className="text-teal-600 font-extrabold">
                    {trainingStatus?.progress_pct ? `${trainingStatus.progress_pct}%` : "0%"}
                  </span>
                </span>
                <span className="text-slate-500 font-mono">
                  Epoch: {trainingStatus?.current_epoch ?? 0} / {trainingStatus?.total_epochs ?? totalEpochs}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStage === "completed"
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-teal-500 to-purple-600"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, trainingStatus?.progress_pct || 0))}%` }}
                />
              </div>
            </div>

            {/* Live Metrics Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Training Loss</span>
                <span className="text-lg font-black text-navy-950 font-mono">
                  {trainingStatus?.train_loss ? trainingStatus.train_loss.toFixed(4) : "—"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Validation Loss</span>
                <span className="text-lg font-black text-navy-950 font-mono">
                  {trainingStatus?.val_loss ? trainingStatus.val_loss.toFixed(4) : "—"}
                </span>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                <span className="text-[10px] text-teal-700 block font-semibold">Val Accuracy</span>
                <span className="text-lg font-black text-teal-950 font-mono">
                  {trainingStatus?.val_accuracy ? `${(trainingStatus.val_accuracy * 100).toFixed(1)}%` : "—"}
                </span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[10px] text-purple-700 block font-semibold">Overall F1-Score</span>
                <span className="text-lg font-black text-purple-950 font-mono">
                  {trainingStatus?.val_f1 ? `${(trainingStatus.val_f1 * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            {/* Target & Base Version info */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Base Version: <strong className="text-navy-950">{trainingStatus?.base_version || "v2.1"}</strong>
              </span>
              <span>
                Target Version: <strong className="text-purple-700">{trainingStatus?.candidate_version || candidateVersion || "v2.2"}</strong>
              </span>
              <span>
                Dataset Samples: <strong className="text-teal-700">{trainingStatus?.dataset_size || 0}</strong>
              </span>
            </div>
          </div>

          {/* Start Training Form Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Play className="w-4 h-4 text-teal-600" />
              <span>Configure &amp; Launch Model Retraining</span>
            </h2>

            <form onSubmit={handleStartTraining} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Candidate Model Version
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateVersion}
                    onChange={(e) => setCandidateVersion(e.target.value)}
                    placeholder="e.g. v2.2, v2.3"
                    disabled={isTrainingActive}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total Epochs (10 - 50)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={totalEpochs}
                    onChange={(e) => setTotalEpochs(parseInt(e.target.value) || 20)}
                    disabled={isTrainingActive}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Batch Size
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                    disabled={isTrainingActive}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100"
                  >
                    <option value={8}>8 Samples / Batch</option>
                    <option value={16}>16 Samples / Batch (Recommended)</option>
                    <option value={32}>32 Samples / Batch</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Initial Learning Rate
                  </label>
                  <select
                    value={learningRate}
                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                    disabled={isTrainingActive}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100 font-mono"
                  >
                    <option value={0.001}>0.001 (AdamW Default)</option>
                    <option value={0.0005}>0.0005 (Fine-tuning)</option>
                    <option value={0.0001}>0.0001 (Warmup/Transfer)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTrainingActive || isStarting}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isTrainingActive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Training Job Currently Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start Model Training</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Console Log Terminal & Completion Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Terminal Console Output */}
          <div className="bg-navy-950 text-slate-200 rounded-2xl p-5 border border-navy-800 shadow-md space-y-3 font-mono flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-white">Backend Training Stream</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isTrainingActive ? "bg-teal-400 animate-ping" : "bg-emerald-400"}`} />
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {isTrainingActive ? "Active Job" : "Stream Idle"}
                </span>
              </div>
            </div>

            <pre
              ref={terminalRef}
              className="flex-1 overflow-y-auto text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap font-mono p-1"
            >
              {trainingStatus?.log_output || "[READY] Ready to initiate training pipeline."}
            </pre>

            <div className="pt-2 border-t border-navy-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Target: PyTorch 2.2 / YOLOv8-Waste</span>
              <span>Optimizer: AdamW</span>
            </div>
          </div>

          {/* Model Registry Quick Link */}
          {trainingStatus?.status === "completed" && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Training Completed Successfully!</span>
                  <span className="text-slate-600">
                    Candidate model {trainingStatus.candidate_version} has passed benchmark checks.
                  </span>
                </div>
              </div>
              <Link
                href="/admin/models"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <span>Go to Model Registry to Activate &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
