"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { 
  MapPin, 
  Truck, 
  Factory, 
  Layers, 
  Filter, 
  Search, 
  Info,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

// Dynamic import of LeafletMap to bypass SSR
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] lg:h-[650px] rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
      Loading GIS Map of Chennai...
    </div>
  ),
});

export default function LiveWasteMapPage() {
  const [plants, setPlants] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null);
  const [selectedWardNumber, setSelectedWardNumber] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        setLoading(true);
        const [plantsData, vehiclesData, wardsData] = await Promise.all([
          api.getPlants(),
          api.getVehicles(),
          api.getWards(),
        ]);
        setPlants(plantsData);
        setVehicles(vehiclesData);
        setWards(wardsData);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  const filteredWards = wards.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.ward_number.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Live Municipal GIS Waste Map
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "GCC GIS Center & Smart Fleet GPS",
                dataset_name: "Greater Chennai Geospatial Infrastructure Registry",
                last_updated: "Near Real-Time",
                data_type: "NEAR REAL-TIME DATA",
                reliability: "High - GCC IoT / Vehicle Telemetry",
              }}
              metricTitle="Live GIS Map"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time geospatial tracking of 24 smart collection trucks, 12 recycling and segregation facilities,
            and 200 ward waste intensity zones across Chennai.
          </p>
        </div>
      </div>

      {/* Main Map Layout with Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left GIS Map View (3 Columns) */}
        <div className="lg:col-span-3">
          <LeafletMap
            plants={plants}
            vehicles={vehicles}
            wards={wards}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
            selectedWard={selectedWardNumber}
          />
        </div>

        {/* Right Info & Search Panel (1 Column) */}
        <div className="space-y-4">
          {/* Ward Search & Fast Selector */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-teal-600" />
              <span>Locate Ward (1-200)</span>
            </h3>

            <div className="relative">
              <input
                type="text"
                placeholder="Search ward name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {filteredWards.slice(0, 8).map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWardNumber(w.ward_number);
                    setSelectedEntity({ type: "ward", data: w });
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                    selectedWardNumber === w.ward_number
                      ? "bg-teal-50 text-teal-900 font-bold border border-teal-200"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {w.daily_waste_tons}T
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Entity Inspector Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>Entity Inspector</span>
            </h3>

            {selectedEntity ? (
              <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    {selectedEntity.type.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedEntity.data.name || selectedEntity.data.vehicle_code}
                  </h4>
                </div>

                {selectedEntity.type === "plant" && (
                  <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-2">
                    <p><strong>Facility Type:</strong> {selectedEntity.data.facility_type}</p>
                    <p><strong>Capacity:</strong> {selectedEntity.data.capacity_tpd} Tons/Day</p>
                    <p><strong>Current Inflow:</strong> {selectedEntity.data.current_input_tpd} TPD</p>
                    <p><strong>Utilization:</strong> <span className={selectedEntity.data.utilization_pct > 85 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>{selectedEntity.data.utilization_pct}%</span></p>
                    <p><strong>Operator:</strong> {selectedEntity.data.operator_name}</p>
                    <p><strong>Contact:</strong> {selectedEntity.data.contact_phone}</p>
                  </div>
                )}

                {selectedEntity.type === "vehicle" && (
                  <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-2">
                    <p><strong>Assigned Route:</strong> {selectedEntity.data.assigned_route}</p>
                    <p><strong>Driver:</strong> {selectedEntity.data.driver_name}</p>
                    <p><strong>Fill Level:</strong> {selectedEntity.data.current_fill_pct}%</p>
                    <p><strong>Fuel / Battery:</strong> {selectedEntity.data.battery_or_fuel_pct}%</p>
                    <p><strong>Status:</strong> <span className="text-emerald-700 font-bold capitalize">{selectedEntity.data.status}</span></p>
                    <p className="text-[11px] text-teal-600 font-medium">Front Camera: Active AI Stream</p>
                  </div>
                )}

                {selectedEntity.type === "ward" && (
                  <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-2">
                    <p><strong>Ward Number:</strong> {selectedEntity.data.ward_number}</p>
                    <p><strong>Daily Waste:</strong> {selectedEntity.data.daily_waste_tons} Tons/day</p>
                    <p><strong>Segregation Efficiency:</strong> {selectedEntity.data.segregation_efficiency}%</p>
                    <p><strong>Pollution Risk Score:</strong> {selectedEntity.data.pollution_risk_score}/100</p>
                    <p><strong>Primary Stream:</strong> {selectedEntity.data.primary_waste_type}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Click any Plant, Smart Truck, or Ward marker on the map to inspect live data.
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Facilities:</span>
              <span className="font-bold text-navy-900">{plants.filter(p => p.status === "active").length} / {plants.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fleet On Road:</span>
              <span className="font-bold text-navy-900">{vehicles.length} Trucks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monitored Wards:</span>
              <span className="font-bold text-navy-900">{wards.length} Wards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}