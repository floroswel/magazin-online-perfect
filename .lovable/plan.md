

# Make All CTA Buttons Bigger & Bolder (eMAG-style)

## Changes

### 1. Global Button Component (`src/components/ui/button.tsx`)
- Increase base font weight to `font-bold`
- Change default variant hover to `hover:bg-secondary hover:shadow-md`
- Make `default` size taller: `h-12 px-6 py-3 text-[15px]`
- Make `lg` size even bigger: `h-14 px-10 text-base`
- Add `rounded-lg` to base instead of `rounded-md`
- Increase icon size to `[&_svg]:size-5`

### 2. ProductCard "Adaugă în coș" button (`src/components/products/ProductCard.tsx`)
- Increase height from `h-10 min-h-[44px]` to `h-12 min-h-[48px]`
- Increase font size from `text-[13px]` to `text-sm`
- Add `font-extrabold uppercase tracking-wide`
- Increase icon size from `h-4 w-4` to `h-5 w-5`

### 3. Hero CTA button (`src/components/home/HeroSlider.tsx`)
- Increase from `px-8 py-3.5 text-sm min-h-[48px]` to `px-10 py-4 text-base min-h-[52px]`
- Add `font-extrabold`

### 4. Cross-sell/recommendation buttons (`CartCrossSell.tsx`, `CartRecommendations.tsx`, `UpgradeRecommendation.tsx`)
- Increase small "Adaugă" buttons from `h-7 text-xs px-2` to `h-9 text-sm px-3 font-bold`
- Make upgrade CTA button bolder with `text-base font-extrabold h-12`

### 5. ProductDetail page (`src/pages/ProductDetail.tsx`)
- The main "Adaugă în coș" button already uses `size="lg"` — will benefit from the global `lg` size increase

**Files to modify**: `button.tsx`, `ProductCard.tsx`, `HeroSlider.tsx`, `CartCrossSell.tsx`, `CartRecommendations.tsx`, `UpgradeRecommendation.tsx`

