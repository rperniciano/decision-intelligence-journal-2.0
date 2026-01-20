#!/bin/bash

# Test Feature #184 after API restart
# Create decision and mark as decided to trigger automatic reminder

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

# Create a new decision
echo ""
echo "Creating decision..."
DECISION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/decisions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "TEST_F184 After Restart",
    "status": "draft"
  }')

DECISION_ID=$(echo $DECISION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Decision created: $DECISION_ID"

# Update status to 'decided'
echo ""
echo "Updating status to 'decided'..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/api/v1/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "decided"
  }')

echo "Update response: $UPDATE_RESPONSE"

# Check database directly
echo ""
echo "Checking database for reminder..."
echo "Decision ID: $DECISION_ID"
