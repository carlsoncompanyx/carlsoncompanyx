import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "./pages/Home";
import Finances from "./pages/Finances";
import Metrics from "./pages/Metrics";
import Emails from "./pages/Emails";
import ShortsGenerator from "./pages/ShortsGenerator";
import ProductCreator from "./pages/ProductCreator";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/Home" element={<Layout><Home /></Layout>} />
          <Route path="/Finances" element={<Layout><Finances /></Layout>} />
          <Route path="/Metrics" element={<Layout><Metrics /></Layout>} />
          <Route path="/Emails" element={<Layout><Emails /></Layout>} />
          <Route path="/ShortsGenerator" element={<Layout><ShortsGenerator /></Layout>} />
          <Route path="/ProductCreator" element={<Layout><ProductCreator /></Layout>} />
          <Route path="/Settings" element={<Layout><Settings /></Layout>} />

          {/* catch-all */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
