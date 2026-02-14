import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminOrders from "./AdminOrders";
import AdminCoupons from "./AdminCoupons";
import AdminNewsletter from "./AdminNewsletter";
import AdminReports from "./AdminReports";
import AdminPlaceholder from "./AdminPlaceholder";
import AdminStockOverview from "./stock/AdminStockOverview";
import AdminStockMovements from "./stock/AdminStockMovements";
import AdminStockAlerts from "./stock/AdminStockAlerts";
import AdminInventory from "./stock/AdminInventory";
import AdminCustomers from "./customers/AdminCustomers";
import AdminCustomerGroups from "./customers/AdminCustomerGroups";
import AdminCustomerSegments from "./customers/AdminCustomerSegments";
import AdminImportExport from "./products/AdminImportExport";
import AdminAuditLog from "./users/AdminAuditLog";
import AdminLoyalty from "./customers/AdminLoyalty";
import AdminSupportTickets from "./customers/AdminSupportTickets";
import AdminRolesPermissions from "./users/AdminRolesPermissions";
import AdminReturns from "./orders/AdminReturns";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />

      {/* Comenzi */}
      <Route path="orders" element={<AdminOrders />} />
      <Route path="orders/invoices" element={<AdminPlaceholder title="Facturi & Documente" description="Gestionare facturi, avize și documente fiscale pentru comenzi." />} />
      <Route path="orders/returns" element={<AdminReturns />} />
      <Route path="orders/abandoned" element={<AdminPlaceholder title="Coșuri Abandonate" description="Vizualizare și recuperare coșuri abandonate prin email automat." />} />

      {/* Produse */}
      <Route path="products" element={<AdminProducts />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="products/brands" element={<AdminPlaceholder title="Mărci" description="Gestionare mărci/brand-uri și asociere cu produse." />} />
      <Route path="products/attributes" element={<AdminPlaceholder title="Atribute & Variante" description="Definire atribute (culoare, mărime, capacitate) și variante de produs." />} />
      <Route path="products/reviews" element={<AdminPlaceholder title="Review-uri Produse" description="Moderare și gestionare review-uri clienți." />} />
      <Route path="products/import-export" element={<AdminImportExport />} />
      <Route path="products/seo" element={<AdminPlaceholder title="SEO Produse" description="Optimizare meta titluri, descrieri și schema markup pentru produse." />} />

      {/* Stoc & Depozit */}
      <Route path="stock" element={<AdminStockOverview />} />
      <Route path="stock/movements" element={<AdminStockMovements />} />
      <Route path="stock/alerts" element={<AdminStockAlerts />} />
      <Route path="stock/inventory" element={<AdminInventory />} />

      {/* Clienți / CRM */}
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="customers/groups" element={<AdminCustomerGroups />} />
      <Route path="customers/loyalty" element={<AdminLoyalty />} />
      <Route path="customers/tickets" element={<AdminSupportTickets />} />
      <Route path="customers/segments" element={<AdminCustomerSegments />} />

      {/* Marketing */}
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="marketing/promotions" element={<AdminPlaceholder title="Promoții" description="Promoții în coș: cadouri, transport gratuit, reduceri automate." />} />
      <Route path="newsletter" element={<AdminNewsletter />} />
      <Route path="marketing/automations" element={<AdminPlaceholder title="Automatizări" description="Fluxuri automate: abandon cart, post-purchase review, welcome series." />} />
      <Route path="marketing/banners" element={<AdminPlaceholder title="Bannere & Popups" description="Gestionare bannere promovionale și popups pe site." />} />
      <Route path="marketing/upsell" element={<AdminPlaceholder title="Upsell / Cross-sell" description="Configurare recomandări de upsell și cross-sell pe pagini de produs și coș." />} />

      {/* Conținut */}
      <Route path="content/pages" element={<AdminPlaceholder title="Pagini (CMS)" description="Editor de pagini statice: Despre noi, Contact, Politici." />} />
      <Route path="content/blog" element={<AdminPlaceholder title="Blog" description="Publicare și gestionare articole de blog." />} />
      <Route path="content/media" element={<AdminPlaceholder title="Media Library" description="Bibliotecă centralizată de imagini și fișiere media." />} />
      <Route path="content/menus" element={<AdminPlaceholder title="Meniu & Navigație" description="Configurare meniuri de navigație pentru site." />} />
      <Route path="content/email-templates" element={<AdminPlaceholder title="Șabloane Email" description="Editare template-uri email tranzacționale." />} />

      {/* Multi-canal */}
      <Route path="channels/emag" element={<AdminPlaceholder title="eMAG Marketplace" description="Sincronizare produse și comenzi cu eMAG." />} />
      <Route path="channels/google" element={<AdminPlaceholder title="Google Shopping" description="Feed produse pentru Google Merchant Center." />} />
      <Route path="channels/facebook" element={<AdminPlaceholder title="Facebook Shop" description="Sincronizare catalog Facebook & Instagram Shop." />} />
      <Route path="channels/connectors" element={<AdminPlaceholder title="Conectori Externi" description="Gestionare API keys, webhooks și integrări terțe." />} />

      {/* Plăți */}
      <Route path="payments/methods" element={<AdminPlaceholder title="Metode de Plată" description="Configurare metode: card, ramburs, transfer bancar." />} />
      <Route path="payments/installments" element={<AdminPlaceholder title="Rate & Installments" description="Integrare Mokka, TBI, PayPo pentru plăți în rate." />} />
      <Route path="payments/reconciliation" element={<AdminPlaceholder title="Reconciliere" description="Verificare plăți, rambursări și status tranzacții." />} />

      {/* Livrare */}
      <Route path="shipping/carriers" element={<AdminPlaceholder title="Curieri" description="Configurare curieri: Sameday, Fan Courier, DPD, Cargus." />} />
      <Route path="shipping/rates" element={<AdminPlaceholder title="Tarife Transport" description="Reguli de tarifare pe greutate, valoare sau categorie." />} />
      <Route path="shipping/awb" element={<AdminPlaceholder title="AWB Automat" description="Generare automată AWB pentru comenzi confirmate." />} />
      <Route path="shipping/tracking" element={<AdminPlaceholder title="Tracking" description="Urmărire comenzi în timp real." />} />
      <Route path="shipping/pickup" element={<AdminPlaceholder title="Puncte Ridicare" description="Easybox, PUDO și alte puncte de ridicare." />} />

      {/* Rapoarte */}
      <Route path="reports" element={<AdminReports />} />
      <Route path="reports/profit" element={<AdminPlaceholder title="Profit & Costuri" description="Analiză marjă de profit, costuri și transport." />} />
      <Route path="reports/top-products" element={<AdminPlaceholder title="Produse Top" description="Clasament produse după vânzări, profit și trend." />} />
      <Route path="reports/conversion" element={<AdminPlaceholder title="Conversie / Funnel" description="Vizualizare funnel: vizite → coș → comandă." />} />
      <Route path="reports/marketing" element={<AdminPlaceholder title="Marketing ROI" description="Analiză eficiență campanii marketing." />} />
      <Route path="reports/export" element={<AdminPlaceholder title="Export Rapoarte" description="Export rapoarte detaliate în CSV sau PDF." />} />

      {/* Setări */}
      <Route path="settings/general" element={<AdminPlaceholder title="Setări Generale" description="Nume companie, TVA, monedă, facturare automată." />} />
      <Route path="settings/seo" element={<AdminPlaceholder title="SEO Global" description="Configurare robots.txt, sitemap, meta defaults." />} />
      <Route path="settings/notifications" element={<AdminPlaceholder title="Notificări" description="Configurare notificări email, SMS și push." />} />
      <Route path="settings/gdpr" element={<AdminPlaceholder title="GDPR & Politici" description="Termeni și condiții, politica de retur, confidențialitate." />} />
      <Route path="settings/integrations" element={<AdminPlaceholder title="Integrări" description="Chei API, webhooks și configurare servicii externe." />} />

      {/* Utilizatori */}
      <Route path="users" element={<AdminPlaceholder title="Utilizatori" description="Gestionare conturi admin și permisiuni." />} />
      <Route path="users/roles" element={<AdminRolesPermissions />} />
      <Route path="users/audit" element={<AdminAuditLog />} />

      {/* Module */}
      <Route path="modules" element={<AdminPlaceholder title="Module Instalate" description="Vizualizare module active și stare sănătate." />} />
      <Route path="modules/marketplace" element={<AdminPlaceholder title="Marketplace" description="Descoperă și instalează module noi." />} />
      <Route path="modules/logs" element={<AdminPlaceholder title="Logs & Health" description="Logs integrare, retry queue și diagnosticare erori." />} />
    </Routes>
  );
}
