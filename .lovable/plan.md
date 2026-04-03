

## Plan: Completare secțiunea Design + verificare globală sidebar

### Constatări

Am comparat toate rutele din `AdminRoutes.tsx` (467 linii, ~190 rute) cu linkurile din sidebar. Secțiunea **Design** are doar 7 elemente, dar mai multe rute și funcționalități lipsesc.

### Ce se adaugă la Design (de la 7 la ~18 elemente)

**Grup "Aspect"** (existent):
- Configurare Temă, Editor Conținut Site (deja există)
- **NOU**: Culori & Fonturi → `/admin/settings/theme#colors` (sub-secțiune temă)
- **NOU**: Favicon & Logo → `/admin/settings/theme#branding`

**Grup "Pagini & Secțiuni"** (nou):
- **NOU**: Layout Homepage → `/admin/content/homepage` (existent ca rută, lipsea din Design)
- **NOU**: Hero Slider → `/admin/content/hero-slides` (existent ca rută)
- **NOU**: Page Builder → `/admin/content/page-builder` (existent ca rută)
- **NOU**: Pagini Statice → `/admin/content/static-pages` (existent ca rută)
- **NOU**: Landing Pages → `/admin/content/landing` (existent ca rută)

**Grup "Navigare"** (nou):
- **NOU**: Meniuri → `/admin/content/menus` (existent ca rută)
- **NOU**: Breadcrumbs → `/admin/settings/breadcrumbs`
- Footer (deja există)

**Grup "Componente"** (nou):
- Centru Vizibilitate (deja există)
- Pagină 404 (deja există)
- Slider 360° (deja există)
- Configurator (deja există)
- **NOU**: Media Library → `/admin/content/media` (existent ca rută)
- **NOU**: CSS / Scripturi Custom → `/admin/content/scripts` (existent ca rută)

### Alte lipsuri găsite global

**Setări** - lipsesc din sidebar:
- Domenii → `/admin/settings/domains` (există în SettingsHub dar nu în sidebar)

**Integrări** - lipsesc:  
- Gomag Shipping → `/admin/shipping/gomag` (rută există, nu e în sidebar)

### Fișier modificat

- `src/components/admin/AdminSidebar.tsx` — secțiunea Design expandată + 2 linkuri adăugate în Setări și Integrări

### Rute noi necesare

- `/admin/settings/breadcrumbs` — componentă nouă `AdminBreadcrumbSettings` (placeholder funcțional)
- `/admin/settings/theme#branding` și `#colors` — folosesc ruta existentă cu hash navigation

Adăugare în `AdminRoutes.tsx` doar pentru ruta breadcrumbs (restul există deja).

