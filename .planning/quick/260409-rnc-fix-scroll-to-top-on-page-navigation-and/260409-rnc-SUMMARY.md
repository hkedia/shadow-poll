---
phase: quick
plan: 01
name: fix-scroll-to-top-on-page-navigation-and-mobile-drawer-dismiss
subsystem: frontend-ux
tags: [ux, scroll-restoration, mobile-nav, react-router]
dependency_graph:
  requires: [react-router]
  provides: [scroll-to-top, auto-dismiss-drawer]
  affects: [app-root, mobile-navigation]
tech_stack:
  added: [react-router useLocation + useEffect]
  patterns: [renderless component, controlled sheet]
key_files:
  created:
    - src/components/scroll-to-top.tsx
  modified:
    - src/app.tsx
    - components/mobile-drawer.tsx
decisions:
  - D-quick-01: Renderless ScrollToTop component pattern (returns null) over React Router ScrollRestoration since BrowserRouter is not a data router
  - D-quick-02: Controlled Sheet with open/onOpenChange state to enable programmatic close on route change
metrics:
  duration: 2min
  completed: 2026-04-09
---

# Phase Quick Plan 01: Fix scroll-to-top and mobile drawer dismiss Summary

Scroll restoration via renderless ScrollToTop component + controlled Sheet drawer that auto-closes on navigation.

## Changes Made

### Task 1: Add ScrollToTop component and wire into App
- Created `src/components/scroll-to-top.tsx` — renderless component using `useLocation().pathname` + `useEffect` → `window.scrollTo(0, 0)`
- Wired `<ScrollToTop />` into `src/app.tsx` inside `<QueryProvider>` (within BrowserRouter context)
- **Commit:** 2682725

### Task 2: Make MobileDrawer auto-dismiss on navigation
- Modified `components/mobile-drawer.tsx` to use controlled Sheet with `open={isOpen} onOpenChange={setIsOpen}`
- Added `useState(false)` for `isOpen` state
- Added `useEffect` watching `pathname` that calls `setIsOpen(false)` to close drawer on route change
- **Commit:** 35ed7f8

## Verification Results

- `ScrollToTop` component exists and exports named function
- `src/app.tsx` imports and renders `<ScrollToTop />`
- `mobile-drawer.tsx` uses `isOpen`, `onOpenChange`, and `useEffect`
- All commits verified present in git log

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files created/modified exist on disk. All commits present in git log.