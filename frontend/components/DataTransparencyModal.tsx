"use client";

import React from "react";
import { Info, X, ShieldCheck, Database, Calendar, Tag } from "lucide-react";

export interface DataProvenanceInfo {
  source: string;
  dataset_name: string;
  last_updated: string;
  data_type: string;
  reliability?: string;
  notes?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  provenance: DataProvenanceInfo;
  metricTitle?: string;
}

export function DataTransparencyModal({ isOpen, onClose, provenance, metricTitle }: ModalProps) {
  if (!isOpen) return null;

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "LIVE DATA":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "NEAR REAL-TIME DATA":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "HISTORICAL DATA":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "USER-CONTRIBUTED DATA":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "AI-DETECTED DATA":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "SIMULATED DATA":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-teal-400" />
            <h3 className="font-semibold text-lg">Data Transparency & Provenance</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {metricTitle && (
            <div className="pb-3 border-b border-slate-100">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Metric / Visualizer</span>
              <p className="text-base font-semibold text-slate-800">{metricTitle}</p>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-slate-600">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">Data Classification:</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getTypeBadgeColor(provenance.data_type)}`}>
              {provenance.data_type}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Database className="w-4 h-4 text-navy-600 mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Source</span>
                <p className="text-sm text-slate-800 font-medium">{provenance.source}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Info className="w-4 h-4 text-navy-600 mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dataset Name</span>
                <p className="text-sm text-slate-800">{provenance.dataset_name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-navy-600 mt-1 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Updated</span>
                <p className="text-sm text-slate-800">{provenance.last_updated}</p>
              </div>
            </div>

            {provenance.reliability && (
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Verification & Reliability</span>
                  <p className="text-sm text-slate-800">{provenance.reliability}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-200">
            <p className="font-semibold text-slate-700 mb-1">Government Open Data Compliance:</p>
            <p>
              In accordance with National Data Sharing and Accessibility Policy (NDSAP) and GCC open transparency mandates,
              every data stream on this platform is explicitly categorized to avoid misleading historical figures as live telemetry.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-900 transition"
          >
            Close Transparency Details
          </button>
        </div>
      </div>
    </div>
  );
}