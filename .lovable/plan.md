

# Plan: Implementare completă — Admin funcțional + Storefront sincronizat

## Situația curentă

Din ~120 rute admin, **~70 folosesc `AdminPlaceholder`** (pagini goale, doar cu titlu și descriere). Implementarea tuturor simultan este imposibilă într-un singur pas. Propun **3 valuri** ordonate după impact pe conversie și operațiuni zilnice.

---

## Val 1 — Operațiuni zilnice critice (acest pas)

Cele mai folosite pagini de un admin de magazin, zi de zi:

### 1. Filtre avansate catalog (storefront)
- Slider preț funcțional cu min/max din DB
- Filtru pe brand (checkbox-uri din `brands` table)  
- Filtru rating (stele)
- Filtru disponibilitate (în stoc)
- Brands se încarcă din tabelul `brands`, nu din produse

### 2. Admin Bannere & Popups  
- CRUD pe tabelul `banners` (deja existent)
- Upload imagine, link URL, plasare (homepage/category/popup)
- Activare/dezactivare, ordine, date start/end

### 3. Admin Blog
- CRUD pe `blog_posts` (tabel existent)
- Editor WYSIWYG (reutilizare din CMS pages)
- Status draft/published, imagine featured, SEO

### 4. Admin Media Library
- Browse `product-images` storage bucket
- Upload/delete imagini
- Copiere URL pentru utilizare în produse/bannere/blog

### 5. Admin Setări Magazin
- Produse pe pagină (default), ordine sortare
- Activare/dezactivare review-uri, wishlist, comparare
- Salvare în `app_settings`

### 6. Admin Setări Checkout
- Guest checkout on/off
- Câmpuri obligatorii (telefon, adresă, etc.)
- One-page vs multi-step
- Salvare în `app_settings`

### 7. Admin Setări Email/SMTP
- Configurare SMTP (host, port, user, pass) în `app_settings`
- Email expeditor, reply-to
- Buton test email

### 8. Admin Taxe (TVA)
- TVA standard 19%, TVA redus 5%/9%
- Aplicare per categorie sau per produs
- Salvare în `app_settings`

---

## Val 2 — Marketing & Rapoarte (pas următor)
- Feed-uri Google Shopping / Facebook Catalog
- Pixel tracking (Meta, TikTok, GA4, GTM)
- Rapoarte detaliate (profit, clienți, conversie)
- Campanii SMS
- Upsell/Cross-sell

## Val 3 — Enterprise & Integrări (pas final)
- SmartBill, Fan Courier, Sameday API
- eMAG Marketplace sync
- Page Builder drag & drop
- 2FA, IP whitelist
- Traduceri multi-language

---

## Detalii tehnice Val 1

**Fișiere noi (~8):**
- `src/components/admin/marketing/AdminBanners.tsx`
- `src/components/admin/content/AdminBlog.tsx`
- `src/components/admin/content/AdminMediaLibrary.tsx`
- `src/components/admin/settings/AdminStoreSettings.tsx`
- `src/components/admin/settings/AdminCheckoutSettings.tsx`
- `src/components/admin/settings/AdminEmailSettings.tsx`
- `src/components/admin/settings/AdminTaxSettings.tsx`

**Fișiere editate (~3):**
- `src/components/admin/AdminRoutes.tsx` — înlocuire placeholder-uri cu componente reale
- `src/pages/Catalog.tsx` — filtre brands din DB, slider preț îmbunătățit

**Baza de date:** Nu sunt necesare migrări. Toate tabelele (`banners`, `blog_posts`, `app_settings`, storage bucket) există deja.

**Estimare:** ~8 componente funcționale, fiecare cu CRUD complet, înlocuind placeholder-urile corespunzătoare.

