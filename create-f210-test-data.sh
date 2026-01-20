#!/bin/bash

# Test script for Feature #210: Confidence vs Outcome Correlation
# Creates test decisions with different confidence levels and outcomes

echo "=== Feature #210 Test Data: Confidence vs Outcome Correlation ==="
echo ""

# Get first user_id from profiles table
USER_ID=$(psql "$DATABASE_URL" -t -c "SELECT user_id FROM profiles LIMIT 1;" 2>/dev/null | tr -d ' ')

if [ -z "$USER_ID" ]; then
    echo "No users found. Please create a user first."
    exit 1
fi

echo "Using user ID: $USER_ID"

# Create a category for test decisions
CATEGORY_ID=$(uuidgen)
psql "$DATABASE_URL" -c "
INSERT INTO categories (id, user_id, name, color, created_at)
VALUES ('$CATEGORY_ID', '$USER_ID', 'F210 Confidence Test', '#00d4aa', NOW());
" 2>/dev/null

echo "Created category: $CATEGORY_ID"
echo ""
echo "Creating 11 test decisions..."
echo ""

# Low confidence decisions (1-2): 50% success (2/4)
psql "$DATABASE_URL" -q <<EOF
INSERT INTO decisions (id, user_id, title, category_id, emotional_state, confidence_level, outcome, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '$USER_ID', 'F210 Low Confidence #1 - BAD', '$CATEGORY_ID', 'uncertain', 1, 'worse', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 Low Confidence #2 - BAD', '$CATEGORY_ID', 'anxious', 2, 'worse', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 Low Confidence #3 - GOOD', '$CATEGORY_ID', 'uncertain', 2, 'better', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 Low Confidence #4 - GOOD', '$CATEGORY_ID', 'neutral', 1, 'better', 'reviewed', NOW(), NOW());
EOF

echo "  1-4. Low confidence decisions (50% success rate)"

# Medium confidence decisions (3): 67% success (2/3)
psql "$DATABASE_URL" -q <<EOF
INSERT INTO decisions (id, user_id, title, category_id, emotional_state, confidence_level, outcome, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '$USER_ID', 'F210 Medium Confidence #1 - BAD', '$CATEGORY_ID', 'neutral', 3, 'worse', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 Medium Confidence #2 - GOOD', '$CATEGORY_ID', 'calm', 3, 'better', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 Medium Confidence #3 - GOOD', '$CATEGORY_ID', 'neutral', 3, 'better', 'reviewed', NOW(), NOW());
EOF

echo "  5-7. Medium confidence decisions (67% success rate)"

# High confidence decisions (4-5): 100% success (4/4)
psql "$DATABASE_URL" -q <<EOF
INSERT INTO decisions (id, user_id, title, category_id, emotional_state, confidence_level, outcome, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '$USER_ID', 'F210 High Confidence #1 - GOOD', '$CATEGORY_ID', 'confident', 5, 'better', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 High Confidence #2 - GOOD', '$CATEGORY_ID', 'confident', 4, 'better', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 High Confidence #3 - GOOD', '$CATEGORY_ID', 'confident', 5, 'better', 'reviewed', NOW(), NOW()),
  (gen_random_uuid(), '$USER_ID', 'F210 High Confidence #4 - GOOD', '$CATEGORY_ID', 'confident', 4, 'better', 'reviewed', NOW(), NOW());
EOF

echo "  8-11. High confidence decisions (100% success rate)"

echo ""
echo "✅ Successfully created 11 test decisions"
echo ""
echo "Expected correlation pattern:"
echo "  - Low confidence (1-2): 50% success rate (2/4)"
echo "  - Medium confidence (3): 67% success rate (2/3)"
echo "  - High confidence (4-5): 100% success rate (4/4)"
echo "  - Correlation: POSITIVE (higher confidence → better outcomes)"
echo ""
echo "Test data ready for Feature #210 verification!"
echo ""
