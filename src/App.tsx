import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SettingsProvider } from "@/hooks/useSettings";
import { ThemeTextProvider } from "@/hooks/useThemeText";
import { CartProvider } from "@/hooks/useCart";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { CompareProvider } from "@/hooks/useCompare";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import RedirectHandler from "./components/RedirectHandler";
import SitemapRedirect from "./components/SitemapRedirect";

const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Search = lazy(() => import("./pages/Search"));
const Compare = lazy(() => import("./pages/Compare"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AccountHome = lazy(() => import("./pages/account/AccountHome"));
const AccountWallet = lazy(() => import("./pages/account/Wallet"));
const AccountOrders = lazy(() => import("./pages/account/Orders"));
const AccountFavorites = lazy(() => import("./pages/account/Favorites"));
const AccountAddresses = lazy(() => import("./pages/account/Addresses"));
const AccountSettings = lazy(() => import("./pages/account/Settings"));
const Contact = lazy(() => import("./pages/Contact"));
const CmsPage = lazy(() => import("./pages/CmsPage"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));

const queryClient = new QueryClient();

const routeFallback = (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8F5EF" }}>
    <div style={{ width: 40, height: 40, border: "3px solid rgba(184,147,90,0.2)", borderTopColor: "#B8935A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <RedirectHandler />
        <AuthProvider>
          <SettingsProvider>
            <ThemeTextProvider>
            <CartProvider>
              <FavoritesProvider>
                <CompareProvider>
                <ErrorBoundary>
                  <Suspense fallback={routeFallback}>
                    <Routes>
                      <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                      <Route path="/catalog" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                      <Route path="/categorie/:slug" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
                      <Route path="/produs/:slug" element={<ErrorBoundary><Product /></ErrorBoundary>} />
                      <Route path="/cos" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                      <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
                      <Route path="/cautare" element={<ErrorBoundary><Search /></ErrorBoundary>} />
                      <Route path="/compara" element={<ErrorBoundary><Compare /></ErrorBoundary>} />
                      <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                      <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
                      <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
                      <Route path="/admin/*" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
                      <Route path="/account" element={<ErrorBoundary><AccountHome /></ErrorBoundary>} />
                      <Route path="/account/orders" element={<ErrorBoundary><AccountOrders /></ErrorBoundary>} />
                      <Route path="/account/wallet" element={<ErrorBoundary><AccountWallet /></ErrorBoundary>} />
                      <Route path="/account/addresses" element={<ErrorBoundary><AccountAddresses /></ErrorBoundary>} />
                      <Route path="/account/favorites" element={<ErrorBoundary><AccountFavorites /></ErrorBoundary>} />
                      <Route path="/account/settings" element={<ErrorBoundary><AccountSettings /></ErrorBoundary>} />
                      <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
                      <Route path="/page/:slug" element={<ErrorBoundary><CmsPage /></ErrorBoundary>} />
                      <Route path="/track" element={<ErrorBoundary><TrackOrder /></ErrorBoundary>} />
                      <Route path="/sitemap.xml" element={<SitemapRedirect />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                </CompareProvider>
              </FavoritesProvider>
            </CartProvider>
            </ThemeTextProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
