#!/bin/bash

# Query Supabase for feature 203 using curl
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/get_feature_by_id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"feature_id": 203}' 2>/dev/null | jq .
