

# Redesign Header to Match eMAG Exactly

## Key Differences (Current vs eMAG)

Based on comparing the current site screenshot with the real eMAG.ro:

1. **Search bar**: eMAG's is much wider, takes ~60% of the header width, with a flat/slightly-rounded shape (not `rounded-full`), white background with gray border, and orange search button attached to the right edge
2. **Right icons**: eMAG shows "Contul meu", "Favorite", "Coșul meu" as **horizontal inline** items (icon + text side by side), not stacked vertically with tiny text
3. **Header height**: eMAG's main row is taller (~72-76px)
4. **Logo**: eMAG logo is bigger and bolder
5. **Nav bar**: eMAG uses a hamburger "☰ Produse" button (not "Toate Produsele" with Grid3X3), followed by text links like "Ofertele eMAG", "Genius", etc.

## Changes to `src/components/layout/Header.tsx`

### Main header row
- Increase height to `h-[76px]`
- Make search bar wider: `max-w-3xl` instead of `max-w-2xl`, change input from `rounded-full` to `rounded-lg`, white bg with gray border, taller `h-12`
- Right icons: switch from vertical stacked layout to **horizontal inline** (`flex-row items-center gap-1.5`) with text beside icon, matching eMAG's "Contul meu ▾", "Favorite", "Coșul meu"
- Make logo text larger: `text-2xl md:text-[28px]`

### Nav bar
- Change "Toate Produsele" button icon from `Grid3X3` to `Menu` (hamburger), rename to "Produse"
- Make nav links match eMAG style: first link colored orange ("Oferte MamaLucica"), rest in dark text

### Search bar styling
- Remove `rounded-full`, use `rounded-lg` with a visible orange search button flush on the right
- Input background: white with `border-gray-300`

## File: `src/components/layout/Header.tsx`
Single file change — all modifications are within the header component.

