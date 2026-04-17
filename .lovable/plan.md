

## Plan: Rezolvare probleme checkout, geo, email, chat

### Probleme identificate din capturi

**1. Transfer bancar - beneficiar greșit**
Checkout-ul afișează `settings.company_name` ("LUMAX SRL") în loc de datele din `payment_methods.config_json` care conțin beneficiarul corect ("SC VOMIX GENIUS SRL"). Voi actualiza secțiunea de plată transfer bancar să citească dinamic din tabelul `payment_methods` (bancă, IBAN, beneficiar) în loc de `app_settings`.

**2. Localități lipsă Teleorman (și alte județe)**
Baza de date conține doar 5 localități pentru Teleorman (municipii și orașe). Lipsesc toate comunele și satele. Voi popula tabelul `romania_localitati` cu setul complet de localități (aprox. 13.000+ pentru toată România) folosind datele oficiale INS/SIRUTA. Aceasta va acoperi toate localitățile din fiecare județ.

**3. Checkout - restructurare flux (cont + persoană fizică/juridică)**
- Mutarea opțiunii "Creează cont" sus cu beneficii pe scurt (puncte fidelitate, istoric comenzi, adresă salvată)
- Adăugarea selecției "Persoană fizică / Persoană juridică" direct în fluxul principal (nu doar la facturare diferită)
- La persoană juridică: câmpuri CUI, firmă, reg. com., bancă
- Comanda fără cont rămâne disponibilă

**4. Cupon BINEAIVENIT10 - nu există în baza de date**
Voi crea cuponul `BINEAIVENIT10` în tabelul `coupons` cu 10% reducere, limitat la prima comandă per utilizator. La signup, email-ul de welcome va include codul care funcționează efectiv. Dacă codul a fost deja utilizat, la aplicare va afișa mesaj "Acest cod a fost utilizat la comanda X din data Y".

**5. Email resetare parolă - în engleză, nebranded**
Email-ul de reset parolă vine de la `no-reply@auth.lovable.cloud` în engleză. Voi configura template-uri de auth email în română, brandate Mama Lucica (culori amber/ivory, logo), cu link funcțional către site. Includ și link de dezabonare.

**6. Chat GDPR popup - afișat prea jos pe mobil**
Popup-ul GDPR al chatbot-ului se afișează la baza ecranului (`items-end`), suprapunându-se cu bara de navigare. Voi schimba poziționarea la centru (`items-center`) și voi reduce padding-ul pentru a fi compact și vizibil. Butoanele "Renunță" / "Accept" vor fi complet vizibile deasupra barei de navigare.

### Detalii tehnice

| Fișier | Modificare |
|--------|-----------|
| `src/pages/Checkout.tsx` | Citire date OP din `payment_methods`, restructurare bloc auth cu beneficii, adăugare selector fizică/juridică principal |
| `src/components/LiveChat.tsx` | Fix GDPR modal positioning - `items-center` + padding bottom safe |
| `src/hooks/useRomaniaGeo.tsx` | Paginare localități (>1000 rows fix) |
| Migrare DB | Populare localități complete România, creare cupon BINEAIVENIT10 |
| Auth email templates | Scaffold + branding în română |

### Pași implementare

1. Populare localități complete pentru toate județele (migrare SQL)
2. Creare cupon BINEAIVENIT10 (migrare SQL)
3. Fix checkout: date transfer bancar din payment_methods, restructurare auth + fizică/juridică
4. Fix useRomaniaGeo paginare (Supabase limita 1000 rânduri)
5. Fix GDPR chat popup positioning
6. Setup auth email templates în română (scaffold + deploy)

