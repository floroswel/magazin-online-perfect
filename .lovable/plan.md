

## Analiza secțiunii Comenzi — Ce lipsește și ce se poate îmbunătăți

### Situația curentă

Sidebar-ul are 11 linkuri sub Comenzi. Toate au rute definite și componente funcționale:
- **Toate Comenzile** — pagină completă (772 linii): filtre avansate, KPI-uri, realtime, tag-uri, acțiuni bulk, export CSV, paginare
- **Comenzi Noi / Procesare / În Livrare / Livrate / Anulate** — folosesc `AdminFilteredOrders` (176 linii): tabel simplu cu search, paginare, export CSV
- **Facturi** — pagină completă (773 linii): statusuri fiscale, e-factura ANAF
- **Retururi** — pagină completă (357 linii): taburi, aprobare/respingere, note admin
- **Probleme** — pagină minimală (60 linii): doar tabel read-only, fără acțiuni
- **Statusuri** — pagină completă (267 linii): CRUD statusuri custom cu tranziții

---

### Ce lipsește și ce trebuie îmbunătățit

#### 1. AdminFilteredOrders — prea simplist față de pagina principală
Paginile Comenzi Noi, Procesare, În Livrare, Livrate, Anulate sunt mult mai sărace decât „Toate Comenzile":
- **Lipsește**: click pe rând pentru detalii comandă, acțiuni rapide pe status (ex: „Expediază" din pagina Procesare), filtre avansate (dată, valoare), KPI summary cards, acțiuni bulk, tag-uri
- **Plan**: Voi adăuga link către detalii comandă, acțiuni contextuale per status (ex: buton „Marchează expediată" pe pagina Procesare), și KPI cards cu totalul filtrat

#### 2. AdminIssueOrders — pagină minimală, fără funcționalitate
- **Lipsește**: acțiuni (rezolvă problema, contactează client, mută în alt status), filtre, search, export, detalii expandabile
- **Plan**: Voi adăuga search, acțiuni rapide (restaurare, contact client, notă internă), și export CSV

#### 3. Coșuri Abandonate — lipsește funcționalitate de recuperare
- **Verificare necesară**: componenta de abandoned carts probabil nu trimite email-uri automate de recuperare
- **Plan**: Voi verifica pagina existentă și adăuga acțiuni de „Trimite reminder email" și statistici de recovery rate

#### 4. Lipsă navigare între sub-pagini comenzi
- Odată intrat pe o sub-pagină (ex: Comenzi Noi), nu poți naviga rapid la altă sub-pagină fără sidebar
- **Plan**: Adaug tab-uri/breadcrumbs în header-ul fiecărei sub-pagini pentru navigare rapidă între statusuri

#### 5. Dashboard KPI-uri pe sub-pagini
- AdminFilteredOrders nu are carduri sumar (total comenzi, valoare totală, medie per comandă)
- **Plan**: Adaug 3 KPI cards deasupra tabelului pe fiecare sub-pagină

---

### Fișiere afectate

| Fișier | Modificare |
|--------|-----------|
| `src/components/admin/orders/AdminFilteredOrders.tsx` | Adaug KPI cards, link detalii, acțiuni contextuale, tab-uri navigare |
| `src/components/admin/orders/AdminIssueOrders.tsx` | Refactorizare completă: search, acțiuni, export |
| `src/components/admin/customers/AdminAbandonedCarts.tsx` | Verificare + adăugare acțiuni recovery |

### Ordinea implementării

1. Îmbunătățire `AdminFilteredOrders` — acțiuni contextuale + KPI + link detalii
2. Refactorizare `AdminIssueOrders` — funcționalitate completă
3. Verificare și îmbunătățire Coșuri Abandonate

