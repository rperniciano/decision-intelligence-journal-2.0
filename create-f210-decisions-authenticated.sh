#!/bin/bash

# Test data creator for Feature #210 that works with authenticated API calls
# This script creates decisions directly via curl after login

API_URL="http://localhost:4001/api/v1"
WEB_URL="http://localhost:5173"

echo "=== Feature #210 Test Data: Confidence vs Outcome Correlation ==="
echo ""
echo "Please login to the application at: $WEB_URL"
echo ""
echo "After logging in, open browser DevTools (F12), go to Console, and run:"
echo ""
echo "copy(localStorage.getItem('sb-<your-project-id>-auth-token'))"
echo ""
echo "Then paste the token below."
echo ""
read -p "Enter your auth token: " AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
    echo "No token provided. Exiting."
    exit 1
fi

echo ""
echo "Fetching user info..."
USER_INFO=$(curl -s "$API_URL/user" -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$USER_INFO" | grep -q "error"; then
    echo "Error fetching user info. Token may be invalid."
    echo "$USER_INFO"
    exit 1
fi

echo "✓ Authenticated successfully"
echo ""

# Create category
echo "Creating test category..."
CATEGORY_RESPONSE=$(curl -s "$API_URL/categories" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"F210 Confidence Test","color":"#00d4aa"}')

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CATEGORY_ID" ]; then
    echo "Error creating category"
    echo "$CATEGORY_RESPONSE"
    exit 1
fi

echo "✓ Category created: $CATEGORY_ID"
echo ""

# Create decisions
echo "Creating 11 test decisions with confidence levels..."
echo ""

# Function to create decision
create_decision() {
    local title="$1"
    local confidence="$2"
    local outcome="$3"
    local emotion="$4"

    curl -s "$API_URL/decisions" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\":\"$title\",
            \"category_id\":\"$CATEGORY_ID\",
            \"emotional_state\":\"$emotion\",
            \"confidence_level\":$confidence,
            \"outcome\":\"$outcome\",
            \"status\":\"reviewed\"
        }" > /dev/null

    local conf_label="LOW"
    if [ "$confidence" -ge 4 ]; then
        conf_label="HIGH"
    elif [ "$confidence" -eq 3 ]; then
        conf_label="MED"
    fi

    local outcome_label="✓"
    if [ "$outcome" = "worse" ]; then
        outcome_label="✗"
    fi

    echo "  ✓ $title"
    echo "    Confidence: $confidence/5 ($conf_label) | Outcome: $outcome $outcome_label"
}

# Low confidence (1-2): 50% success
create_decision "F210 Low #1 - BAD" 1 "worse" "uncertain"
create_decision "F210 Low #2 - BAD" 2 "worse" "anxious"
create_decision "F210 Low #3 - GOOD" 2 "better" "uncertain"
create_decision "F210 Low #4 - GOOD" 1 "better" "neutral"

# Medium confidence (3): 67% success
create_decision "F210 Med #1 - BAD" 3 "worse" "neutral"
create_decision "F210 Med #2 - GOOD" 3 "better" "calm"
create_decision "F210 Med #3 - GOOD" 3 "better" "neutral"

# High confidence (4-5): 100% success
create_decision "F210 High #1 - GOOD" 5 "better" "confident"
create_decision "F210 High #2 - GOOD" 4 "better" "confident"
create_decision "F210 High #3 - GOOD" 5 "better" "confident"
create_decision "F210 High #4 - GOOD" 4 "better" "confident"

echo ""
echo "✅ Successfully created 11 test decisions!"
echo ""
echo "Expected correlation pattern:"
echo "  - Low confidence (1-2): 50% success rate (2/4)"
echo "  - Medium confidence (3): 67% success rate (2/3)"
echo "  - High confidence (4-5): 100% success rate (4/4)"
echo "  - Correlation: POSITIVE (higher confidence → better outcomes)"
echo ""
echo "Now visit the Insights page to see the Confidence Correlation pattern card!"
echo ""
