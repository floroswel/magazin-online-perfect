

# Audit Complet & Plan de Îmbunătățire — MamaLucica

## Probleme Identificate

### A. Probleme Vizuale & Branding (CRITICE)

1. **Footer afișează "VENTUZA"** — Titlul principal, email-ul (contact@ventuza.ro) și copyright-ul (© 2026 VENTUZA) din footer vin din baza de date (`app_settings` → `footer_texts`). Codul are valorile corecte "MamaLucica" ca fallback, dar datele din baza de date le suprascriu cu cele vechi "VENTUZA".
2. **Referințe "ventuza" în cod** — 3 fișiere conțin încă variabile cu "ventuza" (`WhyVentuza.tsx`, `ControlVisibility.tsx`, `AdminHomepageSettings.tsx`). Funcțional nu afectează utilizatorul, dar trebuie curățate.
3. **ANPC/SOL hardcodate** — Badge-urile ANPC/SOL din footer sunt hardcodate. Trebuie eliminate și înlocuite complet cu scripturi injectate din Admin → Scripturi. Zona de footer scripts există deja (`footerScriptsRef`), dar badge-urile hardcodate rămân vizibile.
4. **Footer scripts prea mici** — Zona de injectare scripturi din footer are dimensiuni prea mici. Trebuie mărită vizibilitatea (imagine/text mai mare).

### B. Probleme de Layout & Centrare

5. **Pagina Account** — La vizualizare, elementele (Cont, Favorite, Coș) din header par decalate. Pe Account, card-urile de profil din dreapta se suprapun pe ecrane mai mici. Sidebar-ul de profil e prea lipit de marginea dreaptă.
6. **Header icons spacing** — Butoanele Cont/Favorite/Coș au padding insuficient și par înghesuite pe viewport-uri medii.

### C. Securitate (32 findings din scan)

7. **2 Erori critice:**
   - `erp_integrations` — cheile API ERP sunt potențial citibile de utilizatorii autentificați. Trebuie RLS admin-only.
   - `smartbill_settings` / `paypo_settings` / `tbi_settings` / `mokka_settings` / `sameday_settings` — confirmarea că nu există politici mai largi. Trebuie audit și restricționare explicită.

8. **15+ Avertismente:**
   - 14x RLS "Always True" — politici INSERT/UPDATE cu `USING(true)` pe tabele precum `newsletter_subscribers`, `chatbot_messages`, `gdpr_consents`, etc. Cele mai multe sunt intenționate (formulare publice), dar trebuie documentate.
   - Leaked Password Protection dezactivat
   - Upload-uri return photos fără verificare de proprietar
   - Customization uploads fără scoping per utilizator
   - Review photos fără politică DELETE
   - Realtime channels fără restricții de topic
   - PayPo OAuth tokens în plaintext
   - Newsletter confirmation tokens necurățate după utilizare
   - Staff 2FA secrets citibile de staff

### D. Control Center — Limitări

9. **Vizibilitate** — Butoanele din Control Center doar activează/dezactivează elemente, nu permit editarea conținutului lor (text, culori, imagini). Utilizatorul vrea editare inline.
10. **Temă** — Tab-ul Temă există dar modificabilitatea e limitată. Utilizatorul vrea 100% customizabil.

### E. Admin Tabs — Tab-uri Incomplete

11. Majoritatea tab-urilor admin (Comenzi, Produse, Depozit, Clienți, Marketing, Plăți, Livrări, Integrări, Multicanal, Analiză, Sistem) au interfețe vizuale dar multe acțiuni nu sunt conectate la baza de date sau sunt doar placeholder-uri vizuale.

---

## Planul de Implementare (Prioritizat)

Dată fiind amploarea enormă a cererii, propun o abordare pe faze. Iată ce voi implementa **acum** (Faza 1 — cele mai critice):

### Faza 1 — Implementare Imediată

#### 1. Curățare completă "VENTUZA" din footer
- Actualizez `app_settings` din baza de date: `footer_texts` → înlocuiesc orice referință "VENTUZA" cu "MamaLucica" și "contact@ventuza.ro" cu "contact@mamalucica.ro"
- Redenumesc componentele din cod (`WhyVentuza` → `WhyMamaLucica`)
- Curăț key-urile interne care conțin "ventuza"

#### 2. Eliminare ANPC/SOL hardcodate din footer
- Elimin complet blocul hardcodat cu ANPC și SOL din `Footer.tsx`
- Măresc zona de injectare scripturi footer (dimensiune icoane/text mai mare, spacing generos)
- Scripturile adăugate din Admin → Conținut → Scripturi cu `location: footer` vor apărea automat acolo

#### 3. Fix layout Account page
- Corectez alinierea și spacing-ul pe pagina Account
- Fix responsive issues pe card-urile de profil

#### 4. Fix Header spacing
- Ajustez padding-ul pe butoanele Cont/Favorite/Coș pentru centrare corectă

#### 5. Securitate — Erori critice
- Adaug RLS admin-only pe `erp_integrations`
- Verific și restricționez acces pe tabelele de payment settings
- Fix upload policies pentru return photos (path-based ownership)

#### 6. Leaked Password Protection
- Activez HIBP check prin configurare auth

### Faza 2 — Îmbunătățiri Ulterioare (separate)
- Control Center: adăugare editare inline pe fiecare element (nu doar toggle)
- Temă: editor vizual complet cu preview live
- Audit fiecare tab admin pentru funcționalitate completă
- Curățare toate RLS "Always True" warnings
- Token cleanup (newsletter, abandoned carts, PayPo)
- DELETE policy pe review photos
- Realtime channel scoping

---

## Detalii Tehnice

### Fișiere modificate (Faza 1):
- `src/components/layout/Footer.tsx` — eliminare ANPC/SOL hardcodate, mărire zona scripturi
- `src/components/home/WhyVentuza.tsx` → rename references
- `src/components/admin/control/ControlVisibility.tsx` — curățare keys
- `src/components/admin/content/AdminHomepageSettings.tsx` — curățare keys
- `src/pages/Account.tsx` — fix layout/spacing
- `src/components/layout/Header.tsx` — fix icon spacing
- **Migrare SQL**: update `app_settings` footer_texts, RLS pe `erp_integrations`, fix upload policies

### Dimensiune estimată: ~6 fișiere + 1 migrare SQL

