import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PublicGalleryPage } from "./pages/PublicGalleryPage";
import { StudentDashboardPage } from "./pages/dashboards/StudentDashboardPage";
import { ParentDashboardPage } from "./pages/dashboards/ParentDashboardPage";
import { SchoolDashboardPage } from "./pages/dashboards/SchoolDashboardPage";
import { AdminDashboardPage } from "./pages/dashboards/AdminDashboardPage";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import PaymentsPage from "@/pages/PaymentsPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="relative min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/projects" element={<PublicGalleryPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/success" element={<PaymentSuccessPage />} />

              <Route element={<ProtectedRoute requireRole="student" />}>
                <Route path="/student" element={<StudentDashboardPage />} />
              </Route>
              <Route element={<ProtectedRoute requireRole="parent" />}>
                <Route path="/parent" element={<ParentDashboardPage />} />
              </Route>
              <Route element={<ProtectedRoute requireRole="school" />}>
                <Route path="/school" element={<SchoolDashboardPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<SuperAdminGuard />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
              </Route>
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <FloatingWhatsAppButton />
            {/* Mobile bottom navigation for quick access */}
            <MobileBottomNav />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
