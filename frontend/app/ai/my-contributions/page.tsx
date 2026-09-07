"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UploadCloud, 
  Sparkles,
  ShieldCheck,
  Tag,
  Star
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MyContributionsPage() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contribList, statsData, userData] = await Promise.all([
          api.getContributions(50),
          api.getContributionStats(),
          api.getCurrentUser(),
        ]);
        setContributions(contribList);
        setStats(statsData);
        setUser(userData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Contributions History...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved_in_dataset":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Active in Training Dataset</span>;
      case "staged_for_training":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Staged for Next Retrain</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Low Quality / Blurry</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["contributor", "municipal_officer", "plant_operator", "ai_admin", "system_admin"]}>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              My Waste Contributions & AI Training Record
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "Chennai Citizen AI Contributor Registry",
                dataset_name: "Verified Citizen Annotated Dataset",
                last_updated: "Today",
                data_type: "USER-CONTRIBUTED DATA",
                reliability: "Multi-factor Quality Verified",
              }}
              metricTitle="Citizen Contributor Ledger"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track validation statuses, corrected labels, and rewards for community images expanding localized waste models.
          </p>
        </div>

        <Link
          href="/ai/contribute"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Waste Image</span>
        </Link>
      </div>

      {/* Profile & Eco Points Header Card */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 rounded-2xl p-6 text-white border border-navy-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 text-2xl font-extrabold">
            {user?.full_name?.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{user?.full_name || "Citizen Contributor"}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500 text-slate-950">
                {user?.badges || "Eco Citizen"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Active Contributor in Zone 5 (Royapuram) & Zone 8 (Anna Nagar)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center sm:text-right">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Eco Points Earned</span>
            <span className="text-2xl font-extrabold text-teal-400">
              {user?.contribution_points || 420}
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Validated Images</span>
            <span className="text-2xl font-extrabold text-white">
              {contributions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Retraining Threshold Status Tracker */}
      {stats && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-navy-950">Next Retraining Threshold Progress</span>
              <p className="text-slate-500 text-[11px]">
                {stats.staged_for_retraining} / {stats.retraining_threshold} validated community images staged.
              </p>
            </div>
            <span className="font-extrabold text-teal-700 text-sm">
              {stats.progress_towards_next_retrain}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.progress_towards_next_retrain}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Contributions History Table */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide">
          Recent Image Submissions & Label Confirmations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">ID / Contributor</th>
                <th className="p-3">AI Prediction</th>
                <th className="p-3">Confirmed Category</th>
                <th className="p-3">Sharpness Score</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contributions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">#{c.id}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.contributor_name}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-slate-800">{c.ai_predicted_category}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {Math.round(c.ai_confidence * 100)}% conf
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-navy-950">{c.user_confirmed_category}</span>
                      {c.is_user_corrected && (
                        <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 text-[9px] rounded font-bold">
                          User Corrected
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={c.blur_score > 35 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {c.blur_score} / 100
                    </span>
                  </td>
                  <td className="p-3">
                    <span>Ward {c.ward_number || 100}</span>
                    <span className="text-[10px] text-slate-400 block">{c.location_name}</span>
                  </td>
                  <td className="p-3">
                    {getStatusBadge(c.validation_status)}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
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