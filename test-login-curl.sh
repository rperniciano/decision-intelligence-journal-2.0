#!/bin/bash
curl -s http://localhost:4001/api/v1/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"f21usera@example.com","password":"F21TestPass123!"}'
