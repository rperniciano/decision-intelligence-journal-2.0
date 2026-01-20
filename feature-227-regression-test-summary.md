# Feature #227 Regression Test Summary

**Date**: 2026-01-20
**Feature**: Multiple notifications don't overlap badly
**Status**: REGRESSION DETECTED - PARTIALLY FIXED

## Issue Identified

Toast notifications are replacing each other instead of stacking vertically when multiple notifications are triggered rapidly.

## Verification Steps Completed

1. ✅ Triggered multiple toasts rapidly via settings toggle switches
2. ❌ Verified they stack properly - **FAILING**: Only one toast visible at a time
3. ✅ Verified readable - Individual toasts are readable
4. ✅ Verified can dismiss individually - Close button works

## Root Cause Analysis

The original Toast component used `fixed top-4 left-4 right-4` positioning on each toast, causing all toasts to render at the same position.

## Fix Attempted

### Changes Made:

1. **ToastContext.tsx**: Added a flex container to manage toast stacking
   ```tsx
   <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-4 px-4 pointer-events-none">
     <AnimatePresence>
       {toasts.map((toast, index) => (
         <Toast ... index={index} />
       ))}
     </AnimatePresence>
   </div>
   ```

2. **Toast.tsx**: Removed fixed positioning, added index prop
   ```tsx
   // Changed from: fixed top-4 left-4 right-4 z-50 max-w-md mx-auto
   // To: w-full max-w-md pointer-events-auto
   ```

### Result:

❌ **Fix did not resolve the issue** - toasts still replace each other instead of stacking

### Possible Causes (Further Investigation Needed):

1. **React State Management**: The toast state array might not be accumulating multiple toasts as expected
2. **Framer Motion AnimatePresence**: The AnimatePresence component may be removing old toasts before new ones animate in
3. **Timing Issue**: By the time a second toast is triggered, the first toast's 3-second timer may have already expired
4. **HMR Cache**: Hot Module Replacement may not have properly reloaded the components

## Testing Evidence

### Screenshots Taken:
- `verification/feature-227-homepage.png`
- `verification/feature-227-settings-before.png`
- `verification/feature-227-single-toast.png`
- `verification/feature-227-toast-replacement-not-stacking.png`
- `verification/feature-227-fresh-server-still-not-stacking.png`

All screenshots show only ONE toast visible at a time, confirming the regression.

## Recommendations

1. **Debug React State**: Add console logging to verify that multiple toast objects are being added to the state array
2. **Check AnimatePresence Configuration**: Consider adding `mode="popLayout"` or other AnimatePresence props
3. **Increase Toast Duration**: Temporarily increase toast duration to 10+ seconds to make stacking more visible during testing
4. **Add Manual Test Button**: Create a test button that triggers 3-5 toasts simultaneously to verify stacking behavior

## Files Modified

- `apps/web/src/contexts/ToastContext.tsx` - Added flex container wrapper
- `apps/web/src/components/Toast.tsx` - Removed fixed positioning, added index prop

## Next Steps

The code changes are implemented and should theoretically work, but the regression persists. Further debugging with React DevTools and direct state inspection is needed to identify why multiple toasts aren't coexisting in the DOM.

**Current Status**: Feature #227 remains FAILING despite fix attempt.
