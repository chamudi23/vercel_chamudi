-- Storage location access for the Minuri management pages.
-- Run after access_control/01_identity_and_roles.sql.

ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active storage locations"
    ON public.storage_locations;
DROP POLICY IF EXISTS "read_authenticated" ON public.storage_locations;
DROP POLICY IF EXISTS "insert_curator" ON public.storage_locations;
DROP POLICY IF EXISTS "update_curator" ON public.storage_locations;
DROP POLICY IF EXISTS "delete_curator" ON public.storage_locations;

CREATE POLICY "read_authenticated" ON public.storage_locations
    FOR SELECT TO authenticated
    USING ((SELECT public.is_active_user()));

CREATE POLICY "insert_curator" ON public.storage_locations
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.can_write_records()));

CREATE POLICY "update_curator" ON public.storage_locations
    FOR UPDATE TO authenticated
    USING ((SELECT public.can_write_records()))
    WITH CHECK ((SELECT public.can_write_records()));

CREATE POLICY "delete_curator" ON public.storage_locations
    FOR DELETE TO authenticated
    USING ((SELECT public.can_write_records()));
