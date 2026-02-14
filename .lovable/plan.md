

# Magazin Online tip eMAG.ro

## 1. Pagina Principală (Homepage)
- **Header** cu logo, bară de căutare, iconițe cont/coș/favorite, și număr de produse în coș
- **Bară de navigare** cu categorii de produse (Electronice, Electrocasnice, Telefoane, Laptopuri, TV, Casă & Grădină, Fashion, Sport, etc.)
- **Banner slider** cu promoții și oferte
- **Secțiuni de produse**: Produse recomandate, Cele mai vândute, Oferte ale zilei
- **Footer** cu linkuri utile, informații contact, social media

## 2. Catalog & Filtrare Produse
- **Pagină de categorie** cu grid de produse (imagine, titlu, preț, rating cu stele, buton Adaugă în coș)
- **Filtre laterale**: preț (slider), brand, rating, disponibilitate, alte caracteristici
- **Sortare**: preț crescător/descrescător, cele mai populare, cele mai noi, cele mai bine evaluate
- **Paginare** sau încărcare infinită

## 3. Pagina de Produs
- **Galerie de imagini** cu thumbnail-uri
- **Detalii produs**: titlu, preț, descriere, specificații tehnice într-un tabel
- **Selector cantitate** și buton „Adaugă în coș"
- **Buton Favorite** (adaugă la wishlist)
- **Secțiune Recenzii** cu rating stele și comentarii
- **Produse similare** la final

## 4. Coș de Cumpărături
- **Lista produselor** din coș cu imagine, titlu, preț, cantitate editabilă
- **Ștergere produs** din coș
- **Sumar comandă**: subtotal, livrare, total
- **Buton „Finalizează comanda"**

## 5. Checkout
- **Formular de livrare**: nume, adresă, telefon, email
- **Metodă de plată**: selectare (ramburs / card)
- **Rezumat comandă** înainte de confirmare
- **Pagina de confirmare** după plasarea comenzii

## 6. Autentificare & Conturi Utilizatori
- **Înregistrare** cu email și parolă
- **Autentificare** (login/logout)
- **Pagina Contul Meu** cu:
  - Istoric comenzi cu status
  - Adrese salvate
  - Lista de favorite (wishlist)
  - Editare profil

## 7. Backend (Supabase)
- **Bază de date** cu tabele: produse, categorii, utilizatori (profiles), comenzi, articole comandă, recenzii, favorite
- **Autentificare** via Supabase Auth
- **Row Level Security** pentru securitate
- **Căutare** produse cu filtrare server-side

## 8. Design & Stil
- **Paleta de culori** inspirată de eMAG: fundal galben-portocaliu pentru header, butoane roșii pentru CTA, fundal alb/gri deschis
- **Layout** cu sidebar filtre + grid produse
- **Design responsive** – funcționează pe desktop și mobil
- **Iconițe** pentru coș, cont, favorite, căutare

## Ordinea implementării
1. Structura de baze de date și autentificare
2. Header, navigare și footer
3. Pagina principală cu bannere și secțiuni de produse
4. Catalog cu filtre și sortare
5. Pagina de produs
6. Coș de cumpărături
7. Checkout și plasare comandă
8. Contul utilizatorului și istoric comenzi

