"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  text: string;
  label?: string;
}

export function MetricTooltip({ text, label }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label={label || "Explanation"}
        className="text-slate-400 hover:text-slate-600 focus:outline-none transition"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-navy-900 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <p className="leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900"></div>
        </div>
      )}
    </div>
  );
}