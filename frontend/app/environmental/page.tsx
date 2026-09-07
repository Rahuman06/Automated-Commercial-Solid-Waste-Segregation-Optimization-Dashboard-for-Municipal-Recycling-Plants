"use client";

import React, { useEffect, useState } from "react";
import { 
  Leaf, 
  Wind, 
  ShieldAlert, 
  Trash2, 
  Trees, 
  Scale, 
  Info, 
  AlertCircle,
  FileCheck,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { MetricTooltip } from "@/components/MetricTooltip";

export default function EnvironmentalImpactPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getEnvironmentalSummary();
        setEnvData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !envData) {
    return <div className="p-8 text-center text-slate-400">Loading Environmental Impact Metrics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Environmental Impact & Emissions Avoidance Model
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "CPCB SWM Guidelines & IPCC South Asia Tier-1 Waste Characterization Model",
                dataset_name: "Estimated Solid Waste Environmental Impact Model",
                last_updated: "07 September 2026",
                data_type: "HISTORICAL DATA",
                reliability: "Calculated Engineering Approximation (Non-regulatory)",
              }}
              metricTitle="Environmental Impact Index"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quantifying greenhouse gas reduction, methane prevention, and landfill diversion through segregated composting and recycling.
          </p>
        </div>
      </div>

      {/* Mandatory Official Disclaimer Box */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
            Statutory Scientific Disclaimer
          </h4>
          <p className="leading-relaxed">
            {envData.disclaimer}
          </p>
        </div>
      </div>

      {/* Primary Impact Indicators */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">CO2e Emissions Avoided</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {envData.co2e_avoided_daily_tons.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Tons / Day</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {envData.co2e_avoided_annual_tons.toLocaleString()} Tons annualized carbon offset.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Methane Emission Risk</span>
            <Wind className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {envData.methane_risk_daily_tons}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Tons CH4 / Day</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Risk from unsegregated organic waste dumped at open dumpyards.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Landfill Space Saved</span>
            <Trash2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-700">
              {envData.landfill_volume_saved_daily_m3.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">m³ / Day</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {envData.landfill_volume_saved_annual_m3.toLocaleString()} m³ annual dumpyard preservation.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Plastic Leakage Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {envData.plastic_leakage_risk_score}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Based on unsegregated commercial density in waterways.
          </p>
        </div>
      </section>

      {/* Methodology and Calculations Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-600" />
            <span>Calculation Framework & IPCC Constants</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The calculations utilize internationally recognized IPCC Tier-1 greenhouse gas conversion factors calibrated for tropical urban waste streams:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="p-2 bg-slate-50 rounded border border-slate-100">
              <strong>Organic Degradation:</strong> 1 ton of unsegregated food/garden waste in an open dumpsite produces approx <strong>0.075 tons of methane (CH₄)</strong> under anaerobic conditions.
            </li>
            <li className="p-2 bg-slate-50 rounded border border-slate-100">
              <strong>Methane GWP:</strong> Methane has a 100-year Global Warming Potential <strong>28 times greater than carbon dioxide</strong>. Diverting wet waste to Bio-CNG prevents severe atmospheric warming.
            </li>
            <li className="p-2 bg-slate-50 rounded border border-slate-100">
              <strong>Recycling Offsets:</strong> Recycling 1 ton of plastic prevents <strong>1.5 tons CO₂e</strong> compared to manufacturing virgin polymers from petroleum feedstocks.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-600" />
            <span>Ecological Equivalence Equivalents</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            What Chennai's source-segregation and recycling diversion accomplishes in equivalent terms:
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                🌳
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-semibold">Tree Plantation Equivalence</span>
                <p className="text-xl font-extrabold text-emerald-950">
                  {envData.trees_equivalent_saved_annual.toLocaleString()} Trees / Year
                </p>
                <p className="text-[11px] text-emerald-700">
                  In carbon sequestering capacity achieved by diverting paper and recyclables.
                </p>
              </div>
            </div>

            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                🚚
              </div>
              <div>
                <span className="text-xs text-sky-800 font-semibold">Landfill Haulage Relief</span>
                <p className="text-xl font-extrabold text-sky-950">
                  ~340 Compactor Trips Saved Daily
                </p>
                <p className="text-[11px] text-sky-700">
                  Through localized decentralized micro-composting centers (MCCs).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}