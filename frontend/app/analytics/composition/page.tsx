"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Recycle, 
  Sparkles, 
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { MetricTooltip } from "@/components/MetricTooltip";

export default function WasteCompositionAnalysisPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashData, trendsData] = await Promise.all([
          api.getDashboardSummary(),
          api.getCompositionTrends(),
        ]);
        setSummary(dashData);
        setTrends(trendsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !summary) {
    return <div className="p-8 text-center text-slate-400">Loading Waste Composition Analytics...</div>;
  }

  // Format categories data for charts
  const pieData = summary.categories.map((c: any) => ({
    name: c.name,
    value: c.quantity_tons,
    percentage: c.percentage,
    color: c.color,
  }));

  const barData = summary.categories.map((c: any) => ({
    name: c.name,
    tons: c.quantity_tons,
    recyclability: c.recyclability_pct,
    fill: c.color,
  }));

  const trendMonthsData = trends?.months.map((m: string, idx: number) => {
    const item: any = { month: m };
    trends.series.forEach((s: any) => {
      item[s.name] = s.data[idx];
    });
    return item;
  }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Waste Composition & Material Recovery Analytics
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "Greater Chennai Corporation & CPCB SWM Audits",
                dataset_name: "Metropolitan Waste Characterization & Recycling Register",
                last_updated: "07 September 2026",
                data_type: "HISTORICAL DATA",
                reliability: "Verified Municipal Laboratory Characterization",
              }}
              metricTitle="Waste Stream Composition"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            In-depth material fraction breakdown, 6-month seasonal trends, and commercial recyclability potential across 11 solid waste categories.
          </p>
        </div>
      </div>

      {/* 4 Essential Municipal Questions Answered */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Highest Produced Category
          </span>
          <h3 className="text-lg font-extrabold text-emerald-700">Organic & Food Waste</h3>
          <p className="text-xs text-slate-600">
            Accounts for <strong>60.0%</strong> (3,417 Tons/day) of all municipal solid waste in Chennai.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Plastic Concentration
          </span>
          <h3 className="text-lg font-extrabold text-sky-700">14.0% of Daily Volume</h3>
          <p className="text-xs text-slate-600">
            <strong>797.5 Tons/day</strong> across rigid PET/HDPE bottles and multi-layer single-use packaging.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Is Organic Waste Rising?
          </span>
          <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-lg">
            <span>+2.4% Seasonal Rise</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-600">
            Increased summer horticultural cuttings and wholesale vegetable market surpluses.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Highest Recycling Potential
          </span>
          <h3 className="text-lg font-extrabold text-indigo-700">Glass & Metal (98-100%)</h3>
          <p className="text-xs text-slate-600">
            Near-infinite re-melt cycle with highest commercial scrap buyback value in Tamil Nadu.
          </p>
        </div>
      </section>

      {/* Main Charts Row: Pie Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 11-Category Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-teal-600" />
                <span>11 Municipal Waste Categories (Share %)</span>
              </h3>
              <p className="text-xs text-slate-500">Relative distribution by weight.</p>
            </div>
            <MetricTooltip text="Visual representation of how every 100 kg of solid waste collected in Chennai is divided across standard categories." />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name.split(' ')[0]} ${percentage}%`}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, props: any) => [
                    `${val} Tons/day (${props.payload.percentage}%)`,
                    props.payload.name,
                  ]}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Tonnage Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Daily Weight (Tons / Day) by Stream</span>
              </h3>
              <p className="text-xs text-slate-500">Quantitative municipal volume comparison.</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => [`${val} Tons`, "Daily Tonnage"]} />
                <Bar dataKey="tons" radius={[4, 4, 0, 0]}>
                  {barData.map((entry: any, index: number) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6-Month Trend Time-Series Chart */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>6-Month Waste Generation Trajectory (April - September 2026)</span>
            </h3>
            <p className="text-xs text-slate-500">Tracking category variations and source-segregation policy impacts.</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendMonthsData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Line type="monotone" dataKey="Organic Waste" stroke="#10B981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="Food Waste" stroke="#84CC16" strokeWidth={2} />
              <Line type="monotone" dataKey="Plastic" stroke="#0EA5E9" strokeWidth={2} />
              <Line type="monotone" dataKey="Paper & Cardboard" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="Mixed Waste" stroke="#64748B" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Analytical Insights Bullet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-700">
          {trends?.key_insights?.map((ins: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></span>
              <span>{ins}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}