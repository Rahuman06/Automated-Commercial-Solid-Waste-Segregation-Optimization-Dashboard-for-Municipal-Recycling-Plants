"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PlantItem {
  id: number;
  name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  capacity_tpd: number;
  current_input_tpd: number;
  utilization_pct: number;
  status: string;
  accepted_categories: string;
}

interface VehicleItem {
  id: number;
  vehicle_code: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  current_fill_pct: number;
  battery_or_fuel_pct: number;
  status: string;
  assigned_route: string;
  assigned_ward_id: number;
}

interface WardItem {
  id: number;
  ward_number: number;
  name: string;
  latitude: number;
  longitude: number;
  daily_waste_tons: number;
  segregation_efficiency: number;
  pollution_risk_score: number;
  primary_waste_type: string;
}

interface LeafletMapProps {
  plants?: PlantItem[];
  vehicles?: VehicleItem[];
  wards?: WardItem[];
  onSelectEntity?: (entity: { type: string; data: any }) => void;
  selectedWard?: number | null;
}

export default function LeafletMap({
  plants = [],
  vehicles = [],
  wards = [],
  onSelectEntity,
  selectedWard,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer toggle states
  const [showVehicles, setShowVehicles] = useState(true);
  const [showPlants, setShowPlants] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Marker layer groups
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);
  const plantLayerRef = useRef<L.LayerGroup | null>(null);
  const wardLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Chennai center coordinates
    const map = L.map(mapContainerRef.current, {
      center: [13.0604, 80.2496], // Chennai center
      zoom: 11,
      minZoom: 10,
      maxZoom: 17,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GCC GIS',
      maxZoom: 19,
    }).addTo(map);

    vehicleLayerRef.current = L.layerGroup().addTo(map);
    plantLayerRef.current = L.layerGroup().addTo(map);
    wardLayerRef.current = L.layerGroup().addTo(map);
    heatLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Plants
  useEffect(() => {
    if (!plantLayerRef.current) return;
    plantLayerRef.current.clearLayers();

    if (!showPlants) return;

    plants.forEach((plant) => {
      const isOverloaded = plant.utilization_pct > 85;
      const isMaint = plant.status === "maintenance";
      const iconColor = isMaint ? "#64748b" : isOverloaded ? "#dc2626" : "#0d9488";

      const customIcon = L.divIcon({
        className: "custom-plant-icon",
        html: `<div style="background-color: ${iconColor}; width: 26px; height: 26px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">🏭</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([plant.latitude, plant.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="font-weight: 700; font-size: 13px; color: #0b1e36; margin-bottom: 4px;">${plant.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${plant.facility_type}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Capacity:</strong> ${plant.capacity_tpd} TPD</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Input:</strong> ${plant.current_input_tpd} TPD</div>
          <div style="font-size: 11px; margin-bottom: 4px;"><strong>Utilization:</strong> <span style="font-weight: bold; color: ${isOverloaded ? '#dc2626' : '#0d9488'};">${plant.utilization_pct}%</span></div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background-color: ${plant.status === 'active' ? '#ecfdf5' : '#f1f5f9'}; color: ${plant.status === 'active' ? '#047857' : '#475569'};">
            ${plant.status}
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectEntity) onSelectEntity({ type: "plant", data: plant });
      });

      marker.addTo(plantLayerRef.current!);
    });
  }, [plants, showPlants, onSelectEntity]);

  // Update Vehicles
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();

    if (!showVehicles) return;

    vehicles.forEach((v) => {
      const isHighFill = v.current_fill_pct > 80;
      const customIcon = L.divIcon({
        className: "custom-truck-icon",
        html: `<div style="background-color: ${isHighFill ? '#f59e0b' : '#0284c7'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">🚛</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([v.latitude, v.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="font-weight: 700; font-size: 13px; color: #0b1e36;">${v.vehicle_code} - Smart Truck</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Driver: ${v.driver_name}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Route:</strong> ${v.assigned_route}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Fill Level:</strong> ${v.current_fill_pct}%</div>
          <div style="font-size: 11px; margin-bottom: 4px;"><strong>Battery/Fuel:</strong> ${v.battery_or_fuel_pct}%</div>
          <div style="font-size: 10px; color: #0284c7; font-weight: bold;">Camera: Streaming AI Vision</div>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectEntity) onSelectEntity({ type: "vehicle", data: v });
      });

      marker.addTo(vehicleLayerRef.current!);
    });
  }, [vehicles, showVehicles, onSelectEntity]);

  // Update Wards and Waste Intensity Heatmap
  useEffect(() => {
    if (!wardLayerRef.current || !heatLayerRef.current) return;
    wardLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    wards.forEach((w) => {
      const isHighGen = w.daily_waste_tons > 32.0;
      const isMedGen = w.daily_waste_tons >= 25.0;
      const heatColor = isHighGen ? "#ef4444" : isMedGen ? "#f59e0b" : "#10b981";

      // Intensity circles (Heatmap)
      if (showHeatmap) {
        const circle = L.circle([w.latitude, w.longitude], {
          radius: isHighGen ? 650 : 450,
          fillColor: heatColor,
          fillOpacity: 0.28,
          color: heatColor,
          weight: 1,
        });
        circle.addTo(heatLayerRef.current!);
      }

      // Ward Point Markers
      if (showWards) {
        const point = L.circleMarker([w.latitude, w.longitude], {
          radius: 5,
          fillColor: heatColor,
          fillOpacity: 0.9,
          color: "#ffffff",
          weight: 1.5,
        });

        point.bindPopup(`
          <div style="font-family: sans-serif; min-width: 190px;">
            <div style="font-weight: 700; font-size: 12px; color: #0b1e36;">${w.name}</div>
            <div style="font-size: 11px; margin-top: 4px;"><strong>Daily Waste:</strong> ${w.daily_waste_tons} Tons</div>
            <div style="font-size: 11px;"><strong>Segregation:</strong> ${w.segregation_efficiency}%</div>
            <div style="font-size: 11px;"><strong>Pollution Risk:</strong> ${w.pollution_risk_score}/100</div>
            <div style="font-size: 11px; color: #0d9488; font-weight: 600;">Primary: ${w.primary_waste_type}</div>
          </div>
        `);

        point.on("click", () => {
          if (onSelectEntity) onSelectEntity({ type: "ward", data: w });
        });

        point.addTo(wardLayerRef.current!);
      }
    });
  }, [wards, showWards, showHeatmap, onSelectEntity]);

  // Pan to selected ward if changed
  useEffect(() => {
    if (!selectedWard || !mapInstanceRef.current) return;
    const target = wards.find((w) => w.ward_number === selectedWard);
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, {
        duration: 1.2,
      });
    }
  }, [selectedWard, wards]);

  return (
    <div className="relative w-full h-[550px] lg:h-[650px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-2 max-w-xs">
        <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px]">
          Map Layers & Filters
        </div>

        <label className="flex items-center space-x-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showPlants}
            onChange={(e) => setShowPlants(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-600 inline-block"></span>
            <span>Segregation & Recycling Plants ({plants.length})</span>
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showVehicles}
            onChange={(e) => setShowVehicles(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
            <span>Smart Trucks GC-01..24 ({vehicles.length})</span>
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showWards}
            onChange={(e) => setShowWards(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>Ward Collection Hubs ({wards.length})</span>
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500 inline-block"></span>
            <span>Waste Intensity Heatmap</span>
          </span>
        </label>

        {/* Legend */}
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> High Waste (&gt;32 TPD)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}