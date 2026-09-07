"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { DataTransparencyModal, DataProvenanceInfo } from "./DataTransparencyModal";

interface BadgeProps {
  provenance: DataProvenanceInfo;
  metricTitle?: string;
  size?: "sm" | "md";
}

export function DataProvenanceBadge({ provenance, metricTitle, size = "sm" }: BadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const getStyle = (type: string) => {
    switch (type) {
      case "LIVE DATA":
        return "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100";
      case "NEAR REAL-TIME DATA":
        return "bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100";
      case "HISTORICAL DATA":
        return "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100";
      case "USER-CONTRIBUTED DATA":
        return "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100";
      case "AI-DETECTED DATA":
        return "bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100";
      case "SIMULATED DATA":
        return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100";
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        title="Click to view data source, dataset name, update frequency and reliability"
        className={`inline-flex items-center gap-1 font-semibold rounded-full border transition-all cursor-pointer ${
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${getStyle(provenance.data_type)}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        <span>{provenance.data_type}</span>
        <Info className="w-3 h-3 opacity-70" />
      </button>

      <DataTransparencyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        provenance={provenance}
        metricTitle={metricTitle}
      />
    </>
  );
}