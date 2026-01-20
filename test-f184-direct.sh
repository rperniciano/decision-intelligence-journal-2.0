#!/bin/bash

# Direct test - create a NEW decision and mark it as decided
# This will trigger the code path in the currently running API server

API_URL="http://localhost:4001"

# Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testf184_1768922904616@example.com",
    "password": "test123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Token obtained"

# Create a NEW decision with status "draft"
echo ""
echo "Creating NEW decision with status=draft..."
DECISION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/decisions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "TEST_F184 Direct API Test Final",
    "status": "draft"
  }')

DECISION_ID=$(echo $DECISION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Decision created: $DECISION_ID"
echo "Status: draft"

# Now UPDATE to "decided" - this should trigger automatic reminder creation
echo ""
echo "Updating status to 'decided' (should trigger automatic reminder)..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/api/v1/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "decided"
  }')

echo "Update response received"

# Output the decision ID for the database check script
echo ""
echo "=========================================="
echo "Decision ID for verification: $DECISION_ID"
echo "=========================================="
