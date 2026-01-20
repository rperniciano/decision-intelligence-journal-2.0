#!/bin/bash

# Test Feature #184: Automatic reminder creation
# This script creates a decision and marks it as "decided" to test automatic reminders

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
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Create a decision
echo ""
echo "Creating decision..."
DECISION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/decisions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "TEST_F184 Auto Reminder Decision",
    "status": "deliberating",
    "category": "Testing",
    "emotional_state": "curious"
  }')

DECISION_ID=$(echo $DECISION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$DECISION_ID" ]; then
  echo "Failed to create decision"
  echo "Response: $DECISION_RESPONSE"
  exit 1
fi

echo "Decision created: $DECISION_ID"

# Add options
echo ""
echo "Adding options..."

curl -s -X POST "$API_URL/api/v1/decisions/$DECISION_ID/options" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Option A"}' > /dev/null

curl -s -X POST "$API_URL/api/v1/decisions/$DECISION_ID/options" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Option B"}' > /dev/null

echo "Options added"

# Get option IDs
OPTIONS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/decisions/$DECISION_ID/options" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "Options: $OPTIONS_RESPONSE"

# Extract first option ID
OPTION_ID=$(echo $OPTIONS_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

echo ""
echo "Using option ID: $OPTION_ID"

# Now mark the decision as decided by choosing an option
echo ""
echo "Marking decision as decided (choosing option)..."

CHOOSE_RESPONSE=$(curl -s -X PATCH "$API_URL/api/v1/decisions/$DECISION_ID/options/$OPTION_ID/choose" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $CHOOSE_RESPONSE"

# Check for reminders
echo ""
echo "Checking for automatic reminders..."
REMINDERS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/decisions/$DECISION_ID/reminders" \
  -H "Authorization: Bearer $TOKEN")

echo "Reminders: $REMINDERS_RESPONSE"

# Check if reminder was created
if echo "$REMINDERS_RESPONSE" | grep -q '"reminders":\s*\['; then
  REMINDER_COUNT=$(echo "$REMINDERS_RESPONSE" | grep -o '"reminders"' | wc -l)
  echo ""
  echo "=========================================="
  echo "Feature #184 Test Result:"
  echo "=========================================="
  if echo "$REMINDERS_RESPONSE" | grep -q '"reminders":\s*\[\s*\]'; then
    echo "❌ FAILED: No reminders created"
  else
    echo "✅ SUCCESS: Automatic reminder created!"
    echo ""
    echo "Reminder details:"
    echo "$REMINDERS_RESPONSE" | grep -o '"remind_at":"[^"]*' | cut -d'"' -f4
  fi
  echo "=========================================="
else
  echo "⚠️  Could not parse reminders response"
fi
