

# Plan: Add React Error Boundaries

## Overview

Create a reusable `ErrorBoundary` class component (React error boundaries require class components) and wrap each route's page element with it. This isolates crashes so one page failing doesn't take down the whole app.

## Files to Create

### `src/components/ErrorBoundary.tsx`
- Class component implementing `componentDidCatch` and `getDerivedStateFromError`
- Logs error + errorInfo to `console.error`
- Optionally logs to `error_logs` table via Supabase (fire-and-forget, no crash if DB fails)
- Renders a friendly fallback UI with a "Refresh" button
- Accepts optional `fallback` prop for custom fallback UI

## Files to Modify

### `src/App.tsx`
- Import `ErrorBoundary`
- Wrap each `<Route>` element with `<ErrorBoundary>`: e.g. `element={<ErrorBoundary><Index /></ErrorBoundary>}`
- Also wrap the entire `<Routes>` block in a top-level `ErrorBoundary` as a safety net

No existing page logic is changed — only wrapping elements in the router.

