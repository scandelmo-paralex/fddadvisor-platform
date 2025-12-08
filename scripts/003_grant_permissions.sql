-- Grant full permissions to authenticated users for all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant full permissions to anon users (needed for signup/public access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Reload the PostgREST schema cache multiple times to ensure it takes effect
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
