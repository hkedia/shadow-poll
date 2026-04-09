---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app.tsx
  - components/mobile-drawer.tsx
  - src/components/scroll-to-top.tsx
autonomous: true
requirements: [UX-01, UX-02]
must_haves:
  truths:
    - "Navigating to any page scrolls the viewport to the top"
    - "Tapping a nav link in the mobile hamburger menu closes the menu drawer"
    - "Closing the menu does not interfere with navigation"
  artifacts:
    - path: "src/components/scroll-to-top.tsx"
      provides: "ScrollToTop component that scrolls window to top on route change"
      min_lines: 10
    - path: "src/app.tsx"
      provides: "App with ScrollToTop rendered in component tree"
      contains: "ScrollToTop"
    - path: "components/mobile-drawer.tsx"
      provides: "MobileDrawer with controlled open state that auto-closes on navigation"
      contains: "onOpenChange"
  key_links:
    - from: "src/app.tsx"
      to: "src/components/scroll-to-top.tsx"
      via: "import and render ScrollToTop inside BrowserRouter"
      pattern: "ScrollToTop"
    - from: "components/mobile-drawer.tsx"
      to: "react-router useLocation"
      via: "useEffect on pathname change to close drawer"
      pattern: "useEffect.*pathname"
---

<objective>
Fix two UX issues on page navigation:
1. Page does not scroll to top when navigating between routes
2. Mobile hamburger menu (Sheet drawer) stays open after tapping a navigation link

Purpose: Users expect to land at the top of a new page and expect the hamburger menu to dismiss once they've chosen a destination.
Output: Two behavioral fixes — scroll restoration and auto-dismiss drawer.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@src/app.tsx
@components/header.tsx
@components/header-nav.tsx
@components/mobile-drawer.tsx
@components/ui/sheet.tsx
@src/main.tsx

<interfaces>
From react-router (used throughout app):
```typescript
// react-router v7 with BrowserRouter pattern
import { Link, useLocation } from "react-router";
// useLocation() returns { pathname, search, hash, state, key }
// No ScrollRestoration available — BrowserRouter is not a data router
```

From components/ui/sheet.tsx:
```typescript
// Sheet is Radix Dialog primitive (SheetPrimitive = @radix-ui/react-dialog)
// Sheet = SheetPrimitive.Root  — supports open/onOpenChange controlled props
// SheetTrigger = SheetPrimitive.Trigger
// SheetClose = SheetPrimitive.Close
// SheetContent renders SheetPortal + SheetOverlay + SheetPrimitive.Content
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add ScrollToTop component and wire into App</name>
  <files>src/components/scroll-to-top.tsx, src/app.tsx</files>
  <action>
Create `src/components/scroll-to-top.tsx`:
- Named export `ScrollToTop`
- Uses `useLocation()` from `react-router` to get `pathname`
- `useEffect` that calls `window.scrollTo(0, 0)` whenever `pathname` changes
- Returns `null` (renderless component)

Wire into `src/app.tsx`:
- Import `ScrollToTop` from `@/src/components/scroll-to-top`
- Place `<ScrollToTop />` inside the `<BrowserRouter>` tree — it must be a descendant of the Router. Since `BrowserRouter` wraps `<App />` in `main.tsx`, place `<ScrollToTop />` as the first child inside `<QueryProvider>` in `App()` (inside the router context).

Important: ScrollToTop must be rendered INSIDE the router context. In `main.tsx`, `<BrowserRouter>` wraps `<App />`, so any component rendered by App is already inside the router context.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && grep -q "ScrollToTop" src/app.tsx && grep -q "window.scrollTo" src/components/scroll-to-top.tsx && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - `src/components/scroll-to-top.tsx` exists and exports `ScrollToTop` component
    - `src/app.tsx` imports and renders `<ScrollToTop />` inside the router context
    - Navigating to any route scrolls viewport to top
  </done>
</task>

<task type="auto">
  <name>Task 2: Make MobileDrawer auto-dismiss on navigation</name>
  <files>components/mobile-drawer.tsx</files>
  <action>
Modify `components/mobile-drawer.tsx`:
1. Add `useState` import from `react` — `import { useState, useEffect } from "react"`
2. Add controlled state: `const [isOpen, setIsOpen] = useState(false)`
3. Pass controlled props to `<Sheet>`: `<Sheet open={isOpen} onOpenChange={setIsOpen}>`
4. Add `useEffect` that watches `pathname` and calls `setIsOpen(false)` when it changes — this closes the drawer on navigation
5. Keep all existing styling, icon, and link structure unchanged

The key insight: Radix Dialog (which Sheet wraps) supports `open` and `onOpenChange` props for controlled usage. By making the Sheet controlled, we can imperatively close it when the route changes.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && grep -q "isOpen" components/mobile-drawer.tsx && grep -q "onOpenChange" components/mobile-drawer.tsx && grep -q "useEffect" components/mobile-drawer.tsx && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - MobileDrawer uses controlled `open`/`onOpenChange` state on `<Sheet>`
    - Tapping any navigation link in the mobile menu closes the drawer
    - Hamburger button still opens the drawer correctly
    - X button and overlay click still close the drawer correctly
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| N/A | No trust boundary changes — both fixes are client-only UX tweaks with no data flow impact |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | N/A | N/A | accept | No security-relevant changes — scroll restoration and menu dismiss are pure client-side UX |
</threat_model>

<verification>
1. Start dev server: `bun run dev`
2. Navigate between pages — each page should load scrolled to top
3. Open mobile hamburger menu, tap any nav link — menu should close and page should scroll to top
4. Close menu via X button — should still work
5. Close menu by clicking overlay — should still work
6. Desktop navigation should be unaffected
</verification>

<success_criteria>
- Navigating between routes always scrolls to top
- Mobile hamburger menu auto-dismisses on link click
- Desktop nav and menu open/close still function correctly
</success_criteria>

<output>
After completion, create `.planning/quick/260409-rnc-fix-scroll-to-top-on-page-navigation-and/260409-rnc-SUMMARY.md`
</output>