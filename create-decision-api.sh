#!/bin/bash

# Login to get token
RESPONSE=$(curl -s -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"f96-test-1768888401473@example.com","password":"Test1234!"}')

TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Create decision with emotional state
TIMESTAMP=$(date +%s%N)
curl -s -X POST http://localhost:4001/api/v1/decisions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"F78 Test - Anxious Decision - $TIMESTAMP\",
    \"transcript\": \"I feel anxious about this decision.\",
    \"status\": \"decided\",
    \"emotionalState\": \"anxious\",
    \"recordedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
    \"decidedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
  }"

echo ""
echo "Created decision with timestamp: $TIMESTAMP"
