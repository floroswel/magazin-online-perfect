

## Mega Audit MamaLucica — Plan de Implementare

Acest audit acoperă ~120 funcții listate. Am inventariat codebase-ul și constat că **majoritatea funcțiilor există deja** ca componente și rute. Planul se concentrează pe **problemele reale identificate** și pe ce lipsește sau e parțial.

---

### Ce Există Deja (Confirmat din Cod)

Proiectul are o acoperire foarte bună. Routele admin sunt definite pentru: comenzi (cu filtre, detalii, statusuri, facturi, retururi), produse (atribute, bulk, SEO, bundles, variante), stoc (manager, depozite, alertă, mișcări, export), clienți CRM (segmente, grupuri, VIP, inactivi, export), marketing (cupoane, promoții, abandonare coșuri, pixels, loialitate, SMS, push), conținut (CMS, blog, hero slides, scripturi), plăți (Netopia, Mokka, PayPo, ramburs, transfer), livrări (AWB, tracking, Sameday, Fan Courier, lockers), integrări (Pixel, GA4, TikTok, SmartBill), rapoarte (dashboard KPI, top produse, conversie, trafic), tema (Control Center cu preview live, vizibilitate secțiuni), securitate (2FA, RLS, audit log, roluri), frontend (404 custom, cookies banner, pagini legale, checkout complet).

---

### Probleme Identificate și Acțiuni

#### 1. Statusuri în Română — Inconsistență în Dashboard
**Problemă:** `AdminDashboard.tsx` linia 50-56 are statusuri locale inline (`shipped: "Expediat"` — greșit, ar trebui `"Expediată"`) în loc să folosească `orderStatusLabels.ts` centralizat. Lipsesc `confirmed` și `refunded`.

**Acțiune:** Înlocuiesc `statusLabels` din AdminDashboard cu import din `src/lib/orderStatusLabels.ts`. Caut și alte componente cu mapări inline.

#### 2. Căutare Componente cu Statusuri Inline
**Acțiune:** Scanez toate fișierele pentru `"Expediat"`, `"Livrat"`, `"Anulat"` cu formă greșită (non-feminizată sau lipsă din centralizare) și le refactorizez.

#### 3. Sumă Totală Comenzi în Header
**Verificare necesară:** Dacă AdminOrders afișează suma totală a comenzilor filtrate în header-ul listei. Probabil lipsește.

#### 4. Export Comenzi CSV
**Verificare necesară:** AdminOrders — dacă are buton export. Dacă nu, adaug.

#### 5. Notificare Email la Schimbare Status
**Verificare necesară:** Există `send-email` edge function, dar trebuie verificat dacă schimbarea statusului trimite automat email clientului.

#### 6. Schema JSON-LD pe Pagina de Produs
**Verificare necesară:** `ProductDetail.tsx` — Product schema markup pentru Google.

#### 7. Buton WhatsApp pe Pagina de Produs
**Verificare necesară:** Există `LiveChat.tsx` dar trebuie confirmat WhatsApp pe produs.

#### 8. Cross-sell pe Pagina de Produs
**Verificare necesară:** Secțiune "Ți-ar putea plăcea și..." pe `ProductDetail.tsx`.

#### 9. Sticky Add-to-Cart pe Mobile
**Verificare necesară:** Buton adaugă în coș fix pe ecranul mobil.

---

### Dimensiunea Taskului

Acest audit necesită **citirea și verificarea a 50+ componente** și potențial **editarea a 10-15 fișiere**. Este prea mare pentru o singură iterație.

### Propunere de Execuție în Faze

**Faza 1 — Statusuri & Consistență** (această iterație):
- Refactorizare toate statusurile inline → import centralizat din `orderStatusLabels.ts`
- Adaug statusuri lipsă (`confirmed`, `refunded`, `returned`, `on_hold`)
- Fișiere afectate: `AdminDashboard.tsx`, `AdminOrders.tsx`, `AdminFilteredOrders.tsx`, `AdminOrderDetail.tsx`

**Faza 2 — Admin Comenzi & Export**:
- Verificare/adăugare export CSV comenzi
- Sumă totală comenzi în header
- Istoric modificări per comandă (audit log vizibil)

**Faza 3 — Frontend Produs**:
- JSON-LD schema markup
- Sticky add-to-cart mobile
- WhatsApp button
- Cross-sell section

**Faza 4 — Admin Lipsuri Minore**:
- Verificare completă a fiecărui modul din lista de audit
- Raport final cu status per funcție

**Faza 5 — Raport Final**:
- Tabel complet cu toate cele ~120 funcții și statusul lor

---

### Detalii Tehnice

**Faza 1 — Fișiere de editat:**
- `src/components/admin/AdminDashboard.tsx` — înlocuire `statusLabels` inline cu import din `orderStatusLabels.ts`
- `src/lib/orderStatusLabels.ts` — adăugare statusuri lipsă dacă nu sunt deja
- Scanare + fix orice altă componentă admin cu mapări inline

Aprobați planul pentru a începe cu Faza 1 și a continua secvențial?

