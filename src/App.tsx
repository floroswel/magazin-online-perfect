import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SettingsProvider } from "@/hooks/useSettings";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";

const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const routeFallback = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#F8F5EF",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(184,147,90,0.2)",
        borderTopColor: "#B8935A",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <SettingsProvider>
            <ErrorBoundary>
              <Suspense fallback={routeFallback}>
                <Routes>
                  <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                  <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
                  <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
                  <Route path="/admin/*" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
