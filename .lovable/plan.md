

# Status complet — ce e gata, ce lipsește

## IMPLEMENTAT COMPLET (funcțional)
- Exit Intent Popup cu cod 10% + timer 30 min
- Recently Viewed Products (carusel persistent)
- Stock Urgency (badge roșu sub 5 buc)
- Free Shipping Progress Bar (header + coș)
- Frequently Bought Together (pe pagina produs)
- Trust Badge Page (/de-incredere)
- Live Chat WhatsApp bubble
- Verified Reviews cu foto upload
- Wishlist cu alerte de preț
- Loyalty Gamification (puncte, nivele, badges)
- Referral Program (link personal, recompense)
- Blog CMS (articole SEO)
- FAQ cu Schema.org markup
- Google Shopping Feed (edge function)
- Candle Mood Selector (homepage)
- Scent Pairing (pe produs)
- Candle Calculator (ore ardere)
- Pagina /nou cu countdown
- Transparency Dashboard (/despre-noi/numere)
- Predictive Search (autocomplete instant)
- One-Click Reorder
- Burn Log (jurnal ardere)
- Candle Club / Loyalty
- PWA (/install)
- Gift Card Digital (cumpărare + cod)
- Flash Sale cu acces anticipat
- Predictive Stock (analiză viteză vânzări)
- Calculare Profit (cost_price + marje)
- Mega-Menu cu imagini
- Cupoane vizibile pe homepage
- Comparator vendori pe produs
- Segmentare automată clienți
- Remarketing / Retargeting (UI construită)
- Abandon Cart 3 emailuri (edge function)
- Reconciliere bancară (UI + export CSV)
- TVA calculat automat (rapoarte financiare)
- Pachete/Bundles (admin complet)

## PARȚIAL — necesită configurare/API keys
| Feature | Status | Ce lipsește |
|---------|--------|-------------|
| SmartBill facturare | UI + edge function gata | API key (email, token, CIF) |
| Clarity Heatmaps | Script Manager gata | Clarity ID configurat din Admin → Pixeli |
| Sameday AWB | Edge function gata | SAMEDAY_API_KEY |
| WhatsApp notificări | Toggle în Admin → General | WhatsApp Business API key |
| Retargeting dinamic | UI construită | Meta/TikTok Pixel IDs active |
| Lookalike Audiences | Buton export existent | Pixel IDs + datele reale |

## LIPSEȘTE COMPLET — de implementat

### Prioritate mare (CONVERSIE + RETENȚIE)
1. **Post-Purchase Email Flow** — secvență de 3 emailuri automate (confirmare + ghid îngrijire, tracking update, cerere recenzie la 14 zile). Edge function `request-reviews` există dar trimite doar cererea de recenzie, nu întreaga secvență.

2. **Personalizare Homepage după comportament** — mesaj "Bun revenit!" cu produsul vizitat ultima dată, recomandări bazate pe localStorage. Nu e implementat deloc.

3. **Raport Săptămânal Automat** — email luni dimineața cu KPI-uri (vânzări, top produse, coșuri abandonate, clienți noi vs reveniri). Necesită edge function + cron job.

### Prioritate medie (MARKETING + SEO)
4. **SEO Programatic** — pagini auto-generate per oraș + categorie ("Lumânări parfumate Cluj", "Cadouri lumânări București"). Rută dinamică `/l/:city/:category` cu conținut generat. Nu există.

5. **Pachete Sezoniere dedicate** — colecții cu countdown și stoc limitat (Valentine's, Crăciun, 8 Martie). Categoria "Sezoniere" există dar fără UI de countdown/stoc limitat dedicat.

### Prioritate scăzută (AVANSAT)
6. **Virtual Try-On Room** — upload poză cameră + overlay lumânare via Canvas. Complex, zero implementare.

7. **QR Code pe colet** — pagină personalizată post-livrare + generare QR în PDF/label. Necesită edge function nouă.

8. **YouTube/TikTok Content Funnel** — strategie de conținut, nu implementare tehnică.

---

## Plan de implementare recomandat

### Pas 1 — Post-Purchase Email Flow
- Creez edge function `post-purchase-flow` cu logica celor 3 emailuri
- Email 1 (imediat la confirmare): confirmare + ghid îngrijire lumânări
- Email 2 (ziua 3): "Comanda ta e pe drum" cu link tracking
- Email 3 (ziua 14): cerere recenzie cu link direct (integrare cu `request-reviews` existent)
- Cron job care verifică zilnic comenzile și trimite emailul potrivit

### Pas 2 — Personalizare Homepage
- Componentă `WelcomeBack.tsx` pe homepage
- Salvează în localStorage ultimele produse vizitate + timestamp vizită
- La a 2-a vizită: "Bun revenit! Ai vizitat [produs] data trecută"
- La a 3-a+: recomandări bazate pe categoriile vizitate

### Pas 3 — Raport Săptămânal
- Edge function `weekly-report` care agregă date din ultimele 7 zile
- Cron job luni la 08:00
- Trimite email cu: venituri, top 5 produse, coșuri abandonate, clienți noi, comparație cu săptămâna anterioară

### Pas 4 — SEO Programatic
- Rută `/l/:city/:category` cu componentă `LandingPage.tsx`
- Generează conținut din template: "Cele mai bune {category} din {city}"
- Schema.org LocalBusiness + Product markup
- Sitemap dinamic actualizat

### Fișiere afectate
- `supabase/functions/post-purchase-flow/index.ts` (nou)
- `src/components/home/WelcomeBack.tsx` (nou)
- `src/pages/Index.tsx` (integrare WelcomeBack)
- `supabase/functions/weekly-report/index.ts` (nou)
- `src/pages/SeoLanding.tsx` (nou)
- `src/App.tsx` (rute noi)

**Total: 8 features lipsesc complet, 6 necesită doar configurare API keys.**

