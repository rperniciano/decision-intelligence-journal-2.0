"""
Test script for Feature #210: Confidence vs Outcome Correlation

Creates test decisions with different confidence levels and outcomes
to verify the confidence correlation pattern is calculated correctly.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

print("=== Feature #210 Test Data: Confidence vs Outcome Correlation ===\n")

# Get a test user
users = supabase.table('profiles').select('user_id').limit(1).execute()

if not users.data:
    print("No users found. Please create a user first.")
    sys.exit(1)

user_id = users.data[0]['user_id']
print(f"Using user ID: {user_id}")

# Create a category for test decisions
category = supabase.table('categories').insert({
    'user_id': user_id,
    'name': 'F210 Confidence Test',
    'color': '#00d4aa',
}).select().execute().data[0]

category_id = category['id']
print(f"Created category: {category_id}")

# Test data: Decisions with confidence levels and outcomes
# Pattern: Low confidence = 50% success, High confidence = 100% success (positive correlation)
test_decisions = [
    {
        'title': 'F210 Low Confidence #1 - BAD',
        'category': category_id,
        'emotional_state': 'uncertain',
        'confidence_level': 1,  # LOW
        'outcome': 'worse',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Low Confidence #2 - BAD',
        'category': category_id,
        'emotional_state': 'anxious',
        'confidence_level': 2,  # LOW
        'outcome': 'worse',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Low Confidence #3 - GOOD',
        'category': category_id,
        'emotional_state': 'uncertain',
        'confidence_level': 2,  # LOW
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Low Confidence #4 - GOOD',
        'category': category_id,
        'emotional_state': 'neutral',
        'confidence_level': 1,  # LOW
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Medium Confidence #1 - BAD',
        'category': category_id,
        'emotional_state': 'neutral',
        'confidence_level': 3,  # MEDIUM
        'outcome': 'worse',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Medium Confidence #2 - GOOD',
        'category': category_id,
        'emotional_state': 'calm',
        'confidence_level': 3,  # MEDIUM
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 Medium Confidence #3 - GOOD',
        'category': category_id,
        'emotional_state': 'neutral',
        'confidence_level': 3,  # MEDIUM
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 High Confidence #1 - GOOD',
        'category': category_id,
        'emotional_state': 'confident',
        'confidence_level': 5,  # HIGH
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 High Confidence #2 - GOOD',
        'category': category_id,
        'emotional_state': 'confident',
        'confidence_level': 4,  # HIGH
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 High Confidence #3 - GOOD',
        'category': category_id,
        'emotional_state': 'confident',
        'confidence_level': 5,  # HIGH
        'outcome': 'better',
        'status': 'reviewed',
    },
    {
        'title': 'F210 High Confidence #4 - GOOD',
        'category': category_id,
        'emotional_state': 'confident',
        'confidence_level': 4,  # HIGH
        'outcome': 'better',
        'status': 'reviewed',
    },
]

print(f"\nCreating {len(test_decisions)} test decisions...\n")

created_count = 0
for decision in test_decisions:
    try:
        result = supabase.table('decisions').insert({
            'user_id': user_id,
            'title': decision['title'],
            'category_id': decision['category'],
            'emotional_state': decision['emotional_state'],
            'confidence_level': decision['confidence_level'],
            'outcome': decision['outcome'],
            'status': decision['status'],
        }).execute()

        created_count += 1
        confidence_label = 'LOW' if decision['confidence_level'] <= 2 else 'MED' if decision['confidence_level'] == 3 else 'HIGH'
        outcome_label = '✓' if decision['outcome'] == 'better' else '✗'
        print(f"  {created_count}. {decision['title']}")
        print(f"     Confidence: {decision['confidence_level']}/5 ({confidence_label}) | Outcome: {decision['outcome']} {outcome_label}")
    except Exception as e:
        print(f"Error creating '{decision['title']}': {e}")

print(f"\n✅ Successfully created {created_count}/{len(test_decisions)} test decisions")
print('\nExpected correlation pattern:')
print('  - Low confidence (1-2): 50% success rate (2/4)')
print('  - Medium confidence (3): 67% success rate (2/3)')
print('  - High confidence (4-5): 100% success rate (4/4)')
print('  - Correlation: POSITIVE (higher confidence → better outcomes)')
print('\nTest data ready for Feature #210 verification!\n')
