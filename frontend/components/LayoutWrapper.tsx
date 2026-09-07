"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { AuthProvider } from "@/lib/auth-context";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 overflow-x-hidden">
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
            {children}
          </div>
          
          <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                © 2026 Greater Chennai Corporation — Department of Solid Waste Management & Smart City AI
              </p>
              <div className="flex items-center space-x-4 text-slate-400">
                <span>Ripon Building, Chennai - 600003</span>
                <span>•</span>
                <span className="text-teal-700 font-medium">Model Version: YOLO-v2.1 Production</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  </AuthProvider>
);
}