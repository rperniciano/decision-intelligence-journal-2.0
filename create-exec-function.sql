-- Create a helper function to execute arbitrary SQL
-- Run this ONCE in Supabase SQL Editor to enable programmatic migrations

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
