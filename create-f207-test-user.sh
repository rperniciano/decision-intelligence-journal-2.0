#!/bin/bash
# Create test user with auto-confirmation
email="f207-test-$(date +%s)@example.com"
password="test123456"

node << 'JS_END'
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .env file
const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const env = {};

for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const email = `f207-test-${Date.now()}@example.com`;
const password = 'test123456';

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log(email);
console.log(password);
console.log(data.user.id);
JS_END
