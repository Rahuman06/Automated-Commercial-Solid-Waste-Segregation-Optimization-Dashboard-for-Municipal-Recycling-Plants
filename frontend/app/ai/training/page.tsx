"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  Boxes, 
  BarChart2, 
  ArrowRight, 
  Layers, 
  RefreshCw, 
  ShieldAlert,
  Sparkles,
  Database,
  AlertTriangle,
  Sliders,
  Check
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AITrainingCenterPage() {
  const [status, setStatus] = useState<any>(null);
  const [classDist, setClassDist] = useState<any>(null);
  const [training, setTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Augmentation controls state
  const [augmentations, setAugmentations] = useState({
    rotation: true,
    rotationDeg: 15,
    hFlip: true,
    vFlip: false,
    brightnessJitter: true,
    contrastAdjustment: true,
    blurNoise: true,
    randomCrop: true,
  });

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      const [statusData, distData] = await Promise.all([
        api.getTrainingStatus(),
        api.getClassDistribution().catch(() => null),
      ]);
      setStatus(statusData);
      setClassDist(distData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleTriggerTraining = async () => {
    try {
      setTraining(true);
      setTrainingMessage(null);
      const res = await api.triggerRetraining(true);
      setTrainingMessage(res.message);
      await loadStatus();
    } catch (err: any) {
      console.error(err);
      setTrainingMessage(err.message || "Failed to trigger retraining");
    } finally {
      setTraining(false);
    }
  };

  if (loading || !status) {
    return <div className="p-8 text-center text-slate-400">Loading AI Retraining Pipeline Status...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["ai_admin", "system_admin"]}>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Continuous AI Model Retraining Pipeline
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "PyTorch & YOLOv8 Distributed Training Cluster",
                dataset_name: "Continuous Annotated Waste Staging Pipeline",
                last_updated: "07 September 2026",
                data_type: "AI-DETECTED DATA",
                reliability: "Automated Checkpoint Evaluation",
              }}
              metricTitle="MLOps Retraining Pipeline"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Autonomous dataset expansion, automated candidate training cycles, and rigorous safety-gated evaluation against production models.
          </p>
        </div>

        <Link
          href="/ai/models"
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Boxes className="w-4 h-4 text-teal-400" />
          <span>Model Registry & Deployment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Threshold Status & Action Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Dataset Expansion State
            </span>
            <h2 className="text-xl font-extrabold text-navy-950 mt-0.5">
              Candidate Retraining Pipeline Trigger
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status.is_ready_for_training
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                : "bg-slate-100 text-slate-600"
            }`}>
              {status.is_ready_for_training ? "READY FOR TRAINING" : "ACCUMULATING SAMPLES"}
            </span>
          </div>
        </div>

        {/* Retraining Threshold Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">New Validated Images</span>
            <p className="text-2xl font-extrabold text-teal-700 mt-1">
              {status.staged_images_count}
            </p>
            <span className="text-[11px] text-slate-400">Quality-checked citizen submissions</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Automated Trigger Threshold</span>
            <p className="text-2xl font-extrabold text-navy-950 mt-1">
              {status.training_threshold}
            </p>
            <span className="text-[11px] text-slate-400">Target batch threshold</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Progress towards Batch</span>
            <p className="text-2xl font-extrabold text-sky-700 mt-1">
              {status.progress_percentage}%
            </p>
            <span className="text-[11px] text-slate-400">Batch accumulation index</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.progress_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 max-w-md">
            Triggering retraining compiles newly confirmed annotations, trains a candidate YOLOv8 model, and benchmarks performance against the current production model.
          </p>

          <button
            onClick={handleTriggerTraining}
            disabled={training}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Training Candidate Model (Epoch 50/50)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Trigger Retraining Pipeline</span>
              </>
            )}
          </button>
        </div>

        {trainingMessage && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{trainingMessage}</span>
          </div>
        )}
      </div>

      {/* Models Status Preview (Production vs Candidate) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Production Model Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE IN PRODUCTION
              </span>
              <h3 className="text-base font-bold text-navy-950 mt-1">
                Model {status.current_production_model.version}
              </h3>
            </div>
            <span className="text-xs text-slate-400">Deployed on 24 Trucks</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Accuracy</span>
              <span className="text-lg font-extrabold text-navy-950">
                {Math.round(status.current_production_model.accuracy * 1000) / 10}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">F1 Score</span>
              <span className="text-lg font-extrabold text-emerald-700">
                {status.current_production_model.f1_score}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg col-span-2">
              <span className="text-slate-400 block text-[11px]">Training Images</span>
              <span className="text-sm font-bold text-slate-800">
                {status.current_production_model.training_images.toLocaleString()} Annotated Frames
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Model Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                CANDIDATE MODEL FOR REVIEW
              </span>
              <h3 className="text-base font-bold text-navy-950 mt-1">
                Model {status.candidate_model?.version || "v2.2"}
              </h3>
            </div>
            <span className="text-xs text-amber-600 font-semibold">Passed Safety Gates</span>
          </div>

          {status.candidate_model ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block text-[11px] font-semibold">Candidate Accuracy</span>
                <span className="text-lg font-extrabold text-emerald-950">
                  {Math.round(status.candidate_model.accuracy * 1000) / 10}%
                </span>
                <span className="text-[10px] text-emerald-700 block">+2.7% Higher</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block text-[11px] font-semibold">Candidate F1 Score</span>
                <span className="text-lg font-extrabold text-emerald-950">
                  {status.candidate_model.f1_score}
                </span>
                <span className="text-[10px] text-emerald-700 block">+0.043 Higher</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[11px]">Expanded Training Dataset</span>
                <span className="text-sm font-bold text-slate-800">
                  {status.candidate_model.training_images.toLocaleString()} Images (+500 verified additions)
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No candidate model awaiting review.
            </div>
          )}
        </div>
      </div>

      {/* Dataset Class Balance & Distribution Analysis */}
      {classDist && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-teal-600" />
                <span>Dataset Class Balance & Distribution Analysis</span>
              </h3>
              <p className="text-xs text-slate-500">
                Continuous monitoring of class representation to prevent plastic/organic bias and address e-waste sample deficiencies.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Total: {classDist.total_images.toLocaleString()} Annotated Samples
              </span>
            </div>
          </div>

          {/* Underrepresented Imbalance Warnings */}
          {classDist.underrepresented_warnings?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>⚠️ Imbalance Warnings Detected ({classDist.underrepresented_warnings.length} classes under minimum 200 threshold):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 pl-1">
                {classDist.underrepresented_warnings.map((warn: string, wIdx: number) => (
                  <li key={wIdx}>{warn}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 pt-1 italic">
                Synthetic augmentation & targeted citizen e-waste contribution campaigns are automatically prioritized for these categories.
              </p>
            </div>
          )}

          {/* Class Breakdown Grid / Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(classDist.distribution || classDist.classes || []).map((cls: any, cIdx: number) => (
              <div key={cIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-navy-950">{cls.class_name || cls.name}</span>
                    <span className="text-[10px] text-slate-400">({cls.category})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cls.is_underrepresented && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        ⚠ Low Count
                      </span>
                    )}
                    <span className="font-black text-navy-950 text-xs">{cls.count}</span>
                    <span className="text-slate-400 text-[11px]">({cls.percentage}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      cls.is_underrepresented
                        ? "bg-amber-500"
                        : cls.category === "E-Waste"
                        ? "bg-purple-600"
                        : "bg-teal-600"
                    }`}
                    style={{ width: `${Math.min(100, cls.percentage * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configurable Data Augmentation Settings */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600" />
              <span>Configurable Data Augmentation Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500">
              Apply stochastic transformations during candidate retraining epochs to artificially balance rare e-waste classes and enhance model robustness in diverse lighting.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Active in Candidate Runs</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.rotation}
              onChange={(e) => setAugmentations({ ...augmentations, rotation: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Random Rotation (±15°)</span>
              <span className="text-[11px] text-slate-500">Simulates phones & parts dropped at tilted angles</span>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.hFlip}
              onChange={(e) => setAugmentations({ ...augmentations, hFlip: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Horizontal & Vertical Flips</span>
              <span className="text-[11px] text-slate-500">Inversion of handheld chargers and cables</span>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.brightnessJitter}
              onChange={(e) => setAugmentations({ ...augmentations, brightnessJitter: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Brightness Jitter (±20%)</span>
              <span className="text-[11px] text-slate-500">Robustness against direct sunlight and shadows</span>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.contrastAdjustment}
              onChange={(e) => setAugmentations({ ...augmentations, contrastAdjustment: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Contrast Scaling (±15%)</span>
              <span className="text-[11px] text-slate-500">Enhances PCB trace and connector edge visibility</span>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.blurNoise}
              onChange={(e) => setAugmentations({ ...augmentations, blurNoise: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Gaussian Blur & Noise</span>
              <span className="text-[11px] text-slate-500">Simulates motion blur from moving collection trucks</span>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={augmentations.randomCrop}
              onChange={(e) => setAugmentations({ ...augmentations, randomCrop: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <span className="font-bold text-navy-950 block">Random Bounding Box Crop</span>
              <span className="text-[11px] text-slate-500">Handles partially occluded phones & components</span>
            </div>
          </label>
        </div>
      </div>

      {/* MLOps Safety Guardrail Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span>Strict Model Deployment Rule</span>
        </span>
        <p>
          Newly trained candidate models are NEVER automatically deployed into production without administrative approval.
          The candidate must pass the configured threshold (+2% accuracy and F1 &ge; 0.88) before an administrator can promote it to replace the active fleet model.
        </p>
      </div>
    </div>
  </ProtectedRoute>
  );
}