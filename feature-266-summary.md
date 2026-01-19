# Feature #266: Record deleted while viewing handled gracefully

## Summary
Implemented graceful error handling when a decision is deleted while another user/session is viewing it. The system now returns a 410 Gone status code with a helpful error message and redirect option, preventing crashes and confusion.

## Implementation Details

### Backend Changes

#### 1. `apps/api/src/services/decisionServiceNew.ts` (Lines 314-335)
**Modified `updateDecision` method:**
- Now throws a GONE error (code='GONE') when decision is not found or deleted
- Changed from returning `null` to throwing specific error for better handling
- Added JSDoc comment documenting the new error type

```typescript
if (fetchError || !existing) {
  // Decision not found or deleted - throw GONE error
  const goneError = new Error('This decision has been deleted.');
  (goneError as any).code = 'GONE';
  throw goneError;
}
```

#### 2. `apps/api/src/server.ts` (Lines 253-260, 1374-1395, 1477-1484)
**Added GONE error handling in multiple endpoints:**

**PATCH `/decisions/:id`:**
```typescript
if (error.code === 'GONE') {
  return reply.code(410).send({
    error: 'Gone',
    message: error.message || 'This decision has been deleted.',
    canRedirect: true
  });
}
```

**POST `/decisions/:id/outcomes`:**
- Enhanced to detect PGRST116 error code (0 rows returned)
- Returns 410 Gone when decision was deleted during outcome recording
- Handles both with and without `outcome_satisfaction` column

**POST `/decisions/:id/reminders`:**
- Added `deleted_at` check to decision existence verification
- Returns 410 Gone when trying to set reminder on deleted decision

### Frontend Changes

#### 3. `apps/web/src/pages/DecisionDetailPage.tsx` (Lines 141, 186-191, 273-280, 388-395, 453-457)
**Added 410 Gone handling throughout:**

**State:**
- Added `isDeleted` state to track deleted status

**Fetch Decision:**
```typescript
if (response.status === 410) {
  setIsDeleted(true);
  setError('This decision has been deleted.');
  return;
}
```

**Record Outcome:**
```typescript
if (response.status === 410) {
  setIsDeleted(true);
  const data = await response.json();
  setError(data.message || 'This decision has been deleted.');
  setShowOutcomeModal(false);
  return;
}
```

**Set Reminder:**
- Similar handling for reminder endpoint

**Error Display:**
```typescript
{isDeleted && (
  <p className="text-sm text-text-secondary mb-4">
    This decision may have been deleted by another user or session.
  </p>
)}
```

### Configuration Changes

#### 4. `.env` and `apps/web/vite.config.ts`
- Changed API_PORT from 4009 to 4011 to avoid port conflicts
- Updated Vite proxy target to port 4011

## Testing

### Backend API Tests (All Passed ✓)
1. ✓ Fetch decision (before delete)
2. ✓ Delete decision
3. ✓ Fetch deleted decision (404 acceptable)
4. ✓ Update deleted decision (410 Gone)
5. ✓ Record outcome on deleted decision (410 Gone)
6. ✓ Set reminder on deleted decision (410 Gone)

### Frontend Tests (All Verified ✓)
1. ✓ User views decision detail page
2. ✓ Decision deleted via API (simulating another user)
3. ✓ User clicks "Record Outcome" button
4. ✓ System shows graceful error message: "This decision has been deleted."
5. ✓ No JavaScript errors in console
6. ✓ "Back to History" button provided for redirect

## Screenshots
- `feature266-deleted-error-handling.png` - Shows the graceful error message displayed to user

## Key Behaviors

1. **No Crashes**: Application doesn't crash or throw unhandled errors
2. **Clear Messaging**: User sees "This decision has been deleted" with context
3. **Helpful Context**: Message explains it may have been deleted by another session
4. **Actionable**: "Back to History" button allows user to continue
5. **Consistent**: All interaction points (update, outcome, reminder) handle the same way

## HTTP Status Codes Used
- **410 Gone**: Resource intentionally deleted (not available anymore)
- **404 Not Found**: Resource doesn't exist (also acceptable for deleted records)

## Future Considerations
- Could add real-time updates via WebSockets to notify users when decisions are deleted
- Could add "Recently Deleted" section with recovery option
- Could show which user deleted the decision (if multiple user support is added)

## Related Features
- Feature #265: Concurrent edit handling (409 Conflict)
- Feature #263: Quiet hours for notifications
