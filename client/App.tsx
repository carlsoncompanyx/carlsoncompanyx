import "./global.css";

import type { ReactNode } from "react";
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
import ProductCreate from "./pages/ProductCreate";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";

const queryClient = new QueryClient();

const renderProtectedPage = (page: React.ReactNode) => (
  <ProtectedRoute>
    <Layout>{page}</Layout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={renderProtectedPage(<Home />)} />
            <Route path="/Home" element={renderProtectedPage(<Home />)} />
            <Route
              path="/Finances"
              element={renderProtectedPage(<Finances />)}
            />
            <Route path="/Metrics" element={renderProtectedPage(<Metrics />)} />
            <Route path="/Emails" element={renderProtectedPage(<Emails />)} />
            <Route
              path="/ShortsGenerator"
              element={renderProtectedPage(<ShortsGenerator />)}
            />
            <Route
              path="/ProductCreate"
              element={renderProtectedPage(<ProductCreate />)}
            />
            <Route
              path="/Settings"
              element={renderProtectedPage(<Settings />)}
            />

            {/* catch-all */}
            <Route path="*" element={renderProtectedPage(<NotFound />)} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
