# Plan Complet: Platformă E-Commerce Enterprise (Nivel Gomag + MerchantPro)

## Viziune
Magazin online ultra-performant pentru electronice/electrocasnice/IT, specific pieței din România, cu admin panel enterprise-grade. Extensibil internațional.

## Principii arhitecturale
- **Extinde schema existentă** — nu redesign, ci augmentare incrementală
- **Event-driven** — acțiuni critice emit evenimente (order.created, stock.low, etc.)
- **Modular** — fiecare modul e independent, activabil/dezactivabil
- **Romania-first** — TVA, e-Factura, curieri RO, plăți locale

---

## STATUS CURENT (Ce există deja ✅)

### Bază de date (tabele existente)
- ✅ `products` (name, price, old_price, stock, specs JSON, images, brand, category_id, featured, rating, slug)
- ✅ `categories` (ierarhice cu parent_id, slug, icon)
- ✅ `orders` + `order_items` (status, total, shipping_address, payment_method, coupon, loyalty_points)
- ✅ `returns` (reason, status workflow, refund_amount, tracking, admin_notes)
- ✅ `profiles` (full_name, phone, avatar_url)
- ✅ `addresses` (full_name, phone, city, county, postal_code, label, is_default)
- ✅ `user_roles` (RBAC cu enum: admin, moderator, user, orders_manager, products_manager, marketing, support, finance, viewer)
- ✅ `coupons` + `coupon_usage`
- ✅ `favorites`, `comparison_lists`, `recently_viewed`, `cart_items`
- ✅ `reviews` + `review_images` + `product_questions`
- ✅ `brands` (name, slug, logo_url)
- ✅ `warehouses` + `warehouse_stock` + `stock_movements` + `stock_alerts`
- ✅ `loyalty_points` + `loyalty_levels`
- ✅ `support_tickets`
- ✅ `newsletter_subscribers` + `newsletter_campaigns`
- ✅ `audit_log` (actor, entity_type, action, before/after JSON)
- ✅ `cms_pages`, `blog_posts`, `banners`
- ✅ `integrations`, `modules`, `app_settings`
- ✅ `scheduled_imports` (feed_url, interval, cron)
- ✅ `health_logs`

### Admin Panel (componente existente)
- ✅ Dashboard cu KPI-uri și widget activitate live
- ✅ Gestiune comenzi (statusuri, detalii, timeline)
- ✅ Gestiune retururi (workflow complet)
- ✅ Produse (wizard 5 pași: Bază, Prețuri, Stoc, Media, SEO)
- ✅ Categorii (CRUD)
- ✅ Stoc & Depozit (overview, mișcări, alerte, inventar)
- ✅ Clienți (listă, grupuri, segmente, loyalty, tickete suport)
- ✅ Marketing (cupoane, newsletter, placeholder-e pentru promoții/bannere/upsell)
- ✅ Utilizatori & Roluri (RBAC cu matrice permisiuni 16 module × 4 acțiuni)
- ✅ Audit Log
- ✅ Import/Export produse (CSV/JSON/XML + import programat)
- ✅ Notificări realtime (comenzi noi, status updates)
- ✅ Căutare globală admin

### Edge Functions
- ✅ `admin-users` (listare utilizatori cu roluri)
- ✅ `import-products` (import masiv)
- ✅ `cron-import` (sarcini programate)
- ✅ `send-email` (email tranzacțional)
- ✅ `send-newsletter`

### Storefront
- ✅ Pagini: Index, Catalog, ProductDetail, Cart, Checkout, OrderConfirmation, Auth, Account, Favorites, Compare
- ✅ Header + Footer + Layout
- ✅ ProductCard component

### Securitate
- ✅ RLS pe toate tabelele
- ✅ Funcție `has_role()` SECURITY DEFINER
- ✅ Trigger auto-creare profil la signup

---

## FAZA 1: Fundament Enterprise (Prioritate MAXIMĂ)

### 1.1 Sistem de Evenimente (Event Bus)
**Tabel nou:** `events`
- event_type, entity_type, entity_id, payload jsonb, processed
- Evenimente: order.created, stock.low, payment.received, etc.

### 1.2 Integration SDK / App Store
**Tabele noi:** `connectors`, `connector_instances`, `sync_logs`
- Definire conectori disponibili (eMAG, Fan Courier, SmartBill...)
- Instanțe configurabile per magazin
- Log sincronizări cu status și statistici

### 1.3 Sistem de Notificări Multi-Canal
**Tabele noi:** `notification_templates`, `notifications`
- Template-uri cu variabile {{}}
- Canale: email, SMS, push, in_app
- Status tracking (sent, read, failed)

---

## FAZA 2: Module Administrative Avansate

### 2.1 Facturare & Documente Fiscale
**Tabele noi:** `invoices`, `invoice_items`
- Serii și numere automate (MG-2025-00001)
- Date vânzător/cumpărător (CUI, RegCom, IBAN)
- TVA 19%, calcul automat
- Integrare e-Factura (SPV) — XML generat, status upload
- Generare PDF, stornare

### 2.2 AWB Automat & Tracking
**Tabele noi:** `shipments`, `shipment_events`, `courier_configs`
- Curieri RO: Fan Courier, Sameday, DPD, Cargus, GLS
- Generare AWB automat cu detalii pachet
- Tracking events cu timeline
- Suport Easybox/PUDO
- Costuri transport + ramburs

### 2.3 Plăți Online
**Tabele noi:** `payment_methods`, `payment_transactions`
- Provideri: Netopia, Stripe, PayPal
- Card (masked), transfer, ramburs, rate (Mokka, TBI, PayPo)
- Reconciliere tranzacții, refund tracking

### 2.4 Promoții & Reguli de Preț
**Tabele noi:** `promotions`, `price_rules`
- Tipuri: percentage, fixed, buy_x_get_y, free_shipping, gift, bundle
- Condiții complexe (min cart, categorii, brand-uri, grupuri clienți)
- Scheduling, stacking, prioritate
- Badge-uri pe produse

### 2.5 Atribute & Variante Produs
**Tabele noi:** `product_attributes`, `attribute_values`, `product_variants`, `product_attribute_values`
- Atribute filterable (Culoare, Mărime, Capacitate)
- Variante cu SKU, barcode, preț, stoc propriu
- Selector vizual pe storefront

### 2.6 Customer Groups & Prețuri Diferențiate
**Tabele noi:** `customer_groups`, `customer_group_members`, `group_prices`
- Grupuri cu discount implicit
- Prețuri diferențiate per produs per grup
- Auto-assign pe bază de reguli

---

## FAZA 3: Storefront Avansat

### 3.1 Search & Filtre
- Full-text search PostgreSQL (tsvector/tsquery)
- Filtre dinamice pe atribute
- Autocomplete + sugestii
- Istoric căutări

### 3.2 Mega Menu
- Multi-nivel cu imagini și bannere
- Breadcrumbs dinamice

### 3.3 Pagina Produs Refăcută
- Galerie cu zoom + video
- Variante cu selector vizual
- Schema.org markup
- "Back in stock" notificări

### 3.4 Checkout Avansat
- Guest checkout
- Selecție Easybox/locker
- Calcul transport real-time
- Promoții automate
- e-Factura la checkout

### 3.5 Cont Client Avansat
- Tracking real-time
- Portofel puncte
- Sistem referral
- Preferințe notificări

---

## FAZA 4: Marketing & Automatizări

### 4.1 Marketing Automation
**Tabele noi:** `automations`, `automation_runs`
- Trigger: cart.abandoned, order.delivered, user.registered
- Acțiuni: send_email, apply_coupon, notify
- Statistici: sent, opened, clicked, converted

### 4.2 Abandoned Cart Recovery
- Detectare 30min/1h/24h
- Secvență 3 emailuri automate
- Cupon recuperare

### 4.3 Upsell / Cross-sell
**Tabel nou:** `product_relations`
- Tipuri: upsell, cross_sell, accessory, similar, frequently_bought

### 4.4 Bannere & Popups
- Exit-intent popups
- A/B testing

---

## FAZA 5: Multi-Canal & Integrări

### 5.1 eMAG Marketplace
- Sync produse bidirecțional + comenzi + stoc

### 5.2 Google Shopping
- Feed XML automat + categorii mapped

### 5.3 Facebook / Instagram Shop
- Catalog sync + Pixel + Conversions API

### 5.4 Feed Management
**Tabel nou:** `feed_configs`
- Tipuri: google_shopping, facebook, emag, compari, price.ro
- Filtre, mapări câmpuri, generare automată

---

## FAZA 6: Rapoarte & Analytics

- Vânzări (zi/săptămână/lună, per categorie/brand)
- Profit (marjă, costuri, transport)
- Conversie funnel
- Clienți (LTV, cohort, noi vs recurenți)
- Stoc (rotație, zile acoperire)
- Marketing ROI
- Export CSV/PDF + rapoarte programate

---

## FAZA 7: Setări & Configurare

- Date companie (CUI, RegCom, IBAN)
- TVA configurabil
- Template-uri email editabile
- SEO global (robots.txt, sitemap, schema.org)
- GDPR (cookie consent, export date, ștergere cont)

---

## FAZA 8: Securitate & Performanță

- 2FA admin (TOTP)
- Rate limiting, IP whitelist
- Sesiuni active cu revocare
- Image optimization (WebP, lazy load)
- Database indexing
- Caching layer

---

## ORDINEA IMPLEMENTĂRII (Roadmap)

| Sprint | Module | Status |
|--------|--------|--------|
| 1-2 | Event Bus + Integration SDK + Notificări | ☐ |
| 3-4 | Facturare (e-Factura) + AWB/Tracking | ☐ |
| 5-6 | Plăți Online + Promoții Avansate | ☐ |
| 7-8 | Atribute/Variante + Customer Groups | ☐ |
| 9-10 | Storefront Avansat (Search, Mega Menu, Checkout) | ☐ |
| 11-12 | Marketing Automation + Abandoned Cart | ☐ |
| 13-14 | Multi-canal (eMAG, Google, Facebook) | ☐ |
| 15-16 | Rapoarte Avansate + GDPR + 2FA + Optimizare | ☐ |

---

## CONVENȚII TEHNICE

- **Tabele:** `snake_case` plural
- **Componente:** `src/components/admin/{module}/Admin{Feature}.tsx`
- **Hooks:** `src/hooks/use{Feature}.tsx`
- **Edge Functions:** `supabase/functions/{action-name}/index.ts`
- **Culori:** doar design tokens HSL semantic
- **RLS:** `has_role()` pe toate tabelele admin
- **Audit:** log acțiuni critice cu before/after JSON
