import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Fallback = () => <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const AdminProducts = lazy(() => import("./AdminProducts"));
const AdminCategories = lazy(() => import("./AdminCategories"));
const AdminDynamicCategories = lazy(() => import("./products/AdminDynamicCategories"));
const AdminOrders = lazy(() => import("./AdminOrders"));
const AdminCoupons = lazy(() => import("./AdminCoupons"));
const AdminNewsletter = lazy(() => import("./AdminNewsletter"));
const AdminReports = lazy(() => import("./AdminReports"));
const AdminStockOverview = lazy(() => import("./stock/AdminStockOverview"));
const AdminStockManager = lazy(() => import("./stock/AdminStockManager"));
const AdminStockMovements = lazy(() => import("./stock/AdminStockMovements"));
const AdminStockAlerts = lazy(() => import("./stock/AdminStockAlerts"));
const AdminInventory = lazy(() => import("./stock/AdminInventory"));
const AdminCustomers = lazy(() => import("./customers/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./customers/AdminCustomerDetail"));
const AdminCustomerGroups = lazy(() => import("./customers/AdminCustomerGroups"));
const AdminCustomerGroupDetail = lazy(() => import("./customers/AdminCustomerGroupDetail"));
const AdminCustomerSegments = lazy(() => import("./customers/AdminCustomerSegments"));
const AdminImportExport = lazy(() => import("./products/AdminImportExport"));
const AdminAuditLog = lazy(() => import("./users/AdminAuditLog"));
const AdminLoyalty = lazy(() => import("./customers/AdminLoyalty"));
const AdminSupportTickets = lazy(() => import("./customers/AdminSupportTickets"));
const AdminRolesPermissions = lazy(() => import("./users/AdminRolesPermissions"));
const AdminReturns = lazy(() => import("./orders/AdminReturns"));
const AdminInvoices = lazy(() => import("./orders/AdminInvoices"));
const AdminUsers = lazy(() => import("./users/AdminUsers"));
const AdminAppStore = lazy(() => import("./integrations/AdminAppStore"));
const AdminAutomations = lazy(() => import("./marketing/AdminAutomations"));
const AdminWebhooks = lazy(() => import("./shipping/AdminWebhooks"));
const AdminPaymentMethods = lazy(() => import("./payments/AdminPaymentMethods"));
const AdminTransactions = lazy(() => import("./payments/AdminTransactions"));
const AdminRefunds = lazy(() => import("./payments/AdminRefunds"));
const AdminCarriers = lazy(() => import("./shipping/AdminCarriers"));
const AdminShippingRates = lazy(() => import("./shipping/AdminShippingRates"));
const AdminTracking = lazy(() => import("./shipping/AdminTracking"));
const AdminMokkaSettings = lazy(() => import("./payments/AdminMokkaSettings"));
const AdminAIGenerator = lazy(() => import("./apps/AdminAIGenerator"));
const AdminGeneralSettings = lazy(() => import("./settings/AdminGeneralSettings"));
const AdminAbandonedCarts = lazy(() => import("./customers/AdminAbandonedCarts"));
const AdminBlacklist = lazy(() => import("./customers/AdminBlacklist"));
const AdminCustomScripts = lazy(() => import("./content/AdminCustomScripts"));
const AdminAffiliates = lazy(() => import("./marketing/AdminAffiliates"));
const AdminGiftCards = lazy(() => import("./marketing/AdminGiftCards"));
const AdminReferrals = lazy(() => import("./marketing/AdminReferrals"));
const AdminBrands = lazy(() => import("./products/AdminBrands"));
const AdminReviews = lazy(() => import("./products/AdminReviews"));
const AdminCmsPages = lazy(() => import("./content/AdminCmsPages"));
const AdminPromotions = lazy(() => import("./marketing/AdminPromotions"));
const AdminPricingRules = lazy(() => import("./marketing/AdminPricingRules"));
const AdminFooterBadges = lazy(() => import("./settings/AdminFooterBadges"));
const AdminFooterSettings = lazy(() => import("./settings/AdminFooterSettings"));
const AdminHomepageSettings = lazy(() => import("./content/AdminHomepageSettings"));
const AdminBanners = lazy(() => import("./marketing/AdminBanners"));
const AdminBlog = lazy(() => import("./content/AdminBlog"));
const AdminMediaLibrary = lazy(() => import("./content/AdminMediaLibrary"));
const AdminStoreSettings = lazy(() => import("./settings/AdminStoreSettings"));
const AdminCheckoutSettings = lazy(() => import("./settings/AdminCheckoutSettings"));
const AdminEmailSettings = lazy(() => import("./settings/AdminEmailSettings"));
const AdminTaxSettings = lazy(() => import("./settings/AdminTaxSettings"));
const AdminThemeEditor = lazy(() => import("./settings/AdminThemeEditor"));
const Admin2FA = lazy(() => import("./settings/Admin2FA"));
const AdminPageBuilder = lazy(() => import("./content/AdminPageBuilder"));
const AdminTranslations = lazy(() => import("./content/AdminTranslations"));
const AdminCurrencySettings = lazy(() => import("./settings/AdminCurrencySettings"));

// Smart components (batch 1)
const AdminFilteredOrders = lazy(() => import("./orders/AdminFilteredOrders"));
const AdminFilteredCustomers = lazy(() => import("./customers/AdminFilteredCustomers"));
const AdminFilteredProducts = lazy(() => import("./products/AdminFilteredProducts"));
const AdminProductAttributes = lazy(() => import("./products/AdminProductAttributes"));
const AdminBulkUpdate = lazy(() => import("./products/AdminBulkUpdate"));
const AdminProductQuestions = lazy(() => import("./products/AdminProductQuestions"));
const AdminProductSEO = lazy(() => import("./products/AdminProductSEO"));
const AdminReportPage = lazy(() => import("./reports/AdminReportPage"));
const AdminSeoSettings = lazy(() => import("./settings/AdminSeoSettings"));
const AdminNotificationSettings = lazy(() => import("./settings/AdminNotificationSettings"));
const AdminSecuritySettings = lazy(() => import("./settings/AdminSecuritySettings"));
const AdminGdprSettings = lazy(() => import("./settings/AdminGdprSettings"));
const AdminCartSettings = lazy(() => import("./settings/AdminCartSettings"));
const AdminSessions = lazy(() => import("./users/AdminSessions"));
const AdminIpWhitelist = lazy(() => import("./users/AdminIpWhitelist"));
const AdminLogs = lazy(() => import("./modules/AdminLogs"));
const AdminEmailLogs = lazy(() => import("./settings/AdminEmailLogs"));
const AdminWarehouses = lazy(() => import("./stock/AdminWarehouses"));
const AdminAWB = lazy(() => import("./shipping/AdminAWB"));
const AdminGdprData = lazy(() => import("./customers/AdminGdprData"));
const AdminCustomerImportExport = lazy(() => import("./customers/AdminCustomerImportExport"));
const AdminIntegrationConfig = lazy(() => import("./integrations/AdminIntegrationConfig"));

// Smart components (batch 2 — all remaining)
const AdminMarketplaceOrders = lazy(() => import("./orders/AdminMarketplaceOrders"));
const AdminB2BOrders = lazy(() => import("./orders/AdminB2BOrders"));
const AdminRecurringOrders = lazy(() => import("./orders/AdminRecurringOrders"));
const AdminIssueOrders = lazy(() => import("./orders/AdminIssueOrders"));
const AdminAttributeSets = lazy(() => import("./products/AdminAttributeSets"));
const AdminSpecs = lazy(() => import("./products/AdminSpecs"));
const AdminRelatedProducts = lazy(() => import("./products/AdminRelatedProducts"));
const AdminCompatibility = lazy(() => import("./products/AdminCompatibility"));
const AdminStockTransfers = lazy(() => import("./stock/AdminStockTransfers"));
const AdminStockAdjustments = lazy(() => import("./stock/AdminStockAdjustments"));
const AdminNIR = lazy(() => import("./stock/AdminNIR"));
const AdminSerials = lazy(() => import("./stock/AdminSerials"));
const AdminBatches = lazy(() => import("./stock/AdminBatches"));
const AdminExpiry = lazy(() => import("./stock/AdminExpiry"));
const AdminPicking = lazy(() => import("./stock/AdminPicking"));
const AdminSuppliers = lazy(() => import("./stock/AdminSuppliers"));
const AdminReorder = lazy(() => import("./stock/AdminReorder"));
const AdminCustomerTags = lazy(() => import("./customers/AdminCustomerTags"));
const AdminSMS = lazy(() => import("./marketing/AdminSMS"));
const AdminUpsell = lazy(() => import("./marketing/AdminUpsell"));
const AdminFeeds = lazy(() => import("./marketing/AdminFeeds"));
const AdminPixels = lazy(() => import("./marketing/AdminPixels"));
const AdminRecommendations = lazy(() => import("./marketing/AdminRecommendations"));
const AdminABTests = lazy(() => import("./marketing/AdminABTests"));
const AdminMarketingIntegrations = lazy(() => import("./marketing/AdminMarketingIntegrations"));
const AdminRetargeting = lazy(() => import("./marketing/AdminRetargeting"));
const AdminLandingPages = lazy(() => import("./content/AdminLandingPages"));
const AdminMenus = lazy(() => import("./content/AdminMenus"));
const AdminEmailTemplates = lazy(() => import("./content/AdminEmailTemplates"));
const AdminSettlements = lazy(() => import("./payments/AdminSettlements"));
const AdminReconciliation = lazy(() => import("./payments/AdminReconciliation"));
const AdminLabels = lazy(() => import("./shipping/AdminLabels"));
const AdminLockers = lazy(() => import("./shipping/AdminLockers"));
const AdminInternational = lazy(() => import("./shipping/AdminInternational"));
const AdminPickupPoints = lazy(() => import("./shipping/AdminPickupPoints"));
const AdminScheduling = lazy(() => import("./shipping/AdminScheduling"));
const AdminAPI = lazy(() => import("./channels/AdminAPI"));
const AdminConnectors = lazy(() => import("./channels/AdminConnectors"));
const AdminCustomReport = lazy(() => import("./reports/AdminCustomReport"));
const AdminExportReports = lazy(() => import("./reports/AdminExportReports"));
const AdminFinancialReports = lazy(() => import("./reports/AdminFinancialReports"));
const AdminSSL = lazy(() => import("./integrations/AdminSSL"));
const AdminERPIntegrations = lazy(() => import("./integrations/AdminERPIntegrations"));
const AdminOrderStatuses = lazy(() => import("./orders/AdminOrderStatuses"));
const AdminReturnSettings = lazy(() => import("./settings/AdminReturnSettings"));
const AdminInvoiceSettings = lazy(() => import("./settings/AdminInvoiceSettings"));
const AdminSmartBillSettings = lazy(() => import("./settings/AdminSmartBillSettings"));
const AdminPerformance = lazy(() => import("./settings/AdminPerformance"));
const AdminBackInStock = lazy(() => import("./marketing/AdminBackInStock"));
const AdminBundles = lazy(() => import("./marketing/AdminBundles"));
const AdminBundleList = lazy(() => import("./products/AdminBundleList"));
const AdminBundleSettings = lazy(() => import("./settings/AdminBundleSettings"));
const AdminPriceLists = lazy(() => import("./stock/AdminPriceLists"));
const AdminPriceListSettings = lazy(() => import("./settings/AdminPriceListSettings"));
const AdminProductLines = lazy(() => import("./products/AdminProductLines"));
const AdminProductLineSettings = lazy(() => import("./settings/AdminProductLineSettings"));
const AdminCustomizationFields = lazy(() => import("./products/AdminCustomizationFields"));
const AdminCustomizationSettings = lazy(() => import("./settings/AdminCustomizationSettings"));
const AdminPriceAlerts = lazy(() => import("./marketing/AdminPriceAlerts"));
const AdminSocialProofSettings = lazy(() => import("./marketing/AdminSocialProofSettings"));
const AdminLiveChatSettings = lazy(() => import("./marketing/AdminLiveChatSettings"));
const AdminSubscriptionBoxes = lazy(() => import("./marketing/AdminSubscriptionBoxes"));
const AdminPOSSettings = lazy(() => import("./settings/AdminPOSSettings"));
const AdminDropshippingSettings = lazy(() => import("./settings/AdminDropshippingSettings"));
const AdminMultiStoreSettings = lazy(() => import("./settings/AdminMultiStoreSettings"));
const AdminCustomerPortalSettings = lazy(() => import("./settings/AdminCustomerPortalSettings"));
const AdminTrafficAnalytics = lazy(() => import("./reports/AdminTrafficAnalytics"));
const AdminCartbot = lazy(() => import("./marketing/AdminCartbot"));
const AdminCuiValidation = lazy(() => import("./settings/AdminCuiValidation"));
const AdminAIGeneratorHub = lazy(() => import("./ai/AdminAIGeneratorHub"));
const AdminAIGeneratorSettings = lazy(() => import("./ai/AdminAIGeneratorSettings"));
const AdminAIPendingApprovals = lazy(() => import("./ai/AdminAIPendingApprovals"));
const AdminAIBulkJobs = lazy(() => import("./ai/AdminAIBulkJobs"));
const AdminAIUsageStats = lazy(() => import("./ai/AdminAIUsageStats"));

export default function AdminRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route index element={<AdminDashboard />} />

        {/* ═══════════ COMENZI ═══════════ */}
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/new" element={<AdminFilteredOrders status="new" title="Comenzi Noi" description="Comenzi noi care necesită procesare și confirmare." />} />
        <Route path="orders/processing" element={<AdminFilteredOrders status="processing" title="În Procesare" description="Comenzi confirmate, pregătite pentru ambalare." />} />
        <Route path="orders/shipping" element={<AdminFilteredOrders status="shipping" title="În Livrare" description="Comenzi cu AWB generat, predate curierului." />} />
        <Route path="orders/delivered" element={<AdminFilteredOrders status="delivered" title="Livrate" description="Comenzi finalizate cu succes." />} />
        <Route path="orders/cancelled" element={<AdminFilteredOrders status="cancelled" title="Anulate" description="Comenzi anulate." />} />
        <Route path="orders/marketplace" element={<AdminMarketplaceOrders />} />
        <Route path="orders/b2b" element={<AdminB2BOrders />} />
        <Route path="orders/recurring" element={<AdminRecurringOrders />} />
        <Route path="orders/issues" element={<AdminIssueOrders />} />
        <Route path="orders/invoices" element={<AdminInvoices />} />
        <Route path="orders/returns" element={<AdminReturns />} />
        <Route path="orders/statuses" element={<AdminOrderStatuses />} />

        {/* ═══════════ PRODUSE ═══════════ */}
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="categories/smart" element={<AdminDynamicCategories />} />
        <Route path="products/brands" element={<AdminBrands />} />
        <Route path="products/attributes" element={<AdminProductAttributes />} />
        <Route path="products/attribute-sets" element={<AdminAttributeSets />} />
        <Route path="products/specs" element={<AdminSpecs />} />
        <Route path="products/promo" element={<AdminFilteredProducts filter="promo" title="Produse în Promoție" description="Toate produsele cu discount activ." />} />
        <Route path="products/no-image" element={<AdminFilteredProducts filter="no-image" title="Produse Fără Imagine" description="Control calitate: produse fără imagine." />} />
        <Route path="products/no-description" element={<AdminFilteredProducts filter="no-description" title="Produse Fără Descriere" description="Control calitate: produse fără descriere." />} />
        <Route path="products/reviews" element={<AdminReviews />} />
        <Route path="products/questions" element={<AdminProductQuestions />} />
        <Route path="products/related" element={<AdminRelatedProducts />} />
        <Route path="products/compatibility" element={<AdminCompatibility />} />
        <Route path="products/import-export" element={<AdminImportExport />} />
        <Route path="products/bulk-update" element={<AdminBulkUpdate />} />
        <Route path="products/seo" element={<AdminProductSEO />} />
        <Route path="products/bundles" element={<AdminBundleList />} />
        <Route path="products/lines" element={<AdminProductLines />} />

        {/* ═══════════ STOC & DEPOZIT ═══════════ */}
        <Route path="stock" element={<AdminStockOverview />} />
        <Route path="stock/manager" element={<AdminStockManager />} />
        <Route path="stock/warehouses" element={<AdminWarehouses />} />
        <Route path="stock/transfers" element={<AdminStockTransfers />} />
        <Route path="stock/movements" element={<AdminStockMovements />} />
        <Route path="stock/adjustments" element={<AdminStockAdjustments />} />
        <Route path="stock/inventory" element={<AdminInventory />} />
        <Route path="stock/nir" element={<AdminNIR />} />
        <Route path="stock/serials" element={<AdminSerials />} />
        <Route path="stock/batches" element={<AdminBatches />} />
        <Route path="stock/expiry" element={<AdminExpiry />} />
        <Route path="stock/picking" element={<AdminPicking />} />
        <Route path="stock/alerts" element={<AdminStockAlerts />} />
        <Route path="stock/suppliers" element={<AdminSuppliers />} />
        <Route path="stock/reorder" element={<AdminReorder />} />
        <Route path="stock/price-lists" element={<AdminPriceLists />} />

        {/* ═══════════ CLIENȚI / CRM ═══════════ */}
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/detail/:userId" element={<AdminCustomerDetail />} />
        <Route path="customers/new" element={<AdminFilteredCustomers filter="new" title="Clienți Noi" description="Clienți înregistrați în ultima lună." />} />
        <Route path="customers/active" element={<AdminFilteredCustomers filter="active" title="Clienți Activi" description="Clienți cu activitate recentă." />} />
        <Route path="customers/inactive" element={<AdminFilteredCustomers filter="inactive" title="Clienți Inactivi" description="Clienți fără comenzi recente." />} />
        <Route path="customers/vip" element={<AdminFilteredCustomers filter="vip" title="Clienți VIP" description="Top clienți după valoare." />} />
        <Route path="customers/b2b" element={<AdminFilteredCustomers filter="b2b" title="Clienți B2B" description="Persoane juridice." />} />
        <Route path="customers/groups" element={<AdminCustomerGroups />} />
        <Route path="customers/groups/:groupId" element={<AdminCustomerGroupDetail />} />
        <Route path="customers/segments" element={<AdminCustomerSegments />} />
        <Route path="customers/tags" element={<AdminCustomerTags />} />
        <Route path="customers/loyalty" element={<AdminLoyalty />} />
        <Route path="customers/blacklist" element={<AdminBlacklist />} />
        <Route path="customers/abandoned" element={<AdminAbandonedCarts />} />
        <Route path="customers/tickets" element={<AdminSupportTickets />} />
        <Route path="customers/gdpr" element={<AdminGdprData />} />
        <Route path="customers/import" element={<AdminCustomerImportExport mode="import" />} />
        <Route path="customers/export" element={<AdminCustomerImportExport mode="export" />} />

        {/* ═══════════ MARKETING ═══════════ */}
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="marketing/promotions" element={<AdminPromotions />} />
        <Route path="marketing/pricing-rules" element={<AdminPricingRules />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="marketing/sms" element={<AdminSMS />} />
        {/* abandoned-cart route removed — canonical route is customers/abandoned */}
        <Route path="marketing/automations" element={<AdminAutomations />} />
        <Route path="marketing/banners" element={<AdminBanners />} />
        <Route path="marketing/upsell" element={<AdminUpsell />} />
        <Route path="marketing/feeds" element={<AdminFeeds />} />
        <Route path="marketing/pixels" element={<AdminPixels />} />
        <Route path="marketing/affiliates" element={<AdminAffiliates />} />
        <Route path="marketing/gift-cards" element={<AdminGiftCards />} />
        <Route path="marketing/referrals" element={<AdminReferrals />} />
        <Route path="marketing/recommendations" element={<AdminRecommendations />} />
        <Route path="marketing/ab-tests" element={<AdminABTests />} />
        <Route path="marketing/reports" element={<AdminReportPage type="marketing" title="Rapoarte Marketing" description="Conversie campanii, utilizare vouchere, ROI per canal." />} />
        <Route path="marketing/back-in-stock" element={<AdminBackInStock />} />
        <Route path="marketing/bundles" element={<AdminBundles />} />
        <Route path="marketing/price-alerts" element={<AdminPriceAlerts />} />
        <Route path="marketing/social-proof" element={<AdminSocialProofSettings />} />
        <Route path="marketing/live-chat" element={<AdminLiveChatSettings />} />
        <Route path="marketing/subscription-boxes" element={<AdminSubscriptionBoxes />} />
        <Route path="marketing/integrations" element={<AdminMarketingIntegrations />} />
        <Route path="marketing/cartbot" element={<AdminCartbot />} />
        <Route path="marketing/retargeting" element={<AdminRetargeting />} />

        {/* ═══════════ CONȚINUT ═══════════ */}
        <Route path="content/pages" element={<AdminCmsPages />} />
        <Route path="content/page-builder" element={<AdminPageBuilder />} />
        <Route path="content/homepage" element={<AdminHomepageSettings />} />
        <Route path="content/landing" element={<AdminLandingPages />} />
        <Route path="content/blog" element={<AdminBlog />} />
        <Route path="content/media" element={<AdminMediaLibrary />} />
        <Route path="content/menus" element={<AdminMenus />} />
        <Route path="content/scripts" element={<AdminCustomScripts />} />
        <Route path="content/translations" element={<AdminTranslations />} />
        <Route path="content/email-templates" element={<AdminEmailTemplates />} />
        <Route path="content/seo" element={<AdminSeoSettings />} />
        <Route path="content/legal" element={<AdminCmsPages filterLegal />} />

        {/* ═══════════ PLĂȚI ═══════════ */}
        <Route path="payments/methods" element={<AdminPaymentMethods />} />
        <Route path="payments/transactions" element={<AdminTransactions />} />
        <Route path="payments/refunds" element={<AdminRefunds />} />
        <Route path="payments/installments" element={<AdminMokkaSettings />} />
        <Route path="payments/mokka" element={<AdminMokkaSettings />} />
        <Route path="payments/settlements" element={<AdminSettlements />} />
        <Route path="payments/reconciliation" element={<AdminReconciliation />} />

        {/* ═══════════ LIVRARE ═══════════ */}
        <Route path="shipping/carriers" element={<AdminCarriers />} />
        <Route path="shipping/rates" element={<AdminShippingRates />} />
        <Route path="shipping/awb" element={<AdminAWB />} />
        <Route path="shipping/labels" element={<AdminLabels />} />
        <Route path="shipping/tracking" element={<AdminTracking />} />
        <Route path="shipping/lockers" element={<AdminLockers />} />
        <Route path="shipping/international" element={<AdminInternational />} />
        <Route path="shipping/pickup" element={<AdminPickupPoints />} />
        <Route path="shipping/scheduling" element={<AdminScheduling />} />
        <Route path="shipping/webhooks" element={<AdminWebhooks />} />

        {/* ═══════════ INTEGRĂRI ═══════════ */}
        <Route path="integrations" element={<AdminAppStore />} />
        <Route path="integrations/app-store" element={<AdminAppStore />} />
        <Route path="integrations/stripe" element={<AdminIntegrationConfig integrationKey="stripe" title="Stripe" description="Configurare Stripe pentru plăți cu cardul." fields={[{ key: "publishable_key", label: "Publishable Key" }, { key: "secret_key", label: "Secret Key", type: "password" }, { key: "webhook_secret", label: "Webhook Secret", type: "password" }]} />} />
        <Route path="integrations/paypal" element={<AdminIntegrationConfig integrationKey="paypal" title="PayPal" description="Configurare PayPal." fields={[{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", type: "password" }, { key: "mode", label: "Mod (sandbox/live)" }]} />} />
        <Route path="integrations/netopia" element={<AdminIntegrationConfig integrationKey="netopia" title="Netopia Payments" description="Configurare Netopia." fields={[{ key: "signature", label: "Signature" }, { key: "public_key", label: "Public Key" }, { key: "private_key", label: "Private Key", type: "password" }]} />} />
        <Route path="integrations/euplatesc" element={<AdminIntegrationConfig integrationKey="euplatesc" title="euPlătesc" description="Configurare euPlătesc." fields={[{ key: "mid", label: "MID" }, { key: "key", label: "Cheie secretă", type: "password" }]} />} />
        <Route path="integrations/plati-online" element={<AdminIntegrationConfig integrationKey="plati-online" title="Plăți Online" description="Configurare plăți-online.ro." fields={[{ key: "api_key", label: "API Key", type: "password" }, { key: "ipn_url", label: "IPN URL", type: "url" }]} />} />
        <Route path="integrations/tbi-bank" element={<AdminIntegrationConfig integrationKey="tbi-bank" title="TBI Bank" description="Configurare TBI Bank rate." fields={[{ key: "merchant_id", label: "Merchant ID" }, { key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/paypo" element={<AdminIntegrationConfig integrationKey="paypo" title="PayPo" description="Configurare PayPo." fields={[{ key: "api_key", label: "API Key", type: "password" }, { key: "mode", label: "Mod (test/live)" }]} />} />
        <Route path="integrations/leanpay" element={<AdminIntegrationConfig integrationKey="leanpay" title="LeanPay" description="Configurare LeanPay." fields={[{ key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/banca-transilvania" element={<AdminIntegrationConfig integrationKey="banca-transilvania" title="Banca Transilvania" description="Configurare BT Pay." fields={[{ key: "terminal_id", label: "Terminal ID" }, { key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/smartbuybt" element={<AdminIntegrationConfig integrationKey="smartbuybt" title="SmartBuyBT" description="Configurare SmartBuyBT rate." fields={[{ key: "merchant_id", label: "Merchant ID" }, { key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/epay" element={<AdminIntegrationConfig integrationKey="epay" title="ePay" description="Configurare ePay." fields={[{ key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/revolut" element={<AdminIntegrationConfig integrationKey="revolut" title="Revolut" description="Configurare Revolut Business." fields={[{ key: "api_key", label: "API Key", type: "password" }, { key: "mode", label: "Mod (sandbox/live)" }]} />} />
        <Route path="integrations/fan-courier" element={<AdminIntegrationConfig integrationKey="fan-courier" title="Fan Courier" description="Configurare Fan Courier." fields={[{ key: "username", label: "Utilizator API" }, { key: "password", label: "Parolă", type: "password" }, { key: "client_id", label: "Client ID" }]} />} />
        <Route path="integrations/sameday" element={<AdminIntegrationConfig integrationKey="sameday" title="Sameday" description="Configurare Sameday & Easybox." fields={[{ key: "username", label: "Utilizator" }, { key: "password", label: "Parolă", type: "password" }, { key: "mode", label: "Mod (demo/prod)" }]} />} />
        <Route path="integrations/gls" element={<AdminIntegrationConfig integrationKey="gls" title="GLS" description="Configurare GLS." fields={[{ key: "client_number", label: "Nr. Client" }, { key: "username", label: "Utilizator" }, { key: "password", label: "Parolă", type: "password" }]} />} />
        <Route path="integrations/cargus" element={<AdminIntegrationConfig integrationKey="cargus" title="Cargus" description="Configurare Cargus." fields={[{ key: "api_key", label: "API Key", type: "password" }, { key: "subscription_key", label: "Subscription Key" }]} />} />
        <Route path="integrations/dpd" element={<AdminIntegrationConfig integrationKey="dpd" title="DPD" description="Configurare DPD." fields={[{ key: "username", label: "Utilizator API" }, { key: "password", label: "Parolă", type: "password" }]} />} />
        <Route path="integrations/dhl" element={<AdminIntegrationConfig integrationKey="dhl" title="DHL" description="Configurare DHL Express." fields={[{ key: "site_id", label: "Site ID" }, { key: "password", label: "Parolă", type: "password" }, { key: "account_number", label: "Nr. Cont" }]} />} />
        <Route path="integrations/smartbill" element={<AdminIntegrationConfig integrationKey="smartbill" title="SmartBill" description="Configurare SmartBill facturare." fields={[{ key: "email", label: "Email cont SmartBill" }, { key: "token", label: "API Token", type: "password" }, { key: "cif", label: "CIF companie" }, { key: "series", label: "Serie facturi" }]} />} />
        <Route path="integrations/facebook-pixel" element={<AdminIntegrationConfig integrationKey="facebook-pixel" title="Facebook Pixel" description="Configurare Meta Pixel." fields={[{ key: "pixel_id", label: "Pixel ID" }, { key: "access_token", label: "Access Token (CAPI)", type: "password" }]} />} />
        <Route path="integrations/tiktok-pixel" element={<AdminIntegrationConfig integrationKey="tiktok-pixel" title="TikTok Pixel" description="Configurare TikTok Pixel." fields={[{ key: "pixel_id", label: "Pixel ID" }]} />} />
        <Route path="integrations/google-ads" element={<AdminIntegrationConfig integrationKey="google-ads" title="Google Ads" description="Configurare Google Ads conversion tracking." fields={[{ key: "conversion_id", label: "Conversion ID" }, { key: "conversion_label", label: "Conversion Label" }]} />} />
        <Route path="integrations/google-analytics" element={<AdminIntegrationConfig integrationKey="google-analytics" title="Google Analytics" description="Configurare GA4." fields={[{ key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" }]} />} />
        <Route path="integrations/gtm" element={<AdminIntegrationConfig integrationKey="gtm" title="Google Tag Manager" description="Configurare GTM." fields={[{ key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" }]} />} />
        <Route path="integrations/mailchimp" element={<AdminIntegrationConfig integrationKey="mailchimp" title="Mailchimp" description="Configurare Mailchimp." fields={[{ key: "api_key", label: "API Key", type: "password" }, { key: "list_id", label: "List ID" }]} />} />
        <Route path="integrations/emag" element={<AdminIntegrationConfig integrationKey="emag" title="eMAG Marketplace" description="Sincronizare produse și comenzi eMAG." fields={[{ key: "username", label: "Utilizator API" }, { key: "password", label: "Parolă", type: "password" }, { key: "partner_id", label: "Partner ID" }]} />} />
        <Route path="integrations/google-shopping" element={<AdminIntegrationConfig integrationKey="google-shopping" title="Google Shopping" description="Feed produse Google Merchant Center." fields={[{ key: "merchant_id", label: "Merchant Center ID" }]} />} />
        <Route path="integrations/facebook-shop" element={<AdminIntegrationConfig integrationKey="facebook-shop" title="Facebook Shop" description="Sincronizare catalog Facebook & Instagram." fields={[{ key: "catalog_id", label: "Catalog ID" }, { key: "access_token", label: "Access Token", type: "password" }]} />} />
        <Route path="integrations/compariro" element={<AdminIntegrationConfig integrationKey="compariro" title="Compari.ro" description="Feed produse Compari.ro." fields={[{ key: "feed_id", label: "Feed ID" }]} />} />
        <Route path="integrations/pricero" element={<AdminIntegrationConfig integrationKey="pricero" title="Price.ro" description="Feed automat XML Price.ro." fields={[{ key: "shop_id", label: "Shop ID" }]} />} />
        <Route path="integrations/facebook-login" element={<AdminIntegrationConfig integrationKey="facebook-login" title="Facebook Login" description="Configurare Facebook Login." fields={[{ key: "app_id", label: "App ID" }, { key: "app_secret", label: "App Secret", type: "password" }]} />} />
        <Route path="integrations/google-login" element={<AdminIntegrationConfig integrationKey="google-login" title="Google Login" description="Configurare Google Login." fields={[{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", type: "password" }]} />} />
        <Route path="integrations/nod" element={<AdminIntegrationConfig integrationKey="nod" title="NOD" description="Integrare NOD catalog și stoc." fields={[{ key: "username", label: "Utilizator API" }, { key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="integrations/ssl" element={<AdminSSL />} />
        <Route path="integrations/erp" element={<AdminERPIntegrations />} />

        {/* ═══════════ MULTI-CANAL ═══════════ */}
        <Route path="channels/allegro" element={<AdminIntegrationConfig integrationKey="allegro" title="Allegro" description="Sincronizare produse și comenzi Allegro." fields={[{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", type: "password" }]} />} />
        <Route path="channels/olx" element={<AdminIntegrationConfig integrationKey="olx" title="OLX" description="Publicare anunțuri pe OLX." fields={[{ key: "api_key", label: "API Key", type: "password" }]} />} />
        <Route path="channels/api" element={<AdminAPI />} />
        <Route path="channels/connectors" element={<AdminConnectors />} />

        {/* ═══════════ RAPOARTE ═══════════ */}
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/profit" element={<AdminReportPage type="profit" title="Profit & Costuri" description="Analiză marjă de profit, costuri transport." />} />
        <Route path="reports/top-products" element={<AdminReportPage type="top-products" title="Produse Top" description="Clasament produse după vânzări și profit." />} />
        <Route path="reports/slow-movers" element={<AdminReportPage type="slow-movers" title="Produse Lente" description="Produse cu vânzări reduse (dead stock)." />} />
        <Route path="reports/customers" element={<AdminReportPage type="customers" title="Rapoarte Clienți" description="Clienți noi vs recurenți, LTV, retenție." />} />
        <Route path="reports/inventory" element={<AdminReportPage type="inventory" title="Stoc & Rotație" description="Rotație stoc, valoare stoc, dead stock." />} />
        <Route path="reports/conversion" element={<AdminReportPage type="conversion" title="Conversie / Funnel" description="Vizualizare funnel: vizite → coș → comandă." />} />
        <Route path="reports/marketing" element={<AdminReportPage type="marketing" title="Marketing ROI" description="Analiză eficiență campanii per canal." />} />
        <Route path="reports/financial" element={<AdminFinancialReports />} />
        <Route path="reports/custom" element={<AdminCustomReport />} />
        <Route path="reports/export" element={<AdminExportReports />} />
        <Route path="reports/traffic" element={<AdminTrafficAnalytics />} />

        {/* ═══════════ SETĂRI ═══════════ */}
        <Route path="settings/general" element={<AdminGeneralSettings />} />
        <Route path="settings/theme" element={<AdminThemeEditor />} />
        <Route path="settings/footer-badges" element={<AdminFooterBadges />} />
        <Route path="settings/footer" element={<AdminFooterSettings />} />
        <Route path="settings/taxes" element={<AdminTaxSettings />} />
        <Route path="settings/store" element={<AdminStoreSettings />} />
        <Route path="settings/email" element={<AdminEmailSettings />} />
        <Route path="settings/email-logs" element={<AdminEmailLogs />} />
        <Route path="settings/seo" element={<AdminSeoSettings />} />
        <Route path="settings/notifications" element={<AdminNotificationSettings />} />
        <Route path="settings/security" element={<AdminSecuritySettings />} />
        <Route path="settings/gdpr" element={<AdminGdprSettings />} />
        <Route path="settings/currency" element={<AdminCurrencySettings />} />
        <Route path="settings/checkout" element={<AdminCheckoutSettings />} />
        <Route path="settings/cart" element={<AdminCartSettings />} />
        <Route path="settings/returns" element={<AdminReturnSettings />} />
        <Route path="settings/invoices" element={<AdminInvoiceSettings />} />
        <Route path="settings/smartbill" element={<AdminSmartBillSettings />} />
        <Route path="settings/performance" element={<AdminPerformance />} />
        <Route path="settings/pos" element={<AdminPOSSettings />} />
        <Route path="settings/dropshipping" element={<AdminDropshippingSettings />} />
        <Route path="settings/multi-store" element={<AdminMultiStoreSettings />} />
        <Route path="settings/customer-portal" element={<AdminCustomerPortalSettings />} />
        <Route path="settings/cui-validation" element={<AdminCuiValidation />} />
        <Route path="settings/bundles" element={<AdminBundleSettings />} />
        <Route path="settings/price-lists" element={<AdminPriceListSettings />} />
        <Route path="settings/product-lines" element={<AdminProductLineSettings />} />

        {/* ═══════════ UTILIZATORI ═══════════ */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/roles" element={<AdminRolesPermissions />} />
        <Route path="users/sessions" element={<AdminSessions />} />
        <Route path="users/2fa" element={<Admin2FA />} />
        <Route path="users/ip-whitelist" element={<AdminIpWhitelist />} />
        <Route path="users/audit" element={<AdminAuditLog />} />

        {/* ═══════════ APLICAȚII ═══════════ */}
        <Route path="modules/ai-generator" element={<AdminAIGeneratorHub />} />
        <Route path="modules/ai-generator/settings" element={<AdminAIGeneratorSettings />} />
        <Route path="modules/ai-generator/approvals" element={<AdminAIPendingApprovals />} />
        <Route path="modules/ai-generator/bulk" element={<AdminAIBulkJobs />} />
        <Route path="modules/ai-generator/usage" element={<AdminAIUsageStats />} />
        <Route path="modules/logs" element={<AdminLogs />} />
      </Routes>
    </Suspense>
  );
}
