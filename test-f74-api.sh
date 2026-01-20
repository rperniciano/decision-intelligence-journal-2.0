#!/bin/bash

# Feature #74 Test: Verify remind_at uses exact specified date

echo "=== Feature #74: Reminder scheduled at specified time ==="
echo ""

# Get auth token
echo "1. Getting auth token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feature74-test-1768911330512@example.com","password":"test123456"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✓ Got auth token"
echo ""

# Create a decision
echo "2. Creating test decision..."
UNIQUE_ID="F74_TEST_$(date +%s)"
DECISION_RESPONSE=$(curl -s -X POST http://localhost:4001/api/v1/decisions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Feature 74 Test - $UNIQUE_ID\",
    \"status\": \"decided\",
    \"category\": \"Testing\",
    \"emotional_state\": \"Calm\",
    \"options\": [
      {\"id\": \"opt-1\", \"text\": \"Option A\", \"pros\": [], \"cons\": [], \"isChosen\": true},
      {\"id\": \"opt-2\", \"text\": \"Option B\", \"pros\": [], \"cons\": [], \"isChosen\": false}
    ],
    \"notes\": \"Testing remind_at uses exact specified date. Unique ID: $UNIQUE_ID\"
  }")

DECISION_ID=$(echo $DECISION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$DECISION_ID" ]; then
  echo "❌ Failed to create decision"
  echo "Response: $DECISION_RESPONSE"
  exit 1
fi

echo "✓ Decision ID: $DECISION_ID"
echo ""

# Create reminder with SPECIFIC date
echo "3. Creating reminder with SPECIFIC date..."
SPECIFIC_DATE="2026-04-20T18:30:45.000Z"
echo "   Target remind_at: $SPECIFIC_DATE"

REMINDER_RESPONSE=$(curl -s -X POST "http://localhost:4001/api/v1/decisions/$DECISION_ID/reminders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"remind_at\": \"$SPECIFIC_DATE\",
    \"timezone\": \"Europe/Rome\"
  }")

echo "   Response: $REMINDER_RESPONSE"
echo ""

# Extract remind_at from response
ACTUAL_REMIND_AT=$(echo $REMINDER_RESPONSE | grep -o '"remind_at":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACTUAL_REMIND_AT" ]; then
  echo "❌ Failed to extract remind_at from response"
  exit 1
fi

echo "   Actual remind_at: $ACTUAL_REMIND_AT"
echo ""

# VERIFY
echo "4. VERIFICATION:"
echo "   Expected: $SPECIFIC_DATE"
echo "   Actual:   $ACTUAL_REMIND_AT"
echo ""

if [ "$SPECIFIC_DATE" = "$ACTUAL_REMIND_AT" ]; then
  echo "   Match: ✅ YES"
  echo ""

  # Check if it's a default/random date
  if echo "$ACTUAL_REMIND_AT" | grep -E "(1970|2000|2001)" > /dev/null; then
    echo "   ❌ FAIL: Contains default/random date pattern!"
    exit 1
  fi

  echo "   ✅ No default/random date detected"
  echo ""
  echo "✅✅✅ Feature #74 PASSED ✅✅✅"
  echo "   - Reminder uses EXACT specified date"
  echo "   - No default or random dates used"
  echo "   - remind_at matches user input exactly"
  echo ""
  echo "View in UI: http://localhost:5173/decisions/$DECISION_ID"
else
  echo "   Match: ❌ NO"
  echo ""
  echo "❌❌❌ Feature #74 FAILED ❌❌❌"
  exit 1
fi
