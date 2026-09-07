"use client";

import React, { useEffect, useState } from "react";
import { 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Filter,
  Check
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolvedIds, setResolvedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [priorityFilter]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await api.getAlerts(priorityFilter === "all" ? undefined : priorityFilter);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleResolve = async (id: number) => {
    try {
      setResolvingId(id);
      await api.resolveAlert(id);
      setResolvedIds([...resolvedIds, id]);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Operational Waste Management Alerts & Incident Log
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "GCC Central Municipal Control Room & IoT Sensors",
                dataset_name: "Live Incident Notification Dispatch",
                last_updated: "Real-Time Telemetry",
                data_type: "LIVE DATA",
                reliability: "High - GCC Automated Sensor Trigger",
              }}
              metricTitle="Operational Incident Log"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time threshold triggers across plant capacities, acute waste accumulations, commercial plastic spikes, and camera quality faults.
          </p>
        </div>
      </div>

      {/* Priority Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs overflow-x-auto">
        <span className="text-slate-500 font-semibold px-2">Filter Priority:</span>
        {["all", "Critical", "High", "Medium", "Low"].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-lg font-bold transition capitalize ${
              priorityFilter === p
                ? "bg-navy-950 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p === "all" ? "All Alerts" : p}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const isResolved = resolvedIds.includes(alert.id);

          return (
            <div
              key={alert.id}
              className={`bg-white rounded-xl p-6 border shadow-sm transition space-y-3 ${
                isResolved
                  ? "opacity-60 bg-slate-50 border-slate-200"
                  : alert.priority === "Critical"
                  ? "border-rose-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${getPriorityStyle(alert.priority)}`}>
                    {alert.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {alert.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    • {alert.alert_code}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-navy-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>{alert.location_name}</span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {alert.issue}
                </p>
              </div>

              {/* Recommended Action & Trigger Button */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wide">
                    Mandated Operational Action:
                  </span>
                  <p className="text-slate-800 font-medium">{alert.recommended_action}</p>
                </div>

                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={isResolved || resolvingId === alert.id}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    isResolved
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : "bg-navy-900 hover:bg-navy-950 text-white shadow-sm"
                  }`}
                >
                  {isResolved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Incident Resolved</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledge & Resolve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}