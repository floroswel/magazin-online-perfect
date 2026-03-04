import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { StoreBrandingProvider } from "@/hooks/useStoreBranding";
import { CartProvider } from "@/hooks/useCart";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { I18nProvider } from "@/hooks/useI18n";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CmsPage from "./pages/CmsPage";
import Install from "./pages/Install";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CustomScriptInjector from "./components/CustomScriptInjector";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <StoreBrandingProvider>
          <I18nProvider>
          <CurrencyProvider>
          <CartProvider>
            <CustomScriptInjector />
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/catalog" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
              <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
              <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
              <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/order-confirmation/:orderId" element={<ErrorBoundary><OrderConfirmation /></ErrorBoundary>} />
              <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
              <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
              <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
              <Route path="/account" element={<ErrorBoundary><Account /></ErrorBoundary>} />
              <Route path="/favorites" element={<ErrorBoundary><Favorites /></ErrorBoundary>} />
              <Route path="/compare" element={<ErrorBoundary><Compare /></ErrorBoundary>} />
              <Route path="/page/:slug" element={<ErrorBoundary><CmsPage /></ErrorBoundary>} />
              <Route path="/install" element={<ErrorBoundary><Install /></ErrorBoundary>} />
              <Route path="/admin/*" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </CartProvider>
          </CurrencyProvider>
          </I18nProvider>
          </StoreBrandingProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
