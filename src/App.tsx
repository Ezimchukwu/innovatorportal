import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PublicGalleryPage } from "./pages/PublicGalleryPage";
import { StudentDashboardPage } from "./pages/dashboards/StudentDashboardPage";
import { ParentDashboardPage } from "./pages/dashboards/ParentDashboardPage";
import { SchoolDashboardPage } from "./pages/dashboards/SchoolDashboardPage";
import { AdminDashboardPage } from "./pages/dashboards/AdminDashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<PublicGalleryPage />} />
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/parent" element={<ParentDashboardPage />} />
          <Route path="/school" element={<SchoolDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
