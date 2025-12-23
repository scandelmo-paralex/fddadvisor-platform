# Mobile Responsiveness Regression Test Checklist

**Date:** December 23, 2025  
**Changes Tested:** Mobile consent modal, AI chat positioning, FDD Viewer sidebar, Item 23 modal  
**Testing Devices:** Chrome DevTools (iPhone 12 Pro, iPad), Physical iPhone (if available)

---

## Pre-Test Setup

- [ ] Run `pnpm dev` to start local development server
- [ ] Open Chrome DevTools (F12 or Cmd+Option+I)
- [ ] Toggle Device Toolbar (Cmd+Shift+M)
- [ ] Select iPhone 12 Pro (390x844) as test device
- [ ] Clear browser cache/cookies for clean test

---

## Test 1: Tracking Consent Modal (CRITICAL - Was blocking signup)

**Component:** `components/tracking-consent-modal.tsx`  
**Test URL:** Navigate to buyer signup flow with FDD invitation

### Mobile Tests (iPhone viewport)
- [ ] Modal appears centered on screen
- [ ] Modal does NOT extend beyond viewport
- [ ] Content is scrollable within modal
- [ ] "Continue to FDD" button is VISIBLE without scrolling OR accessible by scrolling
- [ ] Checkbox is tappable and toggles correctly
- [ ] "Continue to FDD" button is disabled until checkbox is checked
- [ ] "Continue to FDD" button works when enabled
- [ ] "Decline" button is visible and functional
- [ ] X close button works
- [ ] Backdrop click closes modal (if applicable)

### Desktop Tests (resize to 1280px+)
- [ ] Modal still centered and properly sized
- [ ] All functionality works same as before changes
- [ ] No visual regression

---

## Test 2: AI Chat Button & Panel

**Component:** `components/fdd-ai-chat.tsx`  
**Test URL:** `/hub/buyer/fdd/[any-franchise-slug]`

### Mobile Tests (iPhone viewport)
- [ ] AI Chat button appears at BOTTOM CENTER of screen
- [ ] Button is smaller (h-14 w-14) and doesn't overlap other UI
- [ ] Button is NOT obscured by navigation bars
- [ ] Tapping button opens chat panel
- [ ] Chat panel opens FULL SCREEN on mobile
- [ ] Chat header with title and close button visible
- [ ] Messages area scrollable
- [ ] Input field and send button at bottom
- [ ] Input field not obscured by keyboard (when typing)
- [ ] X button closes chat and returns to normal view
- [ ] Suggested questions tappable
- [ ] Source buttons (e.g., "Item 7, Page 23") work and close chat on mobile

### Desktop Tests (resize to 1280px+)
- [ ] AI Chat button appears at BOTTOM RIGHT (original position)
- [ ] Button is larger (h-20 w-20)
- [ ] Chat panel opens as positioned card (not full screen)
- [ ] Chat panel positioned bottom-right
- [ ] All chat functionality works as before
- [ ] No visual regression

---

## Test 3: FDD Viewer Sidebar

**Component:** `components/fdd-viewer.tsx`  
**Test URL:** `/hub/buyer/fdd/[any-franchise-slug]`

### Mobile Tests (iPhone viewport)
- [ ] PDF viewer takes FULL WIDTH (no sidebar visible)
- [ ] Menu button (☰) appears in top-right area
- [ ] Menu button is tappable and not obscured
- [ ] Tapping menu button opens sidebar as OVERLAY from right
- [ ] Sidebar covers ~85% of screen width
- [ ] Dark backdrop appears behind sidebar
- [ ] Sidebar has "FDD Navigation" header with X close button
- [ ] Sidebar content is scrollable (navigation, notes, etc.)
- [ ] Tapping backdrop closes sidebar
- [ ] X button closes sidebar
- [ ] Item dropdown navigation works
- [ ] Exhibit dropdown navigation works
- [ ] Quick navigation buttons work
- [ ] After selecting an item, sidebar closes and PDF navigates to page

### Desktop Tests (resize to 1280px+)
- [ ] ResizableDivider shows PDF on left, sidebar on right
- [ ] Divider is draggable to resize panels
- [ ] Toggle button (chevron) hides/shows PDF
- [ ] All sidebar functionality works
- [ ] No visual regression from original design
- [ ] Notes panel functional
- [ ] Engagement progress visible

---

## Test 4: Item 23 Receipt Modal (DocuSeal)

**Component:** `components/item-23-receipt-modal-docuseal.tsx`  
**Test URL:** Buyer flow when signing receipt

### Mobile Tests (iPhone viewport)
- [ ] Modal opens FULL SCREEN
- [ ] Header with franchise name visible
- [ ] DocuSeal form loads and is scrollable
- [ ] Signature area accessible
- [ ] Submit button reachable
- [ ] Modal can be closed

### Desktop Tests (resize to 1280px+)
- [ ] Modal opens as large card (95vw x 95vh)
- [ ] Rounded corners visible
- [ ] All functionality works as before

---

## Test 5: General Navigation & Flow (End-to-End)

**Complete Buyer Journey Test:**

### Mobile
1. [ ] Receive/open invitation email link
2. [ ] Signup form displays correctly
3. [ ] Signup form submits successfully
4. [ ] Redirected to MyFDDs page
5. [ ] FDD card displays correctly
6. [ ] "Give Consent" opens consent modal
7. [ ] Consent modal is scrollable, button accessible
8. [ ] After consent, receipt signing works
9. [ ] "View FDD" opens FDD Viewer
10. [ ] PDF loads and is viewable
11. [ ] Menu button opens navigation sidebar
12. [ ] Can navigate to different Items
13. [ ] AI Chat button is accessible (not overlapping)
14. [ ] AI Chat opens full screen
15. [ ] Can ask questions and get responses
16. [ ] Can navigate to source pages from chat

### Desktop
1. [ ] All above flows work on desktop
2. [ ] No functionality lost from changes
3. [ ] Layouts match expected desktop design

---

## Test 6: Cross-Browser (if time permits)

- [ ] Chrome mobile emulator
- [ ] Safari (actual iPhone if available)
- [ ] Firefox mobile emulator

---

## Test 7: Edge Cases

- [ ] Very long franchise name in modals (truncation?)
- [ ] Landscape orientation on mobile
- [ ] iPad/tablet viewport (768px-1024px)
- [ ] Very small screen (320px width - iPhone SE)
- [ ] Dark mode (if applicable)

---

## Issues Found

| # | Component | Description | Severity | Status |
|---|-----------|-------------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Sign-Off

- [ ] All critical tests pass
- [ ] No P0/P1 regressions found
- [ ] Ready for deployment

**Tested By:** _______________  
**Date:** _______________
