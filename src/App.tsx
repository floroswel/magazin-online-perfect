import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

import { EditableContentProvider } from "@/hooks/useEditableContent";
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

import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CmsPage from "./pages/CmsPage";
import Install from "./pages/Install";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CustomScriptInjector from "./components/CustomScriptInjector";
import ErrorBoundary from "./components/ErrorBoundary";
import MaintenanceGuard from "./components/MaintenanceGuard";
import Affiliates from "./pages/Affiliates";
import RecoverCart from "./pages/RecoverCart";
import Unsubscribe from "./pages/Unsubscribe";
import Personalizare from "./pages/Personalizare";

import CorporateGifting from "./pages/CorporateGifting";
import QuizParfum from "./pages/QuizParfum";
import IngrijireLumanari from "./pages/IngrijireLumanari";
import Recenzii from "./pages/Recenzii";
import Tracking from "./pages/Tracking";
import LivrareInternationala from "./pages/LivrareInternationala";
import ComenziEvenimente from "./pages/ComenziEvenimente";
import VendorStore from "./pages/VendorStore";
import Oferte from "./pages/Oferte";
import DeIncredere from "./pages/DeIncredere";
import NouLansari from "./pages/NouLansari";
import TransparencyDashboard from "./pages/TransparencyDashboard";
import GiftCards from "./pages/GiftCards";
import SeoLanding from "./pages/SeoLanding";
import SeoHub from "./pages/SeoHub";
import SeasonalCollections from "./pages/SeasonalCollections";
import VirtualTryOn from "./pages/VirtualTryOn";
import SitemapXml from "./pages/SitemapXml";
import PostDelivery from "./pages/PostDelivery";
import { useAffiliateTracking } from "./hooks/useAffiliateTracking";
import { initTracking, trackPageView } from "./hooks/useMarketingTracking";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const AffiliateTracker = () => { useAffiliateTracking(); return null; };

const TrackingInit = () => {
  const location = useLocation();
  useEffect(() => { initTracking(); }, []);
  useEffect(() => { trackPageView(); }, [location.pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>

          <EditableContentProvider>
          <I18nProvider>
          <CurrencyProvider>
          <CartProvider>
            <CustomScriptInjector />
            <AffiliateTracker />
            <TrackingInit />
            <ErrorBoundary>
            <MaintenanceGuard>
            <Routes>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/catalog" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
              <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
              <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
              <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
              <Route path="/checkout/recover" element={<ErrorBoundary><RecoverCart /></ErrorBoundary>} />
              <Route path="/order-confirmation/:orderId" element={<ErrorBoundary><OrderConfirmation /></ErrorBoundary>} />
              <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
              <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
              <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
              <Route path="/account" element={<ErrorBoundary><Account /></ErrorBoundary>} />
              <Route path="/favorites" element={<ErrorBoundary><Favorites /></ErrorBoundary>} />
              <Route path="/compare" element={<ErrorBoundary><Compare /></ErrorBoundary>} />
              <Route path="/page/:slug" element={<ErrorBoundary><CmsPage /></ErrorBoundary>} />
              <Route path="/install" element={<ErrorBoundary><Install /></ErrorBoundary>} />
              <Route path="/afilieri" element={<ErrorBoundary><Affiliates /></ErrorBoundary>} />
              <Route path="/faq" element={<ErrorBoundary><CmsPage overrideSlug="faq" /></ErrorBoundary>} />
              <Route path="/tracking" element={<ErrorBoundary><Tracking /></ErrorBoundary>} />
              <Route path="/livrare-internationala" element={<ErrorBoundary><LivrareInternationala /></ErrorBoundary>} />
              <Route path="/comenzi-bulk-evenimente" element={<ErrorBoundary><ComenziEvenimente /></ErrorBoundary>} />
              <Route path="/personalizare" element={<ErrorBoundary><Personalizare /></ErrorBoundary>} />
              
              <Route path="/corporate-gifting" element={<ErrorBoundary><CorporateGifting /></ErrorBoundary>} />
              <Route path="/quiz-parfum" element={<ErrorBoundary><QuizParfum /></ErrorBoundary>} />
              <Route path="/ingrijire-lumanari" element={<ErrorBoundary><IngrijireLumanari /></ErrorBoundary>} />
              <Route path="/povestea-noastra" element={<ErrorBoundary><CmsPage overrideSlug="despre-noi" /></ErrorBoundary>} />
              <Route path="/recenzii" element={<ErrorBoundary><Recenzii /></ErrorBoundary>} />
              <Route path="/unsubscribe" element={<ErrorBoundary><Unsubscribe /></ErrorBoundary>} />
              <Route path="/vendor/:slug" element={<ErrorBoundary><VendorStore /></ErrorBoundary>} />
              <Route path="/oferte" element={<ErrorBoundary><Oferte /></ErrorBoundary>} />
              <Route path="/de-incredere" element={<ErrorBoundary><DeIncredere /></ErrorBoundary>} />
              <Route path="/nou" element={<ErrorBoundary><NouLansari /></ErrorBoundary>} />
              <Route path="/card-cadou" element={<ErrorBoundary><GiftCards /></ErrorBoundary>} />
              <Route path="/despre-noi/numere" element={<ErrorBoundary><TransparencyDashboard /></ErrorBoundary>} />
              <Route path="/l" element={<ErrorBoundary><SeoHub /></ErrorBoundary>} />
              <Route path="/l/:city/:category" element={<ErrorBoundary><SeoLanding /></ErrorBoundary>} />
              <Route path="/colectii-sezoniere" element={<ErrorBoundary><SeasonalCollections /></ErrorBoundary>} />
              <Route path="/virtual-try-on" element={<ErrorBoundary><VirtualTryOn /></ErrorBoundary>} />
              <Route path="/post-delivery/:token" element={<ErrorBoundary><PostDelivery /></ErrorBoundary>} />
              <Route path="/contact" element={<ErrorBoundary><CmsPage overrideSlug="contact" /></ErrorBoundary>} />
              <Route path="/politica-de-confidentialitate" element={<ErrorBoundary><CmsPage overrideSlug="politica-de-confidentialitate" /></ErrorBoundary>} />
              <Route path="/termeni-si-conditii" element={<ErrorBoundary><CmsPage overrideSlug="termeni-si-conditii" /></ErrorBoundary>} />
              <Route path="/politica-de-cookies" element={<ErrorBoundary><CmsPage overrideSlug="politica-cookie" /></ErrorBoundary>} />
              <Route path="/politica-de-retur" element={<ErrorBoundary><CmsPage overrideSlug="politica-retur" /></ErrorBoundary>} />
              <Route path="/sitemap.xml" element={<SitemapXml />} />
              <Route path="/admin/*" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
              <Route path="/:slug" element={<ErrorBoundary><CmsPage /></ErrorBoundary>} />
              <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
            </Routes>
            </MaintenanceGuard>
            </ErrorBoundary>
          </CartProvider>
          </CurrencyProvider>
          </I18nProvider>
          </EditableContentProvider>

          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
