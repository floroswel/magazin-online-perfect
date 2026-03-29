

# Ce aș adăuga la marketplace-ul MamaLucica

Am analizat magazinul și iată ce lipsește pentru a fi cu adevărat competitiv ca marketplace multi-vendor:

---

## Ca proprietar de magazin, aș adăuga:

### 1. Pagina de Vendor / Magazin Individual
Fiecare vendor ar avea propria pagină (`/vendor/:slug`) cu logo, descriere, rating, produsele sale, politici de retur. La fel ca pe eMAG unde dai click pe "Vândut de X".

### 2. Sistem de Cupoane și Vouchere vizibil pe homepage
O secțiune "Cupoane disponibile" pe homepage unde clientul vede reduceri active pe care le poate "colecta" cu un click — exact ca pe AliExpress.

### 3. Bara de progres "Mai adaugă X lei pentru livrare gratuită"
Pe header și în coș — motivează clientul să mai adauge produse.

### 4. Secțiune "Cumpără din nou" pentru clienții logați
Produse comandate anterior, afișate pe homepage — crește rata de revenire.

### 5. Mega-Menu cu imagini pe categorii
Când hover pe "Categorii", un dropdown mare cu subcategorii + imagini promoționale pe fiecare coloană (stil eMAG).

### 6. Comparator de prețuri între vendori
Pe pagina de produs, să vezi toți vendorii care vând același produs, cu prețul și rating-ul fiecăruia.

---

## Ca client, mi-ar lipsi:

### 7. Secțiune "Produse văzute recent" persistentă
Un carusel sticky pe homepage și pe pagina de produs cu ultimele produse vizitate.

### 8. Estimare livrare pe card-ul de produs
Text mic "Livrare în 1-2 zile" sau "Livrare mâine" direct pe card, nu doar pe pagina de produs.

### 9. Filtre rapide pe homepage
Butoane tip chip: "Sub 50 lei", "Reduceri > 30%", "Livrare mâine", "Rating 4+" — direct deasupra grid-ului de produse.

### 10. Notificări de preț (Price Drop Alert)
Buton "Anunță-mă când scade prețul" pe pagina de produs.

### 11. Secțiune "Top vendori" pe homepage
Card-uri cu cei mai bine cotați vendori, cu rating, nr. de produse, badge "Vendor de încredere".

### 12. Pagină dedicată de oferte/reduceri
O rută `/oferte` cu toate produsele la reducere, filtrabile pe categorie și procent reducere.

---

## Plan de implementare (prioritizat)

| Prioritate | Feature | Fișiere noi/modificate |
|---|---|---|
| 1 | Mega-Menu cu imagini | `Header.tsx`, `MegaMenu.tsx` |
| 2 | Pagina Vendor | nou: `pages/VendorStore.tsx`, `App.tsx` |
| 3 | Pagina Oferte | nou: `pages/Oferte.tsx`, `App.tsx` |
| 4 | Filtre rapide homepage | `Index.tsx`, nou: `QuickFilters.tsx` |
| 5 | Free Shipping Progress Bar | `Header.tsx`, `Cart.tsx` |
| 6 | Cupoane vizibile homepage | nou: `CouponCollector.tsx` |
| 7 | Comparator vendori pe produs | `ProductDetail.tsx` |
| 8 | Cumpără din nou | nou: `BuyAgain.tsx` |
| 9 | Price Drop Alert | `ProductDetail.tsx` |
| 10 | Top Vendori secțiune | nou: `TopVendors.tsx` |

Toate fără a modifica panoul de admin existent.

