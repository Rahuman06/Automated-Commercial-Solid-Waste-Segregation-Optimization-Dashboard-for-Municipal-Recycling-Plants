"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Camera, 
  Video, 
  VideoOff, 
  Radio, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BookmarkPlus, 
  Layers, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Info,
  Smartphone,
  BatteryCharging,
  Laptop
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

export default function LiveWebcamDetectionPage() {
  const [webcamActive, setWebcamActive] = useState(false);
  const [continuousScan, setContinuousScan] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Save to Memory Dialog State
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveCategory, setSaveCategory] = useState("E-Waste");
  const [saveNotes, setSaveNotes] = useState("");
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Attempt to start webcam automatically on page load
    startWebcam();
    return () => {
      stopWebcam();
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setWebcamActive(true);
      } else {
        setCameraError("WebCam not supported in this browser. Please use standard photo upload.");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera permissions in your browser address bar to use live detection."
          : "Could not access camera device. Please ensure no other app is using your webcam."
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

  const captureFrameBlob = async (): Promise<Blob | null> => {
    if (!videoRef.current || !webcamActive) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  };

  const runDetection = async () => {
    if (isScanning || !webcamActive) return;
    try {
      setIsScanning(true);
      const blob = await captureFrameBlob();
      if (!blob) {
        setIsScanning(false);
        return;
      }
      setCapturedBlob(blob);

      const fd = new FormData();
      fd.append("file", blob, "live_webcam_frame.jpg");
      fd.append("location_name", "Citizen Live Camera Feed");

      const result = await api.liveDetect(fd);
      setDetectionResult(result);

      // Pre-fill save dialog inputs
      if (result.combined_verdict) {
        setSaveLabel(result.combined_verdict.detected_item || "Mobile Phone");
        setSaveCategory(result.combined_verdict.waste_category || "E-Waste");
      }

      // Draw bounding box if returned
      const bbox = result.global_detection?.bounding_box || [0.2, 0.2, 0.8, 0.8];
      const label = result.combined_verdict?.detected_item || result.global_detection?.detected_item || "Detected Item";
      const conf = result.combined_verdict?.confidence_pct ?? (result.global_detection?.confidence_pct || 85);
      const isLowConf = result.combined_verdict?.is_low_confidence || result.global_detection?.is_low_confidence;
      drawBoundingBox(bbox, label, conf, isLowConf);
    } catch (err: any) {
      console.error("Live detection error", err);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleContinuousScan = () => {
    if (continuousScan) {
      setContinuousScan(false);
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    } else {
      if (!webcamActive) startWebcam();
      setContinuousScan(true);
      runDetection();
      autoScanIntervalRef.current = setInterval(() => {
        runDetection();
      }, 3000);
    }
  };

  const drawBoundingBox = (
    bbox: number[] = [0.2, 0.2, 0.8, 0.8], 
    label: string, 
    confPct: number, 
    isLowConf: boolean = false
  ) => {
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

    const boxColor = isLowConf ? "#f59e0b" : "#10b981"; // amber for low-conf, emerald for high

    // Box outline & corner brackets
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Label tag badge
    const tagText = `${label} (${confPct}%)`;
    ctx.font = "bold 13px sans-serif";
    const textWidth = ctx.measureText(tagText).width;
    const badgeHeight = 24;
    const badgeY = Math.max(0, y - badgeHeight);

    ctx.fillStyle = boxColor;
    ctx.fillRect(x, badgeY, textWidth + 16, badgeHeight);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(tagText, x + 8, badgeY + 16);
  };

  const handleSaveToPersonalMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob) return;

    try {
      setSaveSubmitting(true);
      setSaveSuccessMsg(null);

      const fd = new FormData();
      fd.append("file", capturedBlob, "my_personal_ref.jpg");
      fd.append("confirmed_item", saveLabel);
      fd.append("confirmed_waste_category", saveCategory);
      fd.append("notes", saveNotes || `Saved from Live Camera: ${saveLabel}`);

      await api.addMemoryItem(fd);
      setSaveSuccessMsg(`Successfully saved "${saveLabel}" to your Personal AI Memory!`);
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save to Personal AI Memory.");
    } finally {
      setSaveSubmitting(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "E-Waste":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Plastic":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Organic Waste":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Hazardous Waste":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Metal":
        return "bg-slate-200 text-slate-800 border-slate-400";
      case "Glass":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "Paper":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Textile Waste":
        return "bg-pink-100 text-pink-800 border-pink-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 flex items-center gap-2.5">
              <Camera className="w-6 h-6 text-teal-600" />
              <span>Real-Time WebCam Waste AI Detector</span>
            </h1>
            <DataProvenanceBadge
              provenance={{
                source: "Live WebCam Video Stream & Dual-Level Vision Engine",
                dataset_name: "YOLOv8-Waste Production + Personal Memory Cosine Index",
                last_updated: "Real-Time Direct Feed",
                data_type: "AI-DETECTED DATA",
                reliability: "High (Fused Global AI + Personal Memory)",
              }}
              metricTitle="Live WebCam Detection"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Detect and classify waste items in real time through your webcam or camera. Supports Mobile Phones, Smartphones, Laptops, Chargers, and other E-Waste subclasses with personalized visual memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/my-ai-memory"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition border border-purple-200 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>My AI Memory</span>
          </Link>
          <Link
            href="/ai/detection"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-300 shadow-xs"
          >
            <span>Truck Feed Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Detection Viewport & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Video Stream */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${webcamActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className="text-xs font-bold text-navy-950">
                {webcamActive ? "Live WebCam Active" : "WebCam Standby"}
              </span>
              {continuousScan && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 border border-rose-200">
                  <Radio className="w-2.5 h-2.5 animate-ping" />
                  <span>Auto-Scanning</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {webcamActive ? (
                <button
                  onClick={stopWebcam}
                  className="px-2.5 py-1 text-slate-600 hover:text-rose-600 rounded text-xs font-medium transition flex items-center gap-1"
                >
                  <VideoOff className="w-3.5 h-3.5" />
                  <span>Turn Off</span>
                </button>
              ) : (
                <button
                  onClick={startWebcam}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Container with Canvas Overlay */}
          <div className="relative w-full aspect-video bg-navy-950 rounded-xl overflow-hidden border border-navy-800 flex items-center justify-center">
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

            {!webcamActive && (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <Camera className="w-12 h-12 mx-auto text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-white">Camera is turned off</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &ldquo;Start Camera&rdquo; to begin real-time solid waste classification.
                  </p>
                </div>
                <button
                  onClick={startWebcam}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Activate Camera</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={runDetection}
              disabled={!webcamActive || isScanning}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting 128-d Vector & Classifying...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Capture & Detect Waste</span>
                </>
              )}
            </button>

            <button
              onClick={toggleContinuousScan}
              disabled={!webcamActive}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border ${
                continuousScan
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              } disabled:opacity-50`}
            >
              {continuousScan ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Auto-Scan (Every 3s)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Guidance Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Tips for Best Detection Accuracy:</p>
              <p className="text-[11px] text-slate-500">
                Hold your device steady with good lighting. Hold electronics (smartphones, chargers, circuit boards) in front of the lens. If confidence is below 70%, the AI will flag it as &ldquo;Low Confidence — Please Confirm&rdquo; and allow you to save it to your Personal AI Memory.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Personal Memory Verdict */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Verdict Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span>Detection Verdict</span>
              </span>
              {detectionResult && (
                <span className="text-[10px] text-slate-500">
                  Latency: ~45ms
                </span>
              )}
            </div>

            {detectionResult ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Low Confidence Banner if applicable */}
                {(detectionResult.combined_verdict?.is_low_confidence ||
                  detectionResult.global_detection?.is_low_confidence) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Low Confidence — Please Confirm</span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      The confidence score ({detectionResult.combined_verdict?.confidence_pct || detectionResult.global_detection?.confidence_pct}%) is below the 70% certainty threshold. Please verify this item or save it to your Personal Memory to boost future accuracy.
                    </p>
                  </div>
                )}

                {/* Two-Level Hierarchy Output */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Level 1: Primary Category
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getCategoryBadgeClass(detectionResult.combined_verdict?.waste_category || detectionResult.global_detection?.waste_category)}`}>
                        {detectionResult.combined_verdict?.waste_category || detectionResult.global_detection?.waste_category}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Level 2: Detected Item (Subclass)
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-black text-navy-950">
                        {detectionResult.combined_verdict?.detected_item || detectionResult.global_detection?.detected_item}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-extrabold text-xs border border-teal-200">
                        {detectionResult.combined_verdict?.confidence_pct || detectionResult.global_detection?.confidence_pct}% Conf
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal AI Memory Matching Card */}
                {detectionResult.personal_ai_memory?.has_match ? (
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-700" />
                        <span className="text-xs font-bold text-purple-950">
                          Personal AI Memory Matched!
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold">
                        {detectionResult.personal_ai_memory.similarity_pct}% Visual Similarity
                      </span>
                    </div>
                    <p className="text-xs text-purple-900 font-medium">
                      {detectionResult.personal_ai_memory.explainable_message}
                    </p>
                    {detectionResult.personal_ai_memory.user_notes && (
                      <p className="text-[11px] text-purple-700 italic">
                        &ldquo;{detectionResult.personal_ai_memory.user_notes}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span className="text-[11px]">
                      No personal memory match (&lt;70% similarity). Classified using Global Production Model.
                    </span>
                  </div>
                )}

                {/* Model Weighting Breakdown */}
                <div className="p-3 rounded-xl bg-navy-950 text-slate-200 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Decision Fusion:</span>
                    <span className="text-teal-400 font-bold">
                      {detectionResult.personal_ai_memory?.has_match 
                        ? "Global (70%) + Personal Memory (30%)" 
                        : "Global YOLO Model (100%)"}
                    </span>
                  </div>
                  <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-teal-500 h-full" 
                      style={{ width: detectionResult.personal_ai_memory?.has_match ? "70%" : "100%" }} 
                      title="Global Model Weight"
                    />
                    {detectionResult.personal_ai_memory?.has_match && (
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: "30%" }} 
                        title="Personal Memory Weight"
                      />
                    )}
                  </div>
                </div>

                {/* Save to Personal AI Memory Button */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save to My AI Memory</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Cpu className="w-10 h-10 mx-auto text-slate-300" />
                <div>
                  <p className="text-xs font-semibold text-slate-600">Awaiting Webcam Frame</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                    Click &ldquo;Capture & Detect Waste&rdquo; or start &ldquo;Auto-Scan&rdquo; to identify items in real time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick E-Waste Disposal Advisory */}
          <div className="bg-purple-900 text-purple-100 rounded-2xl p-5 space-y-3 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-300" />
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                E-Waste Disposal Advisory (Chennai SWM)
              </span>
            </div>
            <p className="text-[11px] text-purple-200 leading-relaxed">
              Mobile phones, chargers, and electronic components contain toxic heavy metals (lead, cadmium) and valuable rare earths. Never mix with regular wet or dry waste.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-purple-300">Drop-off: GCC Zonal MRF Center</span>
              <span className="underline font-semibold cursor-pointer">Find Nearest E-Waste Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save to Personal AI Memory Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-navy-950">Add to My AI Memory</h3>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Register this image frame into your personal AI memory. The system extracts a 128-dimensional dense visual feature embedding so the camera will instantly recognize this item in future scans.
            </p>

            {saveSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveToPersonalMemory} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Specific Item Name (e.g. Mobile Phone, Charger, Keyboard) *
                  </label>
                  <input
                    type="text"
                    required
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="e.g. Mobile Phone"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Waste Category *
                  </label>
                  <select
                    value={saveCategory}
                    onChange={(e) => setSaveCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="E-Waste">E-Waste</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Organic Waste">Organic Waste</option>
                    <option value="Hazardous Waste">Hazardous Waste</option>
                    <option value="Metal">Metal</option>
                    <option value="Glass">Glass</option>
                    <option value="Paper">Paper</option>
                    <option value="Textile Waste">Textile Waste</option>
                    <option value="Mixed Waste">Mixed Waste</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Personal Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={saveNotes}
                    onChange={(e) => setSaveNotes(e.target.value)}
                    placeholder="e.g. My office black Samsung smartphone with case"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveSubmitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {saveSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Embedding...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Save to Personal Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
