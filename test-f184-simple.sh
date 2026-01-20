#!/bin/bash

# Simple test for Feature #184: Automatic reminder creation
# Test by updating decision status to "decided"

USER_ID="0c1f8cc8-ef76-4cb7-8684-c2911b1df590"
API_URL="http://localhost:4001"

# Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testf184_1768922904616@example.com",
    "password": "test123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# First, let's try to create a simple decision directly via the API
echo ""
echo "Creating simple decision..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/decisions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "TEST_F184 Simple Decision",
    "status": "draft"
  }')

echo "Create response: $CREATE_RESPONSE"

# Try to extract decision ID
DECISION_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$DECISION_ID" ]; then
  echo "Could not create decision, trying to get existing one..."
  # Get an existing decision instead
  GET_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/decisions?limit=1" \
    -H "Authorization: Bearer $TOKEN")

  DECISION_ID=$(echo $GET_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

  if [ -z "$DECISION_ID" ]; then
    echo "No decisions available"
    exit 1
  fi

  echo "Using existing decision: $DECISION_ID"
else
  echo "Decision created: $DECISION_ID"
fi

# Check if any reminders exist before
echo ""
echo "Checking reminders BEFORE status change..."
REMINDERS_BEFORE=$(curl -s -X GET "$API_URL/api/v1/decisions/$DECISION_ID/reminders" \
  -H "Authorization: Bearer $TOKEN")

echo "Reminders before: $REMINDERS_BEFORE"

# Update decision status to "decided"
echo ""
echo "Updating decision status to 'decided'..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/api/v1/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "decided"
  }')

echo "Update response: $UPDATE_RESPONSE"

# Check if reminder was created
echo ""
echo "Checking reminders AFTER status change..."
REMINDERS_AFTER=$(curl -s -X GET "$API_URL/api/v1/decisions/$DECISION_ID/reminders" \
  -H "Authorization: Bearer $TOKEN")

echo "Reminders after: $REMINDERS_AFTER"

# Test result
echo ""
echo "=========================================="
echo "Feature #184 Test Result:"
echo "=========================================="

if echo "$REMINDERS_AFTER" | grep -q '"remind_at"'; then
  echo "✅ SUCCESS: Automatic reminder created!"
  echo ""
  REMINDER_DATE=$(echo "$REMINDERS_AFTER" | grep -o '"remind_at":"[^"]*' | cut -d'"' -f4 | head -1)
  echo "Reminder scheduled for: $REMINDER_DATE"

  # Calculate expected date (14 days from now)
  EXPECTED_DATE=$(date -d "+14 days" +%Y-%m-%d)
  REMINDER_DATE_ONLY=$(echo $REMINDER_DATE | cut -d'T' -f1)

  if [ "$REMINDER_DATE_ONLY" = "$EXPECTED_DATE" ]; then
    echo "✅ Reminder date is correct (14 days from now)"
  else
    echo "⚠️  Reminder date: $REMINDER_DATE_ONLY"
    echo "   Expected: $EXPECTED_DATE"
  fi
else
  echo "❌ FAILED: No automatic reminder created"
fi
echo "=========================================="
