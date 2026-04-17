import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import { EditableContentProvider } from "@/hooks/useEditableContent";
import { SettingsProvider } from "@/hooks/useSettings";
import { CartProvider } from "@/hooks/useCart";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { I18nProvider } from "@/hooks/useI18n";
import CustomScriptInjector from "./components/CustomScriptInjector";
import ErrorBoundary from "./components/ErrorBoundary";
import MaintenanceGuard from "./components/MaintenanceGuard";
import { useAffiliateTracking } from "./hooks/useAffiliateTracking";
import { initTracking, trackPageView } from "./hooks/useMarketingTracking";
import { useLocation } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Returns = lazy(() => import("./pages/Returns"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CmsPage = lazy(() => import("./pages/CmsPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Install = lazy(() => import("./pages/Install"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Affiliates = lazy(() => import("./pages/Affiliates"));
const RecoverCart = lazy(() => import("./pages/RecoverCart"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Personalizare = lazy(() => import("./pages/Personalizare"));
const Contact = lazy(() => import("./pages/Contact"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const CorporateGifting = lazy(() => import("./pages/CorporateGifting"));
const QuizParfum = lazy(() => import("./pages/QuizParfum"));
const IngrijireLumanari = lazy(() => import("./pages/IngrijireLumanari"));
const Recenzii = lazy(() => import("./pages/Recenzii"));
const Tracking = lazy(() => import("./pages/Tracking"));
const LivrareInternationala = lazy(() => import("./pages/LivrareInternationala"));
const ComenziEvenimente = lazy(() => import("./pages/ComenziEvenimente"));
const Oferte = lazy(() => import("./pages/Oferte"));
const DeIncredere = lazy(() => import("./pages/DeIncredere"));
const NouLansari = lazy(() => import("./pages/NouLansari"));
const TransparencyDashboard = lazy(() => import("./pages/TransparencyDashboard"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const SeoLanding = lazy(() => import("./pages/SeoLanding"));
const SeoHub = lazy(() => import("./pages/SeoHub"));
const SeasonalCollections = lazy(() => import("./pages/SeasonalCollections"));
const VirtualTryOn = lazy(() => import("./pages/VirtualTryOn"));
const SitemapXml = lazy(() => import("./pages/SitemapXml"));
const PostDelivery = lazy(() => import("./pages/PostDelivery"));
const LumanarLunii = lazy(() => import("./pages/LumanarLunii"));

const queryClient = new QueryClient();

const AffiliateTracker = () => {
  useAffiliateTracking();
  return null;
};

const TrackingInit = () => {
  const location = useLocation();
  useEffect(() => {
    initTracking();
  }, []);
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
  return null;
};

const routeFallback = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#0A0A0F",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(139,26,26,0.3)",
        borderTopColor: "#8B1A1A",
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
        <AuthProvider>
          <EditableContentProvider>
            <SettingsProvider>
              <I18nProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <CustomScriptInjector />
                    <AffiliateTracker />
                    <TrackingInit />
                    <ErrorBoundary>
                      <MaintenanceGuard>
                        <Suspense fallback={routeFallback}>
                          <Routes>
                            <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                            <Route path="/catalog" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/lichidare-stoc" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/ultimele-bucati" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/transport-gratuit" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/oferte-speciale" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/editie-limitata" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                            <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                            <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                            <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
                            <Route path="/checkout/recover" element={<ErrorBoundary><RecoverCart /></ErrorBoundary>} />
                            <Route path="/order-confirmation/:orderId" element={<ErrorBoundary><OrderConfirmation /></ErrorBoundary>} />
                            <Route path="/payment-failed" element={<ErrorBoundary><PaymentFailed /></ErrorBoundary>} />
                            <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                            <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
                            <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
                            <Route path="/account" element={<ErrorBoundary><Account /></ErrorBoundary>} />
                            <Route path="/favorites" element={<ErrorBoundary><Favorites /></ErrorBoundary>} />
                            <Route path="/retururi" element={<ErrorBoundary><Returns /></ErrorBoundary>} />
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
                            <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
                            <Route path="/politica-de-confidentialitate" element={<ErrorBoundary><CmsPage overrideSlug="politica-de-confidentialitate" /></ErrorBoundary>} />
                            <Route path="/termeni-si-conditii" element={<ErrorBoundary><CmsPage overrideSlug="termeni-conditii" /></ErrorBoundary>} />
                            <Route path="/termeni-conditii" element={<ErrorBoundary><CmsPage overrideSlug="termeni-conditii" /></ErrorBoundary>} />
                            <Route path="/politica-de-cookies" element={<ErrorBoundary><CmsPage overrideSlug="politica-cookie" /></ErrorBoundary>} />
                            <Route path="/politica-de-retur" element={<ErrorBoundary><CmsPage overrideSlug="politica-retur" /></ErrorBoundary>} />
                            <Route path="/lp/:slug" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
                            <Route path="/lumanarea-lunii" element={<ErrorBoundary><LumanarLunii /></ErrorBoundary>} />
                            <Route path="/sitemap.xml" element={<SitemapXml />} />
                            <Route path="/admin/*" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
                            <Route path="/:slug" element={<ErrorBoundary><CmsPage /></ErrorBoundary>} />
                            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
                          </Routes>
                        </Suspense>
                      </MaintenanceGuard>
                    </ErrorBoundary>
                  </CartProvider>
                </CurrencyProvider>
              </I18nProvider>
            </SettingsProvider>
          </EditableContentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
