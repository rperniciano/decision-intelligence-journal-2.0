# Feature #267: List updates while on page 2 - Implementation Summary

## Category
Concurrency & Race Conditions

## Problem Statement
When a user is viewing page 2 of the History list and a new decision is added (by another user or session), the pagination can become inconsistent. With traditional offset-based pagination:
- Page 1 shows items [0-9]
- Page 2 shows items [10-19]
- New item X added at position 0
- Page 1 now shows [X, 0-8]
- Page 2 now shows [9, 10-18] ← Item 19 "disappears"!

## Solution: Cursor-Based Pagination

### Backend Changes (apps/api/src/services/decisionServiceNew.ts)

1. **Added cursor parameter support**
   - `getDecisions()` now accepts an optional `cursor` parameter (ISO timestamp)
   - When cursor is provided, uses `.lt('created_at', cursor)` instead of offset
   - Backward compatible: still supports `offset` parameter

2. **Fixed count queries**
   - Split count query from data query for better performance
   - Uses `select('id', { count: 'exact', head: true })` pattern
   - Accurate total counts now returned

3. **Added pagination metadata**
   - `nextCursor`: The `created_at` timestamp of the last item on current page
   - `hasMore`: Boolean indicating if there are more items

```typescript
return {
  decisions,
  total: count || 0,
  limit,
  offset: filters?.offset || 0,
  // Cursor-based pagination fields (Feature #267)
  nextCursor,
  hasMore,
};
```

### Frontend Changes (apps/web/src/pages/HistoryPage.tsx)

1. **Added cursor state management**
   - `pageCursors`: Map<pageNumber, cursor> - stores cursor for each page
   - `nextCursor`: The cursor returned from the last API call
   - `hasMore`: Whether there are more pages

2. **Updated fetch logic**
   - Page 1: No cursor needed (fetches newest items)
   - Page 2+: Uses cursor from previous page (`pageCursors.get(currentPage - 1)`)
   - Falls back to offset if cursor not available

3. **Smart cursor invalidation**
   - When a page's cursor changes, invalidates all subsequent page cursors
   - Ensures fresh pagination when new items are added

### API Endpoint Changes (apps/api/src/server.ts)

```typescript
const result = await DecisionService.getDecisions(userId, {
  status: query.status,
  categoryId: query.categoryId,
  search: query.search,
  limit: query.limit ? parseInt(query.limit) : 20,
  offset: query.offset ? parseInt(query.offset) : 0,
  cursor: query.cursor, // Feature #267: cursor-based pagination
});
```

## How It Works

1. **First page load**
   - GET `/api/v1/decisions?limit=10`
   - Returns: 10 decisions, `nextCursor: "2026-01-19T23:07:00.631588+00:00"`, `hasMore: true`
   - Frontend stores: `pageCursors.set(1, "2026-01-19T23:07:00.631588+00:00")`

2. **Navigate to page 2**
   - GET `/api/v1/decisions?limit=10&cursor=2026-01-19T23:07:00.631588+00:00`
   - Returns: 10 decisions created BEFORE that timestamp
   - Frontend stores: `pageCursors.set(2, nextCursor)`

3. **New decision added** (while on page 2)
   - POST `/api/v1/decisions` creates new decision
   - Page 1's cursor would change if fetched

4. **Navigate back to page 1**
   - GET `/api/v1/decisions?limit=10`
   - Returns updated cursor
   - Frontend detects cursor change, invalidates all cursors > 1
   - `pageCursors` becomes: `{1: newCursor}`

5. **Navigate to page 2 again**
   - Uses fresh cursor from updated page 1
   - Page 2 now shows correct, stable items

## Test Results

### API Test (test-cursor-pagination-f267.js)
```
✓ Page 1: 10 decisions with nextCursor
✓ Page 2 (using cursor): 10 decisions
✓ No duplicates between pages
✓ After adding new decision:
  ✓ Page 2 (using ORIGINAL cursor) is STABLE
  ✓ Same 10 decisions returned
  ✓ No items disappeared or appeared
```

### Key Benefits
1. **Pagination stability**: Items don't shift pages when new data is added
2. **Better performance**: Cursor queries are efficient with proper indexes
3. **Backward compatible**: Offset-based pagination still works
4. **Automatic recovery**: Invalidates stale cursors when page 1 changes

## Files Modified
- `apps/api/src/services/decisionServiceNew.ts` - Added cursor support
- `apps/api/src/services/decisionService.ts` - Fixed count queries
- `apps/api/src/server.ts` - Pass cursor parameter
- `apps/web/src/pages/HistoryPage.tsx` - Cursor-based pagination logic

## Status
✅ **PASSING** - Cursor-based pagination implemented and verified

Feature #267 is now complete. The pagination system handles concurrent list updates gracefully.
