import React from "react";

const NavItem: React.FC<{ label?: string; icon?: React.ReactNode; badge?: number }> = ({ label, icon, badge }) => {
  return (
    <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
      {icon}
      {label && <span>{label}</span>}
      {badge ? (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-2 py-0.5">{badge}</span>
      ) : null}
    </button>
  );
};

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold">C</div>
            <div>
              <div className="text-sm font-semibold text-slate-800">CARLSON COMPANY</div>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <NavItem label="Home" />
          <NavItem label="Finances" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V3m0 8a8 8 0 100 16v-8z" /></svg>} />
          <NavItem label="Metrics" />
          <NavItem label="Emails" badge={85} />
          <NavItem label="Tools" />
        </nav>
      </div>
    </header>
  );
}
