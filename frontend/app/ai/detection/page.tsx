"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  ScanEye, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Truck, 
  MapPin, 
  Clock, 
  Cpu, 
  Sparkles,
  RefreshCw,
  Video,
  VideoOff,
  Radio,
  Play,
  Pause,
  BookmarkPlus
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

export default function AIWasteDetectionPage() {
  const [detections, setDetections] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  
  // Camera & Input Mode states: "webcam" | "upload" | "simulation"
  const [inputMode, setInputMode] = useState<"webcam" | "upload">("webcam");
  const [webcamActive, setWebcamActive] = useState(false);
  const [continuousScan, setContinuousScan] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanning & Inference states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [fileToScan, setFileToScan] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDetections();
    const timer = setInterval(loadDetections, 12000);
    return () => clearInterval(timer);
  }, [selectedVehicle]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
    };
  }, []);

  async function loadDetections() {
    try {
      setLoading(true);
      const data = await api.getRecentDetections(
        selectedVehicle === "all" ? undefined : selectedVehicle,
        30
      );
      setDetections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // WebCam Management
  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "environment" // Use back camera on mobile or default webcam on PC
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setWebcamActive(true);
      } else {
        setCameraError("WebCam not supported in this browser. Please use photo upload mode.");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera permissions in your browser bar."
          : "Could not access camera device. You can test with custom photo upload."
      );
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setContinuousScan(false);
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
  };

  // Capture frame from active WebCam or File
  const captureAndPredict = async () => {
    if (isScanning) return;
    try {
      setIsScanning(true);
      const fd = new FormData();
      fd.append("vehicle_code", "GC-14");
      fd.append("ward_number", "102");
      fd.append("location_name", "Royapuram Harbor High Road");

      if (inputMode === "webcam" && videoRef.current && webcamActive) {
        // Draw video frame to an off-screen canvas
        const video = videoRef.current;
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = video.videoWidth || 640;
        offscreenCanvas.height = video.videoHeight || 480;
        const ctx = offscreenCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const blob = await new Promise<Blob | null>((resolve) =>
            offscreenCanvas.toBlob(resolve, "image/jpeg", 0.85)
          );
          if (blob) {
            fd.append("file", blob, "webcam_frame.jpg");
          }
        }
      } else if (fileToScan) {
        fd.append("file", fileToScan);
      }

      const res = await api.simulateTruckScan(fd);
      setScanResult(res);
      drawBoundingBox(res.bounding_box, res.detected_item || res.waste_category, res.confidence);
      await loadDetections();
    } catch (err) {
      console.error("Scan error", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle continuous auto-scan every 3.5 seconds
  const toggleContinuousScan = () => {
    if (continuousScan) {
      setContinuousScan(false);
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    } else {
      if (!webcamActive) {
        startWebcam();
      }
      setContinuousScan(true);
      // Run once immediately, then periodically
      captureAndPredict();
      autoScanIntervalRef.current = setInterval(() => {
        captureAndPredict();
      }, 3500);
    }
  };

  // Draw bounding box over canvas
  const drawBoundingBox = (bbox: number[] = [0.2, 0.2, 0.8, 0.8], label: string, conf: number) => {
    const canvas = canvasOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const [ymin, xmin, ymax, xmax] = bbox;
    const x = xmin * canvas.width;
    const y = ymin * canvas.height;
    const w = (xmax - xmin) * canvas.width;
    const h = (ymax - ymin) * canvas.height;

    // Outer glow & box
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Label tag
    ctx.fillStyle = "#10B981";
    const text = `${label} (${Math.round(conf * 100)}%)`;
    ctx.fillRect(x, Math.max(0, y - 22), ctx.measureText(text).width + 16, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(text, x + 6, Math.max(15, y - 6));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToScan(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950">
              Smart Garbage Truck AI Waste Detection Feed & Live Camera
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "GCC Fleet Edge YOLO Classifier & On-Board Camera Stream",
                dataset_name: "Live Computer Vision Roadside Stream",
                last_updated: "Real-Time Camera Stream",
                data_type: "AI-DETECTED DATA",
                reliability: "High (YOLOv8-Waste Production Model v2.1)",
              }}
              metricTitle="AI Waste Detections"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-world computer vision architecture: Truck Camera → Image Capture → Dual-Level AI Detection → Personal Memory Fusion → GPS Location → Central Database.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/live-detection"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Dedicated Live Camera</span>
          </Link>
          <Link
            href="/my-ai-memory"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition border border-purple-200 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>My AI Memory</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Camera Feed & Prediction Station */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              <span>Smart Truck Camera & WebCam Waste Classifier</span>
            </h2>
            <p className="text-xs text-slate-500">
              Detect and classify solid waste in real-time using your device camera or uploaded collection photo.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => {
                setInputMode("webcam");
                if (!webcamActive) startWebcam();
              }}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                inputMode === "webcam" ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-900"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-teal-600" />
              <span>Live WebCam</span>
            </button>
            <button
              onClick={() => {
                setInputMode("upload");
                stopWebcam();
              }}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                inputMode === "upload" ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-900"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>

        {/* Viewport Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Viewport: Live WebCam Stream or File Preview */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
              {inputMode === "webcam" ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${webcamActive ? "block" : "hidden"}`}
                  />
                  <canvas
                    ref={canvasOverlayRef}
                    width={640}
                    height={360}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />

                  {/* WebCam Off State */}
                  {!webcamActive && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <VideoOff className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">WebCam Currently Inactive</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          Click &ldquo;Start WebCam Feed&rdquo; to test real-time object classification from your camera.
                        </p>
                      </div>
                      <button
                        onClick={startWebcam}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Start WebCam Feed</span>
                      </button>
                    </div>
                  )}

                  {/* Live Continuous Scan Indicator Tag */}
                  {webcamActive && continuousScan && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs shadow-md">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>Live Auto-Scanning</span>
                    </div>
                  )}
                </>
              ) : (
                /* Upload Mode Viewport */
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Roadside Capture Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <canvas
                        ref={canvasOverlayRef}
                        width={640}
                        height={360}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-slate-400">
                      <Upload className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-semibold text-white">Upload Roadside Waste Photo</p>
                      <p className="text-[11px] text-slate-400">Click below to select an image from your computer</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload roadside image"
                  />
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Camera Control Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {inputMode === "webcam" ? (
                <>
                  <button
                    onClick={captureAndPredict}
                    disabled={!webcamActive || isScanning}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Classifying Frame...</span>
                      </>
                    ) : (
                      <>
                        <ScanEye className="w-4 h-4" />
                        <span>Capture & Predict Waste</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={toggleContinuousScan}
                    disabled={!webcamActive}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                      continuousScan
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    } disabled:opacity-50`}
                  >
                    {continuousScan ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause Auto-Scan</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Continuous Auto-Scan (3s)</span>
                      </>
                    )}
                  </button>

                  {webcamActive && (
                    <button
                      onClick={stopWebcam}
                      className="px-3 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                      title="Turn off camera"
                    >
                      <VideoOff className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={captureAndPredict}
                  disabled={!fileToScan || isScanning}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Classifying File...</span>
                    </>
                  ) : (
                    <>
                      <ScanEye className="w-4 h-4" />
                      <span>Run AI Model on Image</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Viewport: Real-Time Diagnostic Feed & Telemetry Card */}
          <div className="bg-navy-950 text-slate-200 rounded-2xl p-6 font-mono text-xs space-y-4 border border-navy-800 flex flex-col justify-between shadow-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-navy-800">
                <span className="text-teal-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                  <span>AI Vision Telemetry Dashboard</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Vehicle: GC-14 (Zone 5)</span>
              </div>

              {scanResult ? (
                <div className="space-y-3 text-xs animate-in fade-in duration-200">
                  {/* Low Confidence Banner */}
                  {(scanResult.is_low_confidence || scanResult.confidence < 0.70) && (
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Low Confidence — Please Confirm ({Math.round(scanResult.confidence * 100)}%)</span>
                    </div>
                  )}

                  {/* Level 1 & Level 2 Classification Box */}
                  <div className="p-3 rounded-xl bg-navy-900 border border-teal-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Level 1: Category</span>
                        <span className="text-xs font-extrabold text-teal-400">
                          {scanResult.waste_category}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/30">
                        {Math.round(scanResult.confidence * 100)}% Conf.
                      </span>
                    </div>
                    <div className="pt-2 border-t border-navy-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Level 2: Detected Item</span>
                      <span className="text-base font-black text-white">
                        {scanResult.detected_item || scanResult.waste_category}
                      </span>
                    </div>
                  </div>

                  {/* Personal AI Memory match if available */}
                  {scanResult.personal_ai_memory?.has_match && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-purple-300 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Personal AI Memory Matched</span>
                        </span>
                        <span className="text-[10px] bg-purple-800/60 text-purple-200 px-2 py-0.5 rounded-full font-bold">
                          {scanResult.personal_ai_memory.similarity_pct}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200">
                        {scanResult.personal_ai_memory.explainable_message}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 p-3 bg-navy-900/50 rounded-xl border border-navy-800 text-slate-300 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Location:</span>
                      <strong className="text-white">Ward 102 (Royapuram)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">GPS Coords:</span>
                      <strong className="text-slate-300">13.0827° N, 80.2707° E</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Est. Weight:</span>
                      <strong className="text-sky-300">{scanResult.estimated_weight_kg} kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Bin Fill Level:</span>
                      <strong className="text-amber-300">72% Volume</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-800/40 text-[11px] text-teal-200 space-y-1">
                    <p className="font-bold text-teal-300">Recycling Routing Action:</p>
                    <p>Direct to Pallikaranai MRF for optical sorting & mechanical baling.</p>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-1">
                    Detection Code: {scanResult.detection_code} • Model: YOLOv8-v2.1 Production
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <ScanEye className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs">Camera scanner ready.</p>
                  <p className="text-[11px] text-slate-400">
                    Point your camera at a waste object (e.g. plastic bottle, paper, cardboard) and click <strong>Capture & Predict Waste</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-navy-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Pipeline: WebCam Capture → Frame Normalize → YOLOv8 → SWM DB</span>
              <span className="text-teal-400">Inference: ~65ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live AI Detection Feed Stream */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live AI Detection Stream from Municipal Fleet</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of AI-identified waste items, confidence scores, and collection vehicle positions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter Vehicle:</span>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            >
              <option value="all">All 24 Vehicles</option>
              {[...Array(24)].map((_, i) => {
                const code = `GC-${String(i + 1).padStart(2, '0')}`;
                return <option key={code} value={code}>{code}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {detections.map((det) => (
            <div
              key={det.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {det.vehicle_code} • Ward {det.ward_number}
                  </span>
                  <h4 className="text-sm font-bold text-navy-950 mt-1">
                    {det.waste_category}
                  </h4>
                </div>

                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {Math.round(det.confidence * 100)}%
                </span>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-slate-800">{det.location_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Weight:</span>
                  <span className="font-medium text-slate-800">{det.estimated_weight_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Bin Fill Level:</span>
                  <span className="font-medium text-slate-800">{det.bin_fill_level_pct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Model: {det.model_version}</span>
                <span>{new Date(det.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}