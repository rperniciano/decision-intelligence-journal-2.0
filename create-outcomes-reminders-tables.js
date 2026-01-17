const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('Creating outcomes and outcome_reminders tables...');

  // Create outcomes table
  const { error: outcomesError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Outcomes table
      CREATE TABLE IF NOT EXISTS outcomes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
        result VARCHAR(20) NOT NULL CHECK (result IN ('better', 'as_expected', 'worse')),
        satisfaction SMALLINT CHECK (satisfaction >= 1 AND satisfaction <= 5),
        reflection_audio_url TEXT,
        reflection_transcript TEXT,
        learned TEXT,
        scheduled_for DATE,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        check_in_number SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON outcomes(decision_id);

      -- Enable Row Level Security
      ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own outcomes" ON outcomes;
      DROP POLICY IF EXISTS "Users can create own outcomes" ON outcomes;
      DROP POLICY IF EXISTS "Users can update own outcomes" ON outcomes;
      DROP POLICY IF EXISTS "Users can delete own outcomes" ON outcomes;

      -- RLS Policies: Users can only access outcomes for their own decisions
      CREATE POLICY "Users can view own outcomes"
        ON outcomes FOR SELECT
        USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

      CREATE POLICY "Users can create own outcomes"
        ON outcomes FOR INSERT
        WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

      CREATE POLICY "Users can update own outcomes"
        ON outcomes FOR UPDATE
        USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

      CREATE POLICY "Users can delete own outcomes"
        ON outcomes FOR DELETE
        USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

      -- Outcome reminders table
      CREATE TABLE IF NOT EXISTS outcome_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        remind_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'skipped')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Create index for faster queries on pending reminders
      CREATE INDEX IF NOT EXISTS idx_reminders_pending ON outcome_reminders(remind_at) WHERE status = 'pending';
      CREATE INDEX IF NOT EXISTS idx_reminders_user ON outcome_reminders(user_id, status);

      -- Enable Row Level Security
      ALTER TABLE outcome_reminders ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own reminders" ON outcome_reminders;
      DROP POLICY IF EXISTS "Users can create own reminders" ON outcome_reminders;
      DROP POLICY IF EXISTS "Users can update own reminders" ON outcome_reminders;
      DROP POLICY IF EXISTS "Users can delete own reminders" ON outcome_reminders;

      -- RLS Policies: Users can only access their own reminders
      CREATE POLICY "Users can view own reminders"
        ON outcome_reminders FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can create own reminders"
        ON outcome_reminders FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own reminders"
        ON outcome_reminders FOR UPDATE
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own reminders"
        ON outcome_reminders FOR DELETE
        USING (auth.uid() = user_id);
    `
  });

  if (outcomesError) {
    // Try direct SQL execution if RPC doesn't exist
    const queries = [
      `CREATE TABLE IF NOT EXISTS outcomes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
        result VARCHAR(20) NOT NULL CHECK (result IN ('better', 'as_expected', 'worse')),
        satisfaction SMALLINT CHECK (satisfaction >= 1 AND satisfaction <= 5),
        reflection_audio_url TEXT,
        reflection_transcript TEXT,
        learned TEXT,
        scheduled_for DATE,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        check_in_number SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON outcomes(decision_id)`,
      `ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY`,
      `CREATE TABLE IF NOT EXISTS outcome_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        remind_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'skipped')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_reminders_pending ON outcome_reminders(remind_at) WHERE status = 'pending'`,
      `CREATE INDEX IF NOT EXISTS idx_reminders_user ON outcome_reminders(user_id, status)`,
      `ALTER TABLE outcome_reminders ENABLE ROW LEVEL SECURITY`
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`Error executing query: ${error.message}`);
        console.error(`Query: ${query.substring(0, 100)}...`);
      }
    }
  }

  console.log('✓ Tables created successfully');
}

createTables().catch(console.error);
