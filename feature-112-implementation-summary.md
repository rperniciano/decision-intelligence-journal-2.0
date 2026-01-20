# Feature #112 Implementation Summary

## Feature: AI extraction failure shows partial results

### Requirements Met

1. **Partial results shown with confidence warning** ✅
   - When AI extraction fails or has low confidence, partial results are still displayed
   - Low confidence (0.2) is returned when extraction completely fails
   - Users see what data was extracted, even if incomplete

2. **Confidence warning with severity levels** ✅
   - **< 0.3 (Red)**: "AI extraction had significant difficulties. The audio may have been unclear or incomplete."
   - **0.3-0.5 (Red)**: "AI extraction partially failed. Some information may be missing or incorrect."
   - **0.5-0.8 (Amber)**: "I'm not 100% sure I understood everything correctly."
   - **>= 0.8**: No warning (good extraction)

3. **Editing available to fix** ✅
   - All fields are editable in the DecisionExtractionCard:
     - Title (input field)
     - Options (name, pros, cons - all editable)
     - Emotional State (emoji picker)
     - Category (dropdown)
   - Users can correct any mistakes in the partial extraction

4. **Options to re-process or enter manually** ✅
   - For confidence < 0.5, two buttons are shown:
     - "Enter Manually" - navigates to /decisions/new
     - "Re-record" - navigates back to recording page
   - Users can choose their preferred recovery method

### Code Changes

#### Backend (apps/api)

**1. voiceService.ts - Enhanced extraction with partial results**
```typescript
// Enhanced prompt with confidence scoring guidelines
// Returns partial results instead of throwing errors
// Ensures at least minimal data structure (1 empty option)
// Returns confidence: 0.2 when extraction fails
```

**2. asyncVoiceService.ts - Store confidence value**
```typescript
// Added ai_confidence to decision creation payload
// Process completes even with low confidence (doesn't mark as failed)
```

**3. decisionServiceNew.ts - Persist confidence**
```typescript
// Added ai_confidence field to decision insert
// Confidence is stored in database for display
```

#### Frontend (apps/web)

**4. DecisionExtractionCard.tsx - Confidence warning UI**
```typescript
// Displays warning when confidence < 0.8
// Different colors for different severity levels (red/amber)
// Shows action buttons for low confidence (< 0.5)
// All fields remain editable
```

**5. ExtractionReviewPage.tsx - Read stored confidence**
```typescript
// Reads ai_confidence from decision data
// Passes confidence to DecisionExtractionCard
// Falls back to 0.8 if not stored (backward compatibility)
```

### Testing Approach

To test this feature:

1. **Test low confidence scenario**:
   - Create a decision with `ai_confidence: 0.3`
   - Verify red warning appears
   - Verify "Enter Manually" and "Re-record" buttons appear
   - Verify all fields are editable

2. **Test medium confidence scenario**:
   - Create a decision with `ai_confidence: 0.6`
   - Verify amber warning appears
   - Verify no action buttons (still decent extraction)
   - Verify all fields are editable

3. **Test high confidence scenario**:
   - Create a decision with `ai_confidence: 0.9`
   - Verify no warning appears
   - Verify normal display

4. **Test extraction failure**:
   - When OpenAI API fails/crashes
   - Verify partial result with confidence 0.2 is returned
   - Verify decision is still created
   - Verify red warning + recovery options

### User Experience

**Before**: If AI extraction failed, users got an error and had to start over completely.

**After**: Users get:
1. Partial results (better than nothing!)
2. Clear warning about extraction quality
3. Ability to edit and fix the partial data
4. Options to enter manually or re-record if needed

This provides a much better user experience and prevents data loss.

### Status

✅ **Feature #112 is FULLY IMPLEMENTED**

All requirements met:
- Partial results shown with confidence warning ✓
- Confidence levels affect warning severity ✓
- Editing available to fix extraction ✓
- "Enter Manually" button shown for low confidence ✓
- "Re-record" button shown for low confidence ✓
