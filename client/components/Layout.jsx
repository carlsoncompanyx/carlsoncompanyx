import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Mail,
  DollarSign,
  TrendingUp,
  Wrench,
  Menu,
  X,
  ChevronDown,
  Settings,
} from "lucide-react";

const createPageUrl = (name) => `/${name}`;

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Hardcoded counts to match the design snapshot (no external calls)
  const unreadEmailCount = 85;
  const financeNotifications = 1;
  const toolNotifications = 1;

  const navigationItems = [
    { title: "Home", url: createPageUrl("Home"), icon: Home, badge: null },
    { title: "Finances", url: createPageUrl("Finances"), icon: DollarSign, badge: financeNotifications },
    { title: "Metrics", url: createPageUrl("Metrics"), icon: TrendingUp, badge: null },
    { title: "Emails", url: createPageUrl("Emails"), icon: Mail, badge: unreadEmailCount },
  ];

  const toolsItems = [
    { title: "Shorts Generator", url: createPageUrl("ShortsGenerator") },
    { title: "Product Creator", url: createPageUrl("ProductCreator") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to={createPageUrl("Home")} className="flex items-center group">
              <img
                src="https://ckqphrogexyzhwifuksr.supabase.co/storage/v1/object/sign/imagescarlsoncompany/CarlsonCompany%20Banner%20Upscaled.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kNWFlNDM3Ny1hY2YyLTRmMWEtOWEwZS00NWU5MTJjOTE1YjkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXNjYXJsc29uY29tcGFueS9DYXJsc29uQ29tcGFueSBCYW5uZXIgVXBzY2FsZWQucG5nIiwiaWF0IjoxNzYxMDc5NDkyLCJleHAiOjI3MDcxNTk0OTJ9.xD7hBpzKPEGO650PD1EL9vZWR8AC7Iby0cyK_Vs-9eg"
                alt="Carlson Company"
                className="h-13 w-auto transition-transform duration-300 group-hover:scale-90"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-2 bg-white/80 p-1 rounded-md">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-slate-700 text-white shadow-lg" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                    {item.badge ? (
                      <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5">{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}

              <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
                <button onClick={() => setToolsOpen((v) => !v)} className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <Wrench className="w-4 h-4" />
                  <span>Tools</span>
                  <ChevronDown className="w-3 h-3" />
                  {toolNotifications > 0 && (
                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5">{toolNotifications}</span>
                  )}
                </button>

                {toolsOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg p-2 z-50">
                    {toolsItems.map((t) => (
                      <Link key={t.title} to={t.url} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded">
                        {t.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.url ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </div>
                  {item.badge ? <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">{item.badge}</span> : null}
                </Link>
              ))}

              <div className="mt-2 border-t pt-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tools</div>
                {toolsItems.map((t) => (
                  <Link key={t.title} to={t.url} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
                    {t.title}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>

      <footer className="border-t border-slate-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2025 Carlson Company. All rights reserved.</p>
            <Link to={createPageUrl("Settings")} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
