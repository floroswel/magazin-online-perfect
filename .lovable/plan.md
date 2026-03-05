

## AI-Powered Product Content Generator — Implementation Plan

**Important note**: The request mentions using Anthropic Claude API, but this project runs on Lovable Cloud which provides built-in AI capabilities via the Lovable AI Gateway (already used by the existing `generate-description` function). This is the preferred approach — no additional API keys needed. I will use `google/gemini-3-flash-preview` as it provides excellent results for content generation tasks.

---

### 1. Upgrade Edge Function: `generate-description` → `generate-product-content`

Rename and expand the existing edge function to accept additional parameters and return **all 5 content pieces** in a single call using tool calling for structured output:

- **Input**: `name`, `brand`, `category`, `specs`, `key_features` (textarea text), `target_audience` (General/Men/Women/Children/Professionals/Seniors), `tone` (Professional/Friendly/Persuasive/Minimal), `language` (ro/en)
- **Output** (structured via tool calling):
  - `description` — rich HTML, 150-300 words with bullet points
  - `short_description` — 1-2 sentences, max 160 chars
  - `meta_title` — max 60 chars
  - `meta_description` — max 160 chars
  - `tags` — array of 5-8 strings

### 2. New Edge Function: `extract-attributes`

- Takes product description text
- Returns array of `{ key, value }` pairs (e.g., Material: Oțel inoxidabil)
- Uses tool calling for structured extraction

### 3. New Component: `AIGeneratorModal.tsx`

A reusable modal component with:
- Pre-filled product name from form
- Key specifications textarea
- Target audience dropdown (6 options)
- Tone dropdown (4 options)
- Language dropdown (RO/EN)
- Generate button → shows loading state
- Results panel showing all 5 generated items side-by-side with current values
- Per-field "Apply" buttons + "Apply All" button
- "Regenerate" button
- Editable text areas for each generated field before applying

### 4. Modify `AdminProducts.tsx` — Product Wizard Integration

- **Step 0 (Basic Info)**: Add "Generate with AI ✨" buttons next to Description and Short Description fields. Replace the existing simple AI generate button.
- **Step 6 (SEO)**: Add "Generate with AI ✨" buttons next to Meta Title and Meta Description fields.
- Add "Extract attributes from description ✨" button in the Specs section (Step 0).
- All buttons open the `AIGeneratorModal` which passes results back via callbacks.

### 5. Bulk AI Generator in Product List

The existing `AdminAIGenerator.tsx` already handles bulk generation. I will:
- Add a bulk action button in the product list header (visible when products are selected)
- Wire it to open the existing bulk generator or run inline with progress bar
- Update the bulk generator to use the new expanded edge function

### 6. Attribute Extractor

- Separate button in Step 0 specs section: "Extract attributes from description ✨"
- Calls `extract-attributes` edge function
- Shows suggested key-value pairs in a review dialog
- Admin can toggle on/off individual suggestions before applying to the specs field

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/components/admin/products/AIGeneratorModal.tsx` |
| Create | `supabase/functions/generate-product-content/index.ts` |
| Create | `supabase/functions/extract-attributes/index.ts` |
| Modify | `src/components/admin/AdminProducts.tsx` — add AI buttons + modal integration |
| Modify | `supabase/config.toml` — register new edge functions (verify_jwt = false) |

No database changes needed. No breaking changes to existing features.

