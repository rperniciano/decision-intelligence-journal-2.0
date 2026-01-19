#!/bin/bash

echo "Testing Feature #213: Satisfaction rating validation"
echo "=================================================="

echo ""
echo "Test 1: Satisfaction = 10 (should fail - above range)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","satisfaction":10,"notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "Test 2: Satisfaction = 0 (should fail - below range)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","satisfaction":0,"notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "Test 3: Satisfaction = 3.5 (should fail - not integer)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","satisfaction":3.5,"notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "Test 4: Satisfaction = 5 (should pass - valid max)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","satisfaction":5,"notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "Test 5: Satisfaction = 1 (should pass - valid min)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","satisfaction":1,"notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "Test 6: Satisfaction not provided (should pass - optional)"
curl -s -X POST http://localhost:4002/api/v1/decisions/test-id/outcomes \
  -H "Content-Type: application/json" \
  -d '{"result":"better","notes":"Test"}' \
  | head -c 200
echo ""
echo ""

echo "=================================================="
echo "Testing complete!"
