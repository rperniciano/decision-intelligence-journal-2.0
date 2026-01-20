#!/bin/bash

# Get auth token for f61test user
echo "Getting auth token..."
TOKEN=$(curl -s -X POST 'http://localhost:4001/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "f61test@example.com",
    "password": "test123456"
  }' | jq -r '.token // .access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token: ${TOKEN:0:50}..."

# Get a category
echo "Getting categories..."
CATEGORY_ID=$(curl -s 'http://localhost:4001/api/v1/categories' \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id // empty')

if [ -z "$CATEGORY_ID" ]; then
  echo "Failed to get category"
  exit 1
fi

echo "Category ID: $CATEGORY_ID"

# Create DECISION_A
echo "Creating DECISION_A..."
DECISION_A=$(curl -s -X POST 'http://localhost:4001/api/v1/decisions' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"title\": \"DECISION_A - Test Feature 61\",
    \"category_id\": \"$CATEGORY_ID\"
  }")

DECISION_A_ID=$(echo $DECISION_A | jq -r '.id // empty')

if [ -z "$DECISION_A_ID" ]; then
  echo "Failed to create DECISION_A"
  echo $DECISION_A
  exit 1
fi

echo "DECISION_A ID: $DECISION_A_ID"

# Create DECISION_B
echo "Creating DECISION_B..."
DECISION_B=$(curl -s -X POST 'http://localhost:4001/api/v1/decisions' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"title\": \"DECISION_B - Test Feature 61\",
    \"category_id\": \"$CATEGORY_ID\"
  }")

DECISION_B_ID=$(echo $DECISION_B | jq -r '.id // empty')

if [ -z "$DECISION_B_ID" ]; then
  echo "Failed to create DECISION_B"
  echo $DECISION_B
  exit 1
fi

echo "DECISION_B ID: $DECISION_B_ID"

# Create outcome for DECISION_A only
echo "Creating outcome for DECISION_A..."
OUTCOME=$(curl -s -X POST "http://localhost:4001/api/v1/decisions/$DECISION_A_ID/outcomes" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "satisfaction_level": 7,
    "outcome_text": "This outcome should only appear on DECISION_A",
    "would_choose_same_option": true
  }')

echo ""
echo "=== Test Data Created Successfully ==="
echo ""
echo "Login credentials:"
echo "  Email: f61test@example.com"
echo "  Password: test123456"
echo ""
echo "Test URLs:"
echo "  DECISION_A: http://localhost:5190/decisions/$DECISION_A_ID"
echo "  DECISION_B: http://localhost:5190/decisions/$DECISION_B_ID"
echo ""
echo "Test Steps:"
echo "1. Navigate to DECISION_A"
echo "2. Verify outcome appears: 'This outcome should only appear on DECISION_A'"
echo "3. Navigate to DECISION_B"
echo "4. Verify NO outcome appears"
