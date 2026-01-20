# Feature #129 Regression Test Summary

**Date:** 2026-01-20
**Feature:** Filter parameters sent to API correctly
**Status:** ✅ PASSING - No regressions found

## Verification Steps Tested

### 1. Apply filters on History page ✅
- Status filters (All, In Progress, Decided, Trash)
- Outcome filters (All Outcomes, Better, As Expected, Worse)
- Category filter (dropdown with categories)
- Time Period filter (All Time, Today, This Week, This Month, Custom Range)

### 2. Monitor Network tab ✅
Verified that filter parameters are included in API requests

### 3. Verify GET request includes filter params ✅

**Status Filter:**
- UI URL: `?filter=decided`
- API Request: `GET /api/v1/decisions?status=decided&sort=date_desc&limit=10`
- ✅ Correctly translates `filter` URL param to `status` API param

**Outcome Filter:**
- UI URL: `?outcome=better`
- API Request: `GET /api/v1/decisions?outcome=better&sort=date_desc&limit=10`
- ✅ Correctly sends `outcome` parameter to API

**Category Filter:**
- UI URL: `?category=<UUID>`
- API Request: `GET /api/v1/decisions?category=<UUID>&sort=date_desc&limit=10`
- ✅ Correctly sends category ID to API

**Time Filter:**
- UI URL: `?time=this_week`
- API Request: `GET /api/v1/decisions?sort=date_desc&limit=10`
- Note: Time filters (today/this_week/this_month) are intentionally filtered **client-side** to respect user's timezone
- Custom date range sends `fromDate` and `toDate` to backend
- ✅ Working as designed

**Combined Filters:**
- UI URL: `?outcome=better&filter=in_progress`
- API Request: `GET /api/v1/decisions?status=in_progress&outcome=better&sort=date_desc&limit=10`
- ✅ Multiple filter parameters correctly combined

### 4. Verify results match filter criteria ✅
- When "Better" outcome selected: only decisions with outcome="better" shown
- When "Decided" status selected: only decisions with status="decided" shown
- When "Career" category selected: only decisions in that category shown
- When conflicting filters (in_progress + better): empty results (correct behavior)

### 5. Verify filter persistence in URL ✅
- URL updates correctly when filters applied
- Can bookmark filtered URLs
- Browser back/forward works with filter state
- Page refresh maintains filter selection

## Screenshots

1. `f129-history-page-before-filter.png` - History page with all decisions
2. `f129-history-page-after-better-filter.png` - After applying "Better" outcome filter
3. `f129-status-filter-working.png` - Status filter showing "Decided" tab active

## Test Data

**User:** f129-test-regression@example.com
**Password:** test123456
**Test Decisions Created:** 5
- F129 Another Career Decision (decided, better outcome)
- F129 Relationship Decision (decided, better outcome)
- F129 Health Decision (decided, worse outcome)
- F129 Career Decision (decided, better outcome)
- F129 Finance Decision (deliberating, no outcome)

## Code Analysis

**File:** `apps/web/src/pages/HistoryPage.tsx`

**Key Findings:**
- Lines 666-723: Filter parameters correctly built and sent to API
- Lines 804-818: Time-based filtering done client-side for timezone accuracy
- Status filter translates URL param `filter` to API param `status`
- Outcome, category, and search filters sent directly to API

## Conclusion

Feature #129 is **WORKING CORRECTLY**. All filter parameters are being sent to the API as expected, with the intentional design decision to handle time-based filters client-side for timezone accuracy. No regressions found.

**Test Duration:** ~15 minutes
**Browser:** Playwright (Chromium)
**Console Errors:** 0
**API Failures:** 0
**Result:** ✅ PASS
