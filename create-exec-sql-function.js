// Create exec_sql function in Supabase for running migrations
// This needs to be run manually in Supabase SQL Editor first

console.log(`
To enable migrations via code, run this SQL in Supabase SQL Editor:

------------------------------------------------------------
-- Create exec_sql function to allow DDL via RPC
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
------------------------------------------------------------

After running the above SQL, you can use exec_sql RPC to run migrations.
`);
