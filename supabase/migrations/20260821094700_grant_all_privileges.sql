-- Grant read-only access on public tables to anon, and full CRUD (subject to RLS) to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
REVOKE ALL ON public.admin_user_profiles FROM anon, public;
REVOKE ALL ON public.activity_logs_with_users FROM anon, public;
