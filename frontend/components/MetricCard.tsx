"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DataProvenanceBadge } from "./DataProvenanceBadge";
import { MetricTooltip } from "./MetricTooltip";
import { DataProvenanceInfo } from "./DataTransparencyModal";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral" | string;
  trendIsGood?: boolean;
  explanation?: string;
  provenance: DataProvenanceInfo;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  trendDirection = "neutral",
  trendIsGood = true,
  explanation,
  provenance,
  icon,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trendDirection === "neutral") return "text-slate-500 bg-slate-100";
    if (trendIsGood) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getTrendIcon = () => {
    if (trendDirection === "up") return <TrendingUp className="w-3.5 h-3.5" />;
    if (trendDirection === "down") return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
      <div>
        {/* Top bar: Title, Tooltip, and Provenance Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            {explanation && <MetricTooltip text={explanation} label={title} />}
          </div>
          <DataProvenanceBadge provenance={provenance} metricTitle={title} size="sm" />
        </div>

        {/* Main Value & Unit */}
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-slate-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Bottom bar: Trend indicator and optional icon */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {trend ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trend}</span>
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">No baseline shift</span>
        )}

        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}