"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Lock, 
  Info,
  ArrowRight,
  Database,
  Cpu
} from "lucide-react";
import { api } from "@/lib/api";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function PersonalAIMemoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Dialog
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newCategory, setNewCategory] = useState("E-Waste");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Dialog
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Interactive Test Match Sandbox
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testPreviewUrl, setTestPreviewUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    loadMemoryData();
  }, []);

  async function loadMemoryData() {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        api.getMemoryItems().catch(() => []),
        api.getMemoryStats().catch(() => null),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading AI memory items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFormError("Please select a clear photo of your item.");
      return;
    }
    if (!newItemName.trim()) {
      setFormError("Please provide an item name (e.g. Mobile Phone, Charger).");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("confirmed_item", newItemName.trim());
      fd.append("confirmed_waste_category", newCategory);
      if (newNotes.trim()) {
        fd.append("notes", newNotes.trim());
      }

      await api.addMemoryItem(fd);
      setShowAddModal(false);
      // Reset form
      setUploadFile(null);
      setPreviewUrl(null);
      setNewItemName("");
      setNewNotes("");
      await loadMemoryData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to add memory reference.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (refId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from your AI Memory?`)) return;
    try {
      await api.deleteMemoryItem(refId);
      await loadMemoryData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete item.");
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditItemName(item.confirmed_item);
    setEditCategory(item.confirmed_waste_category);
    setEditNotes(item.notes || "");
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsUpdating(true);
      await api.updateMemoryItem(editingItem.id, {
        confirmed_item: editItemName,
        confirmed_waste_category: editCategory,
        notes: editNotes,
      });
      setEditingItem(null);
      await loadMemoryData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update item.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Test Sandbox Execution
  const handleTestMatch = async () => {
    if (!testFile) return;
    try {
      setIsTesting(true);
      const fd = new FormData();
      fd.append("file", testFile);
      const res = await api.searchMemoryMatch(fd);
      setTestResult(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error running memory match sandbox.");
    } finally {
      setIsTesting(false);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter((item) => {
    if (!item) return false;
    const q = (searchQuery || "").toLowerCase();
    return (
      (item.confirmed_item || "").toLowerCase().includes(q) ||
      (item.confirmed_waste_category || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute allowedRoles={["public", "contributor", "municipal_officer", "plant_operator", "ai_admin", "system_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span>My Waste AI Memory</span>
              </h1>
              <DataProvenanceBadge
                provenance={{
                  source: "User Encrypted AI Memory & 128-d Cosine Similarity Store",
                  dataset_name: "Private User AI Reference Embeddings",
                  last_updated: "Real-Time User Sandbox",
                  data_type: "AI-DETECTED DATA",
                  reliability: "High (Private User Vector Isolation)",
                }}
                metricTitle="Personal AI Memory"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Teach the AI to recognize your specific personal items (smartphones, cables, power banks, bottles). Your confirmed items are stored securely in your private memory vault and combined with the global AI for higher precision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live-detection"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition border border-teal-200 shadow-xs"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Open Live Camera</span>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Reference</span>
            </button>
          </div>
        </div>

        {/* Privacy & Architecture Guarantee Alert */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                <span>Zero-Leakage Privacy & Vector Isolation Guarantee</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold">User-Scoped</span>
              </h3>
              <p className="text-xs text-purple-800 leading-relaxed max-w-3xl">
                Every image you save produces a dense 128-dimensional normalized visual embedding. Your references are strictly accessible only to your account and never shared with other users. When scanning with the camera, the system fuses 70% Global AI + 30% Personal AI Memory for personalized accuracy.
              </p>
            </div>
          </div>

          {stats && (
            <div className="flex items-center gap-3 self-end sm:self-auto bg-white px-4 py-2 rounded-xl border border-purple-200 text-center shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Indexed Items</span>
                <span className="text-lg font-black text-purple-900">{stats.total_references || 0}</span>
              </div>
              <div className="w-px h-8 bg-purple-100" />
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">Feature Dims</span>
                <span className="text-lg font-black text-teal-700">128-d</span>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your saved memory items by name or category..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-navy-950 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
            />
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredItems.length} of {items.length} personal reference items
          </span>
        </div>

        {/* Personal Memory Items Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-xs font-semibold">Loading your AI Memory library...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">No Personal AI Memory References Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Take photos of your phone, charger, mouse, or household items and register them here. The AI will learn their unique visual traits and recognize them instantly in camera feeds!
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Reference</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-4/3 bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.confirmed_item}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-purple-300" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-100 text-[10px] font-extrabold backdrop-blur-xs">
                      {item.confirmed_waste_category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 text-[9px] font-extrabold backdrop-blur-xs flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>128-d Vector</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-black text-navy-950 truncate">
                      {item.confirmed_item}
                    </h4>
                    {item.notes ? (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.notes}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No notes provided</p>
                    )}
                    <p className="text-[10px] text-slate-400 pt-1">
                      Saved: {item.created_at ? item.created_at.substring(0, 10) : "Recently"}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-slate-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id, item.confirmed_item)}
                    className="text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Test Sandbox */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <span>Test Memory Match Sandbox</span>
              </h3>
              <p className="text-xs text-slate-500">
                Upload any sample photo to evaluate cosine similarity matching against your private 128-dimensional vector library in real time.
              </p>
            </div>
            <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
              Threshold: &gt;= 70%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload test photo */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Select Photo to Test
              </label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-purple-400 transition bg-slate-50">
                {testPreviewUrl ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={testPreviewUrl}
                      alt="Test preview"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-xs text-slate-500 truncate">{testFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">Click to upload a test waste photo</p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, WebP supported</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setTestFile(f);
                      setTestPreviewUrl(URL.createObjectURL(f));
                      setTestResult(null);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button
                onClick={handleTestMatch}
                disabled={!testFile || isTesting}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching 128-d Vector Space...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compute Cosine Similarity</span>
                  </>
                )}
              </button>
            </div>

            {/* Test match result */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Match Search Output
                </span>
                {testResult ? (
                  <div className="space-y-3 text-xs">
                    {testResult.has_match ? (
                      <div className="p-4 rounded-xl bg-purple-100 border border-purple-300 text-purple-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-purple-900">
                            ✓ Positive Memory Match Found!
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-black">
                            {testResult.similarity_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-purple-800">
                          {testResult.explainable_message}
                        </p>
                        <div className="text-[11px] text-purple-900 font-mono pt-1">
                          Matched Item: <strong>{testResult.matched_item}</strong> ({testResult.matched_category})
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>No Confident Match Found</span>
                        </div>
                        <p className="text-xs text-amber-700">
                          Highest visual similarity was {testResult.best_similarity_pct || 0}%, which is below the 70% threshold.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Upload an image and click Compute Cosine Similarity.</p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-200">
                Algorithm: Normalized Euclidean Inner-Product over 128 Dense Color-Spatial Features
              </div>
            </div>
          </div>
        </section>

        {/* Add Reference Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-navy-950">Add Personal Memory Reference</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddItem} className="space-y-4">
                {/* Photo Dropzone */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Item Reference Photo *
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-purple-400 transition bg-slate-50">
                    {previewUrl ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-lg object-contain"
                        />
                        <span className="text-[11px] text-purple-600 font-semibold block">
                          Click to change photo
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-4">
                        <Camera className="w-8 h-8 mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Upload clear photo of item</p>
                        <p className="text-[10px] text-slate-400">Captures phones, chargers, boards, plastics</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Specific Item Name (e.g. Mobile Phone, Laptop, USB Cable, Power Bank) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Mobile Phone"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
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
                    Personal Context Notes
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Black OnePlus smartphone with dual camera bump"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting 128-d Vector...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Save to AI Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Reference Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-navy-950">Edit Memory Reference</h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Specific Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
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
                    Personal Context Notes
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Update Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
