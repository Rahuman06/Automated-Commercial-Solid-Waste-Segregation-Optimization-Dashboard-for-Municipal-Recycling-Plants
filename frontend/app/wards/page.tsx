"use client";

import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  MapPin, 
  Trash2, 
  AlertTriangle, 
  Recycle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Filter,
  Search,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { MetricTooltip } from "@/components/MetricTooltip";

export default function WardAnalyticsPage() {
  const [wards, setWards] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [selectedWardNumber, setSelectedWardNumber] = useState<number>(82);
  const [wardDetail, setWardDetail] = useState<any>(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("daily_waste_tons");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [wardsData, rankingsData] = await Promise.all([
          api.getWards(activeZoneFilter || undefined, sortBy),
          api.getWardRankings(),
        ]);
        setWards(wardsData);
        setRankings(rankingsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeZoneFilter, sortBy]);

  useEffect(() => {
    if (selectedWardNumber) {
      api.getWardByNumber(selectedWardNumber)
        .then((detail) => setWardDetail(detail))
        .catch((err) => console.error(err));
    }
  }, [selectedWardNumber]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Ward Analytics & Municipal Performance
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "Greater Chennai Corporation Solid Waste Department & AI Ward Audits",
                dataset_name: "200-Ward Solid Waste Profiling Index",
                last_updated: "07 September 2026",
                data_type: "HISTORICAL DATA",
                reliability: "High - GCC Ward Weighbridge Registry",
              }}
              metricTitle="Ward Analytics Registry"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comparative performance, waste characterization, and operational risk metrics across all 200 Chennai municipal wards.
          </p>
        </div>
      </div>

      {/* 6 Ward Rankings Leaderboards */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <span>Chennai Ward Rankings & Critical Leaderboards</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map((rank, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-teal-200 transition"
            >
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wide">
                    {rank.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rank.description}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  TOP 5
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {rank.wards.map((w: any, wIdx: number) => (
                  <button
                    key={wIdx}
                    onClick={() => setSelectedWardNumber(w.ward_number)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs transition text-left group"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {wIdx + 1}
                      </span>
                      <span className="truncate text-slate-800 font-medium group-hover:text-teal-700">
                        {w.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-navy-900 ml-2 flex-shrink-0">
                      {w.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Ward Profile Drawer */}
      {wardDetail && (
        <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Zone {wardDetail.zone_number}: {wardDetail.zone_name}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Ward {wardDetail.ward_number}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-navy-950 mt-1">
                {wardDetail.name}
              </h2>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Population</span>
                <span className="font-bold text-navy-900">{wardDetail.population.toLocaleString()} Residents</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Daily Frequency</span>
                <span className="font-bold text-teal-700">{wardDetail.collection_frequency_per_day} Times / Day</span>
              </div>
            </div>
          </div>

          {/* Ward Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Daily Waste Generated</span>
              <p className="text-lg font-extrabold text-navy-900 mt-0.5">
                {wardDetail.daily_waste_tons} <span className="text-xs font-normal">Tons</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Segregation Efficiency</span>
              <p className={`text-lg font-extrabold mt-0.5 ${wardDetail.segregation_efficiency > 65 ? "text-emerald-600" : "text-amber-600"}`}>
                {wardDetail.segregation_efficiency}%
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Pollution Risk Score</span>
              <p className={`text-lg font-extrabold mt-0.5 ${wardDetail.pollution_risk_score > 60 ? "text-rose-600" : "text-emerald-600"}`}>
                {wardDetail.pollution_risk_score} <span className="text-xs font-normal">/ 100</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">Recycling Potential</span>
              <p className="text-lg font-extrabold text-sky-600 mt-0.5">
                {wardDetail.recycling_potential}%
              </p>
            </div>
          </div>

          {/* Waste Composition Breakdown for Ward */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
              Ward Waste Composition Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {wardDetail.category_breakdown.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{item.category}</span>
                  </div>
                  <span className="text-sm font-extrabold text-navy-900">{item.tons} T</span>
                  <span className="text-[10px] text-slate-400 block">({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations and Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-100 space-y-2 text-xs">
              <h4 className="font-bold text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>AI Operational Recommendations for Ward {wardDetail.ward_number}</span>
              </h4>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                {wardDetail.ai_recommendations.map((rec: string, rIdx: number) => (
                  <li key={rIdx}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Nearby Recycling & Segregation Facilities</span>
              </h4>
              <div className="space-y-1 text-slate-600">
                {wardDetail.nearby_plants.map((np: any, nIdx: number) => (
                  <div key={nIdx} className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="font-medium">{np.name}</span>
                    <span className="text-slate-500 font-mono">{np.distance_km} km • {np.capacity_status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Ward Explorer Table */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide">
              Complete Chennai Ward Registry ({wards.length} Wards)
            </h3>
            <p className="text-xs text-slate-500">Filter and sort wards by generation, segregation, and pollution risk.</p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="daily_waste_tons">Waste Generation (High to Low)</option>
              <option value="segregation_efficiency">Segregation Efficiency</option>
              <option value="pollution_risk_score">Pollution Risk Score</option>
              <option value="recycling_potential">Recycling Potential</option>
              <option value="ward_number">Ward Number</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Ward No.</th>
                <th className="p-3">Ward Name</th>
                <th className="p-3">Zone</th>
                <th className="p-3">Daily Waste</th>
                <th className="p-3">Segregation</th>
                <th className="p-3">Pollution Risk</th>
                <th className="p-3">Primary Category</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wards.slice(0, 15).map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-navy-950">Ward {w.ward_number}</td>
                  <td className="p-3 font-semibold text-slate-800">{w.name}</td>
                  <td className="p-3">Zone {w.zone_number}</td>
                  <td className="p-3 font-bold text-slate-900">{w.daily_waste_tons} TPD</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${w.segregation_efficiency > 65 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {w.segregation_efficiency}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`font-semibold ${w.pollution_risk_score > 60 ? "text-rose-600" : "text-slate-700"}`}>
                      {w.pollution_risk_score}/100
                    </span>
                  </td>
                  <td className="p-3 text-teal-700 font-medium">{w.primary_waste_type}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedWardNumber(w.ward_number);
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1 bg-navy-800 text-white rounded text-[11px] font-semibold hover:bg-navy-900 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}