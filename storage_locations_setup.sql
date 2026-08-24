-- ================================================================
-- OAHRIS - Storage Locations
-- ================================================================
-- Run this script in the Supabase SQL Editor before using the
-- Storage Location dropdown in SpecimenFormPage.jsx.
--
-- location_stored in the specimens table remains text for backwards
-- compatibility. The frontend stores the generated display_label there.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.storage_locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code   VARCHAR(50) NOT NULL,
    lab_no          VARCHAR(50) NOT NULL,
    shelf_no        VARCHAR(50) NOT NULL,
    display_label   TEXT GENERATED ALWAYS AS (
        location_code || ' | Lab ' || lab_no || ' | Shelf ' || shelf_no
    ) STORED,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT storage_locations_unique_slot
        UNIQUE (location_code, lab_no, shelf_no)
);

COMMENT ON TABLE public.storage_locations IS
    'Available OAHRIS specimen storage locations.';
COMMENT ON COLUMN public.storage_locations.location_code IS
    'Collection or institution location, for example PGIAR.';
COMMENT ON COLUMN public.storage_locations.lab_no IS
    'Laboratory identifier within the collection location.';
COMMENT ON COLUMN public.storage_locations.shelf_no IS
    'Shelf or storage-slot identifier within the laboratory.';

-- Ten starter slots. All examples use PGIAR as requested.
INSERT INTO public.storage_locations
    (location_code, lab_no, shelf_no, description)
VALUES
    ('PGIAR', 'LAB-01', 'A-01', 'Osteology laboratory - cabinet A'),
    ('PGIAR', 'LAB-01', 'A-02', 'Osteology laboratory - cabinet A'),
    ('PGIAR', 'LAB-01', 'A-03', 'Osteology laboratory - cabinet A'),
    ('PGIAR', 'LAB-01', 'B-01', 'Osteology laboratory - cabinet B'),
    ('PGIAR', 'LAB-01', 'B-02', 'Osteology laboratory - cabinet B'),
    ('PGIAR', 'LAB-02', 'A-01', 'Research laboratory - cabinet A'),
    ('PGIAR', 'LAB-02', 'A-02', 'Research laboratory - cabinet A'),
    ('PGIAR', 'LAB-02', 'B-01', 'Research laboratory - cabinet B'),
    ('PGIAR', 'LAB-03', 'C-01', 'Imaging laboratory - cabinet C'),
    ('PGIAR', 'LAB-03', 'C-02', 'Imaging laboratory - cabinet C')
ON CONFLICT (location_code, lab_no, shelf_no) DO NOTHING;

-- Enable read access for the frontend's Supabase client.
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active storage locations"
    ON public.storage_locations;
CREATE POLICY "Allow public read access to active storage locations"
    ON public.storage_locations
    FOR SELECT
    USING (is_active = true);
