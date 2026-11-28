-- Keep is_main_admin() unavailable to anon. Policies for public visitors
-- must not invoke this privileged helper; authenticated policies may.

DROP POLICY IF EXISTS properties_read_approved ON public.properties;
CREATE POLICY properties_read_approved_anon
ON public.properties
FOR SELECT TO anon
USING (status = 'approved');

CREATE POLICY properties_read_approved_authenticated
ON public.properties
FOR SELECT TO authenticated
USING (
  status = 'approved'
  OR owner_id = (SELECT auth.uid())
  OR (SELECT public.is_main_admin())
);

DROP POLICY IF EXISTS property_amenities_read ON public.property_amenities;
CREATE POLICY property_amenities_read_anon
ON public.property_amenities
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_amenities.property_id
      AND p.status = 'approved'
  )
);

CREATE POLICY property_amenities_read_authenticated
ON public.property_amenities
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_amenities.property_id
      AND (
        p.status = 'approved'
        OR p.owner_id = (SELECT auth.uid())
        OR (SELECT public.is_main_admin())
      )
  )
);

DROP POLICY IF EXISTS property_images_read ON public.property_images;
CREATE POLICY property_images_read_anon
ON public.property_images
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_images.property_id
      AND p.status = 'approved'
  )
);

CREATE POLICY property_images_read_authenticated
ON public.property_images
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_images.property_id
      AND (
        p.status = 'approved'
        OR p.owner_id = (SELECT auth.uid())
        OR (SELECT public.is_main_admin())
      )
  )
);

DROP POLICY IF EXISTS business_images_read_authorized ON storage.objects;
CREATE POLICY business_images_read_approved_anon
ON storage.objects
FOR SELECT TO anon
USING (
  bucket_id = 'business-images'
  AND EXISTS (
    SELECT 1
    FROM public.local_businesses b
    WHERE b.id::text = (storage.foldername(objects.name))[2]
      AND b.owner_id::text = (storage.foldername(objects.name))[1]
      AND b.status = 'approved'
  )
);

CREATE POLICY business_images_read_authorized_authenticated
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'business-images'
  AND (
    EXISTS (
      SELECT 1
      FROM public.local_businesses b
      WHERE b.id::text = (storage.foldername(objects.name))[2]
        AND b.owner_id::text = (storage.foldername(objects.name))[1]
        AND b.status = 'approved'
    )
    OR EXISTS (
      SELECT 1
      FROM public.local_businesses b
      WHERE b.id::text = (storage.foldername(objects.name))[2]
        AND b.owner_id = (SELECT auth.uid())
        AND (storage.foldername(objects.name))[1] = (SELECT auth.uid())::text
    )
    OR (SELECT public.is_main_admin())
  )
);

DROP POLICY IF EXISTS property_images_signed_read ON storage.objects;
CREATE POLICY property_images_signed_read_anon
ON storage.objects
FOR SELECT TO anon
USING (
  bucket_id = 'property-images'
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id::text = (storage.foldername(objects.name))[2]
      AND (storage.foldername(objects.name))[1] = p.owner_id::text
      AND p.status = 'approved'
  )
);

CREATE POLICY property_images_signed_read_authenticated
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'property-images'
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id::text = (storage.foldername(objects.name))[2]
      AND (storage.foldername(objects.name))[1] = p.owner_id::text
      AND (
        p.status = 'approved'
        OR p.owner_id = (SELECT auth.uid())
        OR (SELECT public.is_main_admin())
      )
  )
);
