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
import AdminInvoices from "./orders/AdminInvoices";
import AdminUsers from "./users/AdminUsers";
import AdminAppStore from "./integrations/AdminAppStore";
import AdminAutomations from "./marketing/AdminAutomations";
import AdminWebhooks from "./shipping/AdminWebhooks";
import AdminPaymentMethods from "./payments/AdminPaymentMethods";
import AdminTransactions from "./payments/AdminTransactions";
import AdminCarriers from "./shipping/AdminCarriers";
import AdminShippingRates from "./shipping/AdminShippingRates";
import AdminTracking from "./shipping/AdminTracking";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />

      {/* ═══════════ COMENZI ═══════════ */}
      <Route path="orders" element={<AdminOrders />} />
      <Route path="orders/new" element={<AdminPlaceholder title="Comenzi Noi" description="Comenzi noi care necesită procesare și confirmare." />} />
      <Route path="orders/processing" element={<AdminPlaceholder title="În Procesare" description="Comenzi confirmate, pregătite pentru ambalare și livrare." />} />
      <Route path="orders/shipping" element={<AdminPlaceholder title="În Livrare" description="Comenzi cu AWB generat, predate curierului." />} />
      <Route path="orders/delivered" element={<AdminPlaceholder title="Livrate" description="Comenzi finalizate cu succes." />} />
      <Route path="orders/cancelled" element={<AdminPlaceholder title="Anulate" description="Comenzi anulate — motiv, cine a anulat, dată." />} />
      <Route path="orders/marketplace" element={<AdminPlaceholder title="Comenzi Marketplace" description="Comenzi importate din eMAG, Allegro și alte marketplace-uri." />} />
      <Route path="orders/b2b" element={<AdminPlaceholder title="Comenzi B2B" description="Comenzi de la persoane juridice, cu facturare separată." />} />
      <Route path="orders/recurring" element={<AdminPlaceholder title="Comenzi Recurente" description="Abonamente și comenzi programate." />} />
      <Route path="orders/issues" element={<AdminPlaceholder title="Comenzi cu Probleme" description="Plată eșuată, stoc insuficient sau alte probleme." />} />
      <Route path="orders/invoices" element={<AdminInvoices />} />
      <Route path="orders/returns" element={<AdminReturns />} />
      <Route path="orders/abandoned" element={<AdminPlaceholder title="Coșuri Abandonate" description="Vizualizare și recuperare coșuri abandonate prin email automat." />} />

      {/* ═══════════ PRODUSE ═══════════ */}
      <Route path="products" element={<AdminProducts />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="products/brands" element={<AdminPlaceholder title="Mărci" description="Gestionare mărci/brand-uri și asociere cu produse." />} />
      <Route path="products/attributes" element={<AdminPlaceholder title="Atribute & Variante" description="Definire atribute dinamice (culoare, mărime, capacitate) și variante de produs." />} />
      <Route path="products/attribute-sets" element={<AdminPlaceholder title="Seturi de Atribute" description="Grupuri de atribute pe categorii de produse." />} />
      <Route path="products/specs" element={<AdminPlaceholder title="Specificații Tehnice" description="Șabloane de specificații tehnice pe tipuri de produse." />} />
      <Route path="products/promo" element={<AdminPlaceholder title="Produse în Promoție" description="Toate produsele cu discount activ." />} />
      <Route path="products/no-image" element={<AdminPlaceholder title="Produse Fără Imagine" description="Control calitate: produse care nu au imagine principală." />} />
      <Route path="products/no-description" element={<AdminPlaceholder title="Produse Fără Descriere" description="Control calitate: produse fără descriere completă." />} />
      <Route path="products/reviews" element={<AdminPlaceholder title="Review-uri Produse" description="Moderare și gestionare review-uri clienți." />} />
      <Route path="products/questions" element={<AdminPlaceholder title="Întrebări Produse" description="Q&A — întrebări de la clienți și răspunsuri." />} />
      <Route path="products/related" element={<AdminPlaceholder title="Produse Similare" description="Configurare manuală/automată produse similare și asociate." />} />
      <Route path="products/compatibility" element={<AdminPlaceholder title="Compatibilități" description="Produse compatibile (ex: toner pentru imprimantă X)." />} />
      <Route path="products/import-export" element={<AdminImportExport />} />
      <Route path="products/bulk-update" element={<AdminPlaceholder title="Actualizare în Masă" description="Modificare rapidă preț, categorie, brand, status pentru mai multe produse." />} />
      <Route path="products/seo" element={<AdminPlaceholder title="SEO Produse" description="Optimizare meta titluri, descrieri și schema markup pentru produse." />} />

      {/* ═══════════ STOC & DEPOZIT ═══════════ */}
      <Route path="stock" element={<AdminStockOverview />} />
      <Route path="stock/warehouses" element={<AdminPlaceholder title="Depozite" description="Gestionare depozite: adăugare, editare, alocare stoc pe locații." />} />
      <Route path="stock/transfers" element={<AdminPlaceholder title="Transferuri Stoc" description="Transfer produse între depozite." />} />
      <Route path="stock/movements" element={<AdminStockMovements />} />
      <Route path="stock/adjustments" element={<AdminPlaceholder title="Ajustări Stoc" description="Intrări și ieșiri manuale de stoc cu motiv." />} />
      <Route path="stock/inventory" element={<AdminInventory />} />
      <Route path="stock/nir" element={<AdminPlaceholder title="NIR (Recepție Marfă)" description="Recepție marfă cu generare Notă de Intrare Recepție." />} />
      <Route path="stock/serials" element={<AdminPlaceholder title="Seriale / IMEI" description="Gestionare numere de serie și IMEI individuale pe produs." />} />
      <Route path="stock/batches" element={<AdminPlaceholder title="Loturi" description="Gestionare pe loturi de producție și trasabilitate." />} />
      <Route path="stock/expiry" element={<AdminPlaceholder title="Expirări" description="Produse cu dată de expirare — alerte și rapoarte." />} />
      <Route path="stock/picking" element={<AdminPlaceholder title="Picking List" description="Generare liste de picking pentru comenzi în procesare." />} />
      <Route path="stock/alerts" element={<AdminStockAlerts />} />
      <Route path="stock/suppliers" element={<AdminPlaceholder title="Furnizori" description="Gestionare furnizori, prețuri de achiziție, comenzi de aprovizionare." />} />
      <Route path="stock/reorder" element={<AdminPlaceholder title="Aprovizionare" description="Sugestii automate de reaprovizionare pe baza vânzărilor și stocului." />} />

      {/* ═══════════ CLIENȚI / CRM ═══════════ */}
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="customers/new" element={<AdminPlaceholder title="Clienți Noi" description="Clienți înregistrați în ultima lună." />} />
      <Route path="customers/active" element={<AdminPlaceholder title="Clienți Activi" description="Clienți care au cumpărat în ultimele 3 luni." />} />
      <Route path="customers/inactive" element={<AdminPlaceholder title="Clienți Inactivi" description="Clienți fără comandă de peste 6 luni." />} />
      <Route path="customers/vip" element={<AdminPlaceholder title="Clienți VIP" description="Top clienți după valoarea totală a cumpărăturilor." />} />
      <Route path="customers/b2b" element={<AdminPlaceholder title="Clienți B2B" description="Persoane juridice — CUI, date fiscale, prețuri diferențiate." />} />
      <Route path="customers/groups" element={<AdminCustomerGroups />} />
      <Route path="customers/segments" element={<AdminCustomerSegments />} />
      <Route path="customers/tags" element={<AdminPlaceholder title="Etichete (Tag-uri)" description="Adăugare manuală/automată de tag-uri pe clienți pentru segmentare." />} />
      <Route path="customers/loyalty" element={<AdminLoyalty />} />
      <Route path="customers/tickets" element={<AdminSupportTickets />} />
      <Route path="customers/gdpr" element={<AdminPlaceholder title="GDPR & Date Personale" description="Export date client, ștergere cont, gestionare consimțăminte." />} />
      <Route path="customers/import" element={<AdminPlaceholder title="Import Clienți" description="Import clienți din fișier CSV cu mapare câmpuri." />} />
      <Route path="customers/export" element={<AdminPlaceholder title="Export Clienți" description="Export lista clienți pentru campanii sau analize externe." />} />

      {/* ═══════════ MARKETING ═══════════ */}
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="marketing/promotions" element={<AdminPlaceholder title="Promoții" description="Promoții avansate: reduceri procentuale, BOGO, pachete, transport gratuit, scheduling." />} />
      <Route path="newsletter" element={<AdminNewsletter />} />
      <Route path="marketing/sms" element={<AdminPlaceholder title="Campanii SMS" description="Notificări și promoții prin SMS." />} />
      <Route path="marketing/abandoned-cart" element={<AdminPlaceholder title="Coș Abandonat" description="Recuperare automată: detectare, secvență emailuri, cupoane de recuperare." />} />
      <Route path="marketing/automations" element={<AdminAutomations />} />
      <Route path="marketing/banners" element={<AdminPlaceholder title="Bannere & Popups" description="Gestionare bannere promovionale, popup-uri exit-intent și notificări." />} />
      <Route path="marketing/upsell" element={<AdminPlaceholder title="Upsell / Cross-sell" description="Configurare recomandări de upsell și cross-sell pe pagini de produs și coș." />} />
      <Route path="marketing/feeds" element={<AdminPlaceholder title="Feed-uri Marketing" description="Configurare feed-uri: Google Shopping, Facebook Catalog, comparatoare." />} />
      <Route path="marketing/pixels" element={<AdminPlaceholder title="Pixel Tracking" description="Meta Pixel, Google Ads, TikTok Pixel — configurare și verificare." />} />
      <Route path="marketing/recommendations" element={<AdminPlaceholder title="Recomandări Personalizate" description="Configurare algoritm de recomandări pe baza istoricului de cumpărături." />} />
      <Route path="marketing/ab-tests" element={<AdminPlaceholder title="Teste A/B" description="Teste A/B pentru pagini, prețuri și promoții." />} />
      <Route path="marketing/reports" element={<AdminPlaceholder title="Rapoarte Marketing" description="Conversie campanii, utilizare vouchere, ROI per canal." />} />

      {/* ═══════════ CONȚINUT ═══════════ */}
      <Route path="content/pages" element={<AdminPlaceholder title="Pagini (CMS)" description="Editor de pagini statice: Despre noi, Contact, Politici." />} />
      <Route path="content/page-builder" element={<AdminPlaceholder title="Page Builder" description="Drag & drop page builder pentru pagini personalizate." />} />
      <Route path="content/homepage" element={<AdminPlaceholder title="Homepage" description="Editare secțiuni homepage: hero, categorii, produse recomandate." />} />
      <Route path="content/landing" element={<AdminPlaceholder title="Landing Pages" description="Pagini de campanie cu tracking și A/B testing." />} />
      <Route path="content/blog" element={<AdminPlaceholder title="Blog" description="Publicare și gestionare articole de blog." />} />
      <Route path="content/media" element={<AdminPlaceholder title="Media Library" description="Bibliotecă centralizată de imagini și fișiere media." />} />
      <Route path="content/menus" element={<AdminPlaceholder title="Meniu & Navigație" description="Configurare meniuri de navigație principale și footer." />} />
      <Route path="content/translations" element={<AdminPlaceholder title="Traduceri" description="Multi-language: limbi disponibile, traducere automată, URL-uri localizate." />} />
      <Route path="content/email-templates" element={<AdminPlaceholder title="Șabloane Email" description="Editare template-uri email tranzacționale și marketing." />} />
      <Route path="content/seo" element={<AdminPlaceholder title="SEO & Redirecționări" description="Meta tags, robots.txt, sitemap.xml, redirecționări 301/302, pagină 404." />} />
      <Route path="content/legal" element={<AdminPlaceholder title="Termeni & Politici" description="Termeni și condiții, politică confidențialitate, politică cookie." />} />

      {/* ═══════════ MULTI-CANAL ═══════════ */}
      <Route path="channels/emag" element={<AdminPlaceholder title="eMAG Marketplace" description="Sincronizare produse, prețuri, stoc și comenzi cu eMAG." />} />
      <Route path="channels/google" element={<AdminPlaceholder title="Google Shopping" description="Feed produse pentru Google Merchant Center și Performance Max." />} />
      <Route path="channels/facebook" element={<AdminPlaceholder title="Facebook Shop" description="Sincronizare catalog Facebook & Instagram Shop." />} />
      <Route path="channels/allegro" element={<AdminPlaceholder title="Allegro" description="Sincronizare produse și comenzi cu Allegro Marketplace." />} />
      <Route path="channels/olx" element={<AdminPlaceholder title="OLX" description="Publicare și sincronizare anunțuri pe OLX." />} />
      <Route path="channels/pricero" element={<AdminPlaceholder title="Price.ro" description="Feed automat XML pentru comparatorul de prețuri Price.ro." />} />
      <Route path="channels/compariro" element={<AdminPlaceholder title="Compari.ro" description="Feed produse pentru Compari.ro cu sincronizare automată." />} />
      <Route path="channels/api" element={<AdminPlaceholder title="API Extern" description="Documentație API, chei de acces și playground pentru integrări." />} />
      <Route path="channels/connectors" element={<AdminPlaceholder title="Conectori Externi" description="Gestionare API keys, webhooks și integrări terțe." />} />

      {/* ═══════════ PLĂȚI ═══════════ */}
      <Route path="payments/methods" element={<AdminPaymentMethods />} />
      <Route path="payments/gateways" element={<AdminPaymentMethods />} />
      <Route path="payments/transactions" element={<AdminTransactions />} />
      <Route path="payments/refunds" element={<AdminRefunds />} />
      <Route path="payments/installments" element={<AdminPlaceholder title="Rate & Installments" description="Integrare Mokka, TBI, PayPo, Alpha Bank pentru plăți în rate." />} />
      <Route path="payments/settlements" element={<AdminPlaceholder title="Decontări" description="Perioade de decontare, sume și reconciliere cu gateway-uri." />} />
      <Route path="payments/reconciliation" element={<AdminPlaceholder title="Reconciliere" description="Verificare plăți, rambursări și status tranzacții." />} />

      {/* ═══════════ LIVRARE ═══════════ */}
      <Route path="shipping/carriers" element={<AdminPlaceholder title="Curieri" description="Configurare curieri: Fan Courier, Sameday, DPD, Cargus, GLS." />} />
      <Route path="shipping/rates" element={<AdminPlaceholder title="Tarife Transport" description="Reguli de tarifare: greutate, volum, valoare, destinație, transport gratuit." />} />
      <Route path="shipping/awb" element={<AdminPlaceholder title="AWB Automat" description="Generare automată AWB pentru comenzi confirmate." />} />
      <Route path="shipping/labels" element={<AdminPlaceholder title="Etichete" description="Generare și printare etichete de expediere." />} />
      <Route path="shipping/tracking" element={<AdminPlaceholder title="Tracking" description="Urmărire comenzi în timp real cu timeline de evenimente." />} />
      <Route path="shipping/lockers" element={<AdminPlaceholder title="Lockere / Easybox" description="Hartă lockere, selecție la checkout, Easybox Sameday, DPD Box." />} />
      <Route path="shipping/international" element={<AdminPlaceholder title="Livrări Internaționale" description="Configurare curieri și tarife pentru livrări în afara României." />} />
      <Route path="shipping/pickup" element={<AdminPlaceholder title="Puncte Ridicare" description="Easybox, PUDO și alte puncte de ridicare." />} />
      <Route path="shipping/scheduling" element={<AdminPlaceholder title="Programări Livrare" description="Interval orar și dată preferată pentru livrare." />} />
      <Route path="shipping/webhooks" element={<AdminWebhooks />} />

      {/* ═══════════ RAPOARTE ═══════════ */}
      <Route path="reports" element={<AdminReports />} />
      <Route path="reports/profit" element={<AdminPlaceholder title="Profit & Costuri" description="Analiză marjă de profit, costuri transport și procesare." />} />
      <Route path="reports/top-products" element={<AdminPlaceholder title="Produse Top" description="Clasament produse după vânzări, profit și trend." />} />
      <Route path="reports/slow-movers" element={<AdminPlaceholder title="Produse Lente" description="Produse cu vânzări reduse sau fără mișcare (dead stock)." />} />
      <Route path="reports/customers" element={<AdminPlaceholder title="Rapoarte Clienți" description="Clienți noi vs recurenți, LTV, rata retenție, AOV." />} />
      <Route path="reports/inventory" element={<AdminPlaceholder title="Stoc & Rotație" description="Rotație stoc, valoare stoc, zile acoperire, dead stock." />} />
      <Route path="reports/conversion" element={<AdminPlaceholder title="Conversie / Funnel" description="Vizualizare funnel: vizite → coș → comandă." />} />
      <Route path="reports/marketing" element={<AdminPlaceholder title="Marketing ROI" description="Analiză eficiență campanii marketing per canal." />} />
      <Route path="reports/financial" element={<AdminPlaceholder title="Rapoarte Financiare" description="Cifră de afaceri, TVA colectat/deductibil, costuri, decontări." />} />
      <Route path="reports/custom" element={<AdminPlaceholder title="Rapoarte Personalizate" description="Query builder: selectează metrici, dimensiuni, filtre. Salvare și programare." />} />
      <Route path="reports/export" element={<AdminPlaceholder title="Export Rapoarte" description="Export rapoarte detaliate în CSV sau PDF, programare automată." />} />

      {/* ═══════════ SETĂRI ═══════════ */}
      <Route path="settings/general" element={<AdminPlaceholder title="Setări Generale" description="Nume companie, adresă, CUI, monedă, fus orar, formate." />} />
      <Route path="settings/taxes" element={<AdminPlaceholder title="Taxe (TVA)" description="TVA standard 19%, TVA redus 5%/9%, scutiri, reverse charge B2B." />} />
      <Route path="settings/store" element={<AdminPlaceholder title="Setări Magazin" description="Produse pe pagină, afișare stoc, ordine produse, review-uri, wishlist, comparare." />} />
      <Route path="settings/email" element={<AdminPlaceholder title="Email / SMTP" description="Configurare SMTP, template-uri email, test email, logo în email-uri." />} />
      <Route path="settings/seo" element={<AdminPlaceholder title="SEO Global" description="Meta defaults, URL structure, Open Graph, Schema.org markup." />} />
      <Route path="settings/notifications" element={<AdminPlaceholder title="Notificări" description="Configurare notificări email, SMS și push — admin și client." />} />
      <Route path="settings/security" element={<AdminPlaceholder title="Securitate" description="Parolă minimă, blocare după încercări eșuate, reCAPTCHA." />} />
      <Route path="settings/gdpr" element={<AdminPlaceholder title="GDPR & Politici" description="Texte consimțământ, perioadă retenție date, export/ștergere automată." />} />
      <Route path="settings/integrations" element={<AdminPlaceholder title="Integrări" description="Chei API, webhooks și configurare servicii externe." />} />

      {/* ═══════════ UTILIZATORI ═══════════ */}
      <Route path="users" element={<AdminUsers />} />
      <Route path="users/roles" element={<AdminRolesPermissions />} />
      <Route path="users/sessions" element={<AdminPlaceholder title="Sesiuni Active" description="Vizualizare și terminare sesiuni active ale utilizatorilor." />} />
      <Route path="users/2fa" element={<AdminPlaceholder title="Autentificare 2FA" description="Activare/dezactivare autentificare în doi pași per utilizator." />} />
      <Route path="users/ip-whitelist" element={<AdminPlaceholder title="IP Whitelist" description="Restricționare acces admin doar de pe IP-uri specifice." />} />
      <Route path="users/audit" element={<AdminAuditLog />} />

      {/* ═══════════ MODULE / APP STORE ═══════════ */}
      <Route path="modules" element={<AdminAppStore />} />
      <Route path="modules/marketplace" element={<AdminAppStore />} />
      <Route path="modules/logs" element={<AdminPlaceholder title="Logs & Health" description="Logs integrare, retry queue și diagnosticare erori." />} />
    </Routes>
  );
}
