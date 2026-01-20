// Direct PostgreSQL connection to create outcomes table
import pg from 'pg';
import { config } from 'dotenv';
config();

const { Client } = pg;

// Parse Supabase connection string
const supabaseUrl = process.env.SUPABASE_URL;
const dbName = supabaseUrl.match(/\/\/([^.]+)\./)[1];

// Connection string format from Supabase settings
const connectionString = `postgres://postgres.doqojfsldvajmlscpwhu:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function createOutcomesTable() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'outcomes'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Outcomes table already exists!');
      return;
    }

    console.log('Creating outcomes table...\n');

    // Create the table
    await client.query(`
      CREATE TABLE public.outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
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
    `);
    console.log('✅ Table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON public.outcomes(decision_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_outcomes_check_in ON public.outcomes(decision_id, check_in_number);`);
    console.log('✅ Indexes created');

    // Enable RLS
    await client.query(`ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS enabled');

    // Create policies
    await client.query(`
      CREATE POLICY "Users can view outcomes for own decisions"
      ON public.outcomes
      FOR SELECT
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );
    `);

    await client.query(`
      CREATE POLICY "Users can insert outcomes for own decisions"
      ON public.outcomes
      FOR INSERT
      WITH CHECK (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );
    `);

    await client.query(`
      CREATE POLICY "Users can update outcomes for own decisions"
      ON public.outcomes
      FOR UPDATE
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );
    `);

    await client.query(`
      CREATE POLICY "Users can delete outcomes for own decisions"
      ON public.outcomes
      FOR DELETE
      USING (
        decision_id IN (
          SELECT id FROM public.decisions WHERE user_id = auth.uid()
        )
      );
    `);
    console.log('✅ RLS policies created');

    console.log('\n✅ Outcomes table setup complete!');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '3D000') {
      console.error('\n❌ Database does not exist. Check your connection string.');
    }
  } finally {
    await client.end();
  }
}

createOutcomesTable().catch(console.error);
