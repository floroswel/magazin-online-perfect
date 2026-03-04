

# Plan: Fix render-time `navigate()` in Admin.tsx

## Problem
Line 33 calls `navigate("/auth")` directly during render, which is a side effect in the render phase — React warns about this and it can cause unpredictable behavior.

## Fix
Add a `useEffect` that watches `user`, `authLoading`, and `adminLoading`. When loading is done and `user` is null, call `navigate("/auth")`. The early return at line 32-35 changes to just `return null` (while the effect handles the redirect).

## Changes

### `src/App.tsx` — no changes
### `src/pages/Admin.tsx` — single change

- Add `useEffect` import
- Add effect:
  ```tsx
  useEffect(() => {
    if (!authLoading && !adminLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, adminLoading, navigate]);
  ```
- Change lines 32-35 from `if (!user) { navigate("/auth"); return null; }` to `if (!user) { return null; }`

## Other files
Checked all `navigate()` calls in `src/pages/` — Auth, Checkout, ResetPassword all call navigate inside event handlers only. No other instances of this pattern.

