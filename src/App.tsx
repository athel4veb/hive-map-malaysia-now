
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StartupExplore from "./pages/StartupExplore";
import VCExplore from "./pages/VCExplore";
import DataInput from "./pages/DataInput";
import AdminPanel from "./pages/AdminPanel";
import Matchmaker from "./pages/Matchmaker";
import ConnectionHub from "./pages/ConnectionHub";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/startups" element={<StartupExplore />} />
          <Route path="/vc" element={<VCExplore />} />
          <Route path="/contribute" element={<DataInput />} />
          <Route path="/matchmaker" element={<Matchmaker />} />
          <Route path="/connection-hub" element={<ConnectionHub />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
