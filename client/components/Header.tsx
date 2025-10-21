import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/Home" className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8eda219e135b5d9dd26c4/73932103f_CarlsonCompanyBanner.jpeg"
              alt="Carlson Company"
              className="h-16 object-contain"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Link to="/Home" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-700"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            Home
          </Link>

          <Link to="/Finances" className="relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Finances
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5">1</span>
          </Link>

          <Link to="/Metrics" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            Metrics
          </Link>

          <Link to="/Emails" className="relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            Emails
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5">85</span>
          </Link>

          <div className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded="false" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
              Tools
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m6 9 6 6 6-6"></path></svg>
              <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5">1</span>
            </button>
          </div>
        </nav>

        <div className="md:hidden">
          <button className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
