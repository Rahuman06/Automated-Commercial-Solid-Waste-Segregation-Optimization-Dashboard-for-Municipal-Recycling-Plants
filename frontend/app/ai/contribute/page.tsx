"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  AlertCircle, 
  Award, 
  ArrowRight,
  Info,
  Camera,
  RefreshCw,
  Video,
  VideoOff
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

export default function ContributeToImproveAIPage() {
  const [inputMode, setInputMode] = useState<"camera" | "upload">("camera");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);

  // WebCam states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // User confirmation / correction form
  const [userChoice, setUserChoice] = useState<"confirm" | "correct" | null>(null);
  const [correctedCategory, setCorrectedCategory] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [wardNumber, setWardNumber] = useState<number>(102);
  const [contributorName, setContributorName] = useState<string>("Citizen Volunteer");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "environment" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError("Camera device not supported in this browser. Please use upload mode.");
      }
    } catch (err: any) {
      console.error(err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera permissions in your browser."
          : "Camera device not accessible. You can upload an image file instead."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const snapPhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;

    const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(blob));
    stopCamera();

    // Trigger AI prediction
    runPrediction(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      runPrediction(file);
    }
  };

  const runPrediction = async (file: File) => {
    setPredictionData(null);
    setUserChoice(null);
    setSubmitResult(null);
    try {
      setPredicting(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.uploadAndPredict(fd);
      setPredictionData(res);
      setCorrectedCategory(res.ai_prediction.category);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!predictionData) return;
    try {
      setSubmitting(true);
      const isCorrected = userChoice === "correct" && correctedCategory !== predictionData.ai_prediction.category;

      const fd = new FormData();
      fd.append("image_url", predictionData.image_url);
      fd.append("image_hash", predictionData.image_hash);
      fd.append("file_size_kb", predictionData.file_size_kb.toString());
      fd.append("ai_predicted_category", predictionData.ai_prediction.category);
      fd.append("ai_confidence", predictionData.ai_prediction.confidence.toString());
      fd.append("user_confirmed_category", isCorrected ? correctedCategory : predictionData.ai_prediction.category);
      fd.append("is_user_corrected", isCorrected ? "true" : "false");
      if (userNotes) fd.append("user_notes", userNotes);
      fd.append("blur_score", predictionData.quality_check.blur_score.toString());
      fd.append("ward_number", wardNumber.toString());
      fd.append("contributor_name", contributorName);

      const res = await api.confirmAndSubmit(fd);
      setSubmitResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Continuous Machine Learning Pipeline • Citizen AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
          Contribute Waste Photos to Train Municipal AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          &ldquo;Your contribution can help improve waste detection accuracy across municipal collection trucks and sorting facilities.&rdquo;
        </p>
      </div>

      {/* Main Workflow Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs font-bold text-slate-500">
          <span className={!selectedFile ? "text-teal-700" : "text-slate-400"}>1. Camera / Upload</span>
          <span>→</span>
          <span className={selectedFile && !userChoice ? "text-teal-700" : "text-slate-400"}>2. AI Prediction</span>
          <span>→</span>
          <span className={userChoice && !submitResult ? "text-teal-700" : "text-slate-400"}>3. Confirm Label</span>
          <span>→</span>
          <span className={submitResult ? "text-teal-700 font-extrabold" : "text-slate-400"}>4. Added to Dataset</span>
        </div>

        {/* Step 1: Input Selection (WebCam or Upload) */}
        {!selectedFile ? (
          <div className="space-y-4">
            {/* Toggle Modes */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    setInputMode("camera");
                    startCamera();
                  }}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    inputMode === "camera" ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-900"
                  }`}
                >
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>Snap Photo with WebCam / Camera</span>
                </button>
                <button
                  onClick={() => {
                    setInputMode("upload");
                    stopCamera();
                  }}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                    inputMode === "upload" ? "bg-white text-navy-950 shadow-xs" : "text-slate-600 hover:text-navy-900"
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-sky-600" />
                  <span>Upload Image File</span>
                </button>
              </div>
            </div>

            {inputMode === "camera" ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center shadow-inner max-w-xl mx-auto">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive ? (
                  <div className="text-center p-6 space-y-3 text-slate-400">
                    <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Camera Offline</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Allow camera access to capture a waste photo directly from your phone or webcam.
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Camera</span>
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                    <button
                      onClick={snapPhoto}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-full shadow-lg border-2 border-white flex items-center gap-2 transition transform hover:scale-105"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Waste Photo & Predict</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 rounded-2xl p-10 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-950">
                    Click or Drag & Drop waste image here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP from mobile cameras or desktop
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 max-w-xl mx-auto">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 2: Prediction Display & Quality Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Preview */}
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-64 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl!}
                    alt="Contributed waste"
                    className="w-full h-full object-cover"
                  />
                  {predicting && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI Model Analyzing Waste Features...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setPredictionData(null);
                    setSubmitResult(null);
                    if (inputMode === "camera") {
                      startCamera();
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 transition underline block text-center w-full"
                >
                  Capture or choose a different photo
                </button>
              </div>

              {/* AI Prediction & Validation Check Panel */}
              <div className="space-y-4">
                {predictionData ? (
                  <>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          AI Vision Prediction (YOLO v2.1)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {predictionData.ai_prediction.confidence_pct}% Confidence
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Identified Category:</span>
                        <span className="text-lg font-extrabold text-navy-950">
                          {predictionData.ai_prediction.category}
                        </span>
                        <span className="text-slate-500 text-xs block">
                          Specific item: {predictionData.ai_prediction.detected_item}
                        </span>
                      </div>

                      {/* Automated Quality Checks */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                        <span className="font-semibold text-slate-700 block">Automated Image Quality Inspection:</span>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Sharpness / Blur Score:</span>
                          <span className={predictionData.quality_check.blur_score > 35 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                            {predictionData.quality_check.blur_score} / 100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Duplicate Hash Check:</span>
                          <span className="text-emerald-600 font-bold">Unique Entry (Clean)</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Image Resolution:</span>
                          <span className="text-emerald-600 font-bold">Valid for Dataset</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: User Confirmation Options */}
                    {!submitResult && (
                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-navy-950 block">
                          Is this classification correct?
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setUserChoice("confirm")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                              userChoice === "confirm"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Yes, Correct</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserChoice("correct")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                              userChoice === "correct"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>No, Correct It</span>
                          </button>
                        </div>

                        {/* Correction Selector */}
                        {userChoice === "correct" && (
                          <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs animate-in fade-in">
                            <label className="font-semibold text-amber-900 block">
                              Select Actual Waste Category:
                            </label>
                            <select
                              value={correctedCategory}
                              onChange={(e) => setCorrectedCategory(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-slate-800 font-medium text-xs focus:outline-none"
                            >
                              {predictionData.all_categories.map((cat: string) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Contributor Details */}
                        {userChoice && (
                          <div className="space-y-2 text-xs pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-slate-600 block text-[11px]">Your Name / Handle:</label>
                                <input
                                  type="text"
                                  value={contributorName}
                                  onChange={(e) => setContributorName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-slate-600 block text-[11px]">Chennai Ward (Optional):</label>
                                <input
                                  type="number"
                                  value={wardNumber}
                                  onChange={(e) => setWardNumber(parseInt(e.target.value) || 100)}
                                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleConfirmSubmit}
                              disabled={submitting}
                              className="w-full py-2.5 bg-navy-900 hover:bg-navy-950 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                            >
                              {submitting ? (
                                <span>Submitting to Training Dataset...</span>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Submit to Training Dataset (+{userChoice === "correct" ? 20 : 10} Eco Points)</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Inference engine analyzing image...
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Success Message & Next Steps */}
            {submitResult && (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Contribution Validated & Staged Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                    {submitResult.message} You earned <strong>+{submitResult.points_earned} Eco Points</strong> for supporting Chennai Swachhata AI.
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setPredictionData(null);
                      setSubmitResult(null);
                      if (inputMode === "camera") {
                        startCamera();
                      }
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition"
                  >
                    Take Another Photo
                  </button>
                  <Link
                    href="/ai/my-contributions"
                    className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-50 transition"
                  >
                    View My Contributions
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Gate Information */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Automated Quality & Model Deployment Safeguards</span>
        </span>
        <p>
          Uploaded images undergo automatic resolution checks, blur filtering via Laplacian variance, and hash duplicate detection.
          Contributed images expand the candidate training dataset. A newly retrained model is only deployed to production after passing administrative safety gates and exceeding current accuracy benchmarks.
        </p>
      </div>
    </div>
  );
}