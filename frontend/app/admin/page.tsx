"use client";

import React, { useEffect, useState } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Users, 
  Zap, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Server, 
  SlidersHorizontal,
  Key
} from "lucide-react";
import { api } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdministrationPage() {
  const [activeRole, setActiveRole] = useState("system_admin");
  const [simulationMode, setSimulationMode] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [simStatus, healthData] = await Promise.all([
          api.getSimulationStatus(),
          fetch("http://localhost:8000/api/health").then(r => r.json()),
        ]);
        setSimulationMode(simStatus.simulation_mode);
        setHealth(healthData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handleRoleChange = async (roleKey: string) => {
    try {
      await api.switchRole(roleKey);
      setActiveRole(roleKey);
      setMessage(`Switched active persona to ${roleKey.replace("_", " ").toUpperCase()}`);
      localStorage.setItem("user_role", roleKey);
      window.dispatchEvent(new Event("roleChanged"));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleSimulation = async () => {
    try {
      const res = await api.toggleSimulation();
      setSimulationMode(res.simulation_mode);
      setMessage(res.message);
    } catch (err: any) {
      console.error(err);
    }
  };

  const rolesList = [
    { key: "public", title: "Public Citizen", desc: "View public municipal dashboard, GIS map, ward rankings, and submit community waste photos." },
    { key: "contributor", title: "Registered Contributor", desc: "Upload waste photos, correct labels, track personal verification history, and earn eco badges." },
    { key: "municipal_officer", title: "Municipal Officer (GCC)", desc: "Track daily zone tonnages, dispatch compactor trucks, and manage critical operational alerts." },
    { key: "plant_operator", title: "Plant Operator", desc: "Update facility capacity inputs, log maintenance shutdowns, and monitor incoming segregated streams." },
    { key: "ai_admin", title: "AI Administrator", desc: "Manage continuous retraining pipeline, benchmark candidate models, and deploy or roll back versions." },
    { key: "system_admin", title: "System Administrator", desc: "Unrestricted administrative access to data connectors, fleet parameters, and system configuration." },
  ];

  return (
    <ProtectedRoute allowedRoles={["system_admin"]}>
      <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
          System Administration & Persona Access Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Configure municipal platform parameters, switch user role personas, toggle live simulation modes, and inspect backend system health.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Switcher Matrix */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Role-Based Access Control (RBAC) Switcher</span>
            </h2>
            <p className="text-xs text-slate-500">
              Instantly test and preview the dashboard from different municipal stakeholder viewpoints.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-teal-50 text-teal-800 text-xs font-extrabold rounded-full border border-teal-200 uppercase">
            Active: {activeRole.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rolesList.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRoleChange(r.key)}
              className={`p-4 rounded-xl text-left border transition flex flex-col justify-between space-y-2 ${
                activeRole === r.key
                  ? "bg-teal-50/50 border-teal-500 shadow-sm ring-1 ring-teal-500"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-navy-950">{r.title}</span>
                {activeRole === r.key && (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {r.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Simulation Mode Toggle Card */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Simulation Mode Controller</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-lg">
              When enabled, generates synthetic demonstration coordinates for all 24 smart collection trucks, live camera feeds, and real-time weighbridge load variations. All charts will display the unmistakable <strong>SIMULATED DATA</strong> banner.
            </p>
          </div>

          <button
            onClick={handleToggleSimulation}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              simulationMode
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                : "bg-navy-900 hover:bg-navy-950 text-white"
            }`}
          >
            {simulationMode ? "Disable Simulation Mode" : "Enable Simulation Mode"}
          </button>
        </div>
      </section>

      {/* Backend Health Check Inspector */}
      {health && (
        <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-600" />
            <span>FastAPI Server & SQLite Spatial Database Health</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">API Status</span>
              <span className="font-bold text-emerald-700 capitalize">{health.status}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Zones Configured</span>
              <span className="font-bold text-navy-950">{health.zones_count} GCC Zones</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Wards Seeded</span>
              <span className="font-bold text-navy-950">{health.wards_count} Wards</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">API Version</span>
              <span className="font-bold text-teal-700">v{health.version}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  </ProtectedRoute>
  );
}