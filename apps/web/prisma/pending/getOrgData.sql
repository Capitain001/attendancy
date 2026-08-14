CREATE OR REPLACE FUNCTION get_user_organization_data_by_org_id(org_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  logo text,
  domain text,
  permissions json,
  responsable json,
  settings json
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo,
    o.domain,
    -- Permissions agrégées
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id', p.id,
          'action', p.action,
          'resource', p.resource,
          'resourceId', p."resourceId",
          'description', p.description,
          'isActive', p."isActive",
          'expiresAt', p."expiresAt",
          'details', p.details
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::json
    ) as permissions,
    -- Responsable de l'organisation
    COALESCE(
      (
        SELECT json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'avatar_url', u.avatar_url,
          'role', uo.role
        )
        FROM "UserOrganization" uo
        JOIN "User" u ON u.id = uo."userId"
        WHERE uo."orgId" = o.id 
          AND uo."isResponsable" = true
          -- SUPPRIMÉ: AND uo."deletedAt" IS NULL
          AND u."deletedAt" IS NULL
        LIMIT 1
      ),
      '{}'::json
    ) as responsable,
    -- Settings de l'organisation
    COALESCE(
      json_build_object(
        'id', os.id,
        'maxUsers', os."maxUsers",
        'storageLimit', os."storageLimit",
        'maxCourses', os."maxCourses",
        'maxRooms', os."maxRooms",
        'maxClasses', os."maxClasses",
        'timezone', os.timezone,
        'currency', os.currency,
        'language', os.language,
        'parentalNotifications', os."parentalNotifications",
        'smsNotifications', os."smsNotifications",
        'emailNotifications', os."emailNotifications",
        'breakDuration', os."breakDuration",
        'settings', os.settings
      ),
      '{}'::json
    ) as settings
    
  FROM "Organization" o
  LEFT JOIN "Permission" p ON p."organizationId" = o.id 
    AND p."isActive" = true 
    AND (p."expiresAt" IS NULL OR p."expiresAt" > NOW())
    -- Pas de condition sur deletedAt pour Permission
  LEFT JOIN "OrganizationSettings" os ON os."organizationId" = o.id
  WHERE o.id = org_id
    AND o."deletedAt" IS NULL
    AND o."isActive" = true
  GROUP BY 
    o.id, 
    o.name, 
    o.slug, 
    o.logo, 
    o.domain,
    os.id,
    os."maxUsers",
    os."storageLimit",
    os."maxCourses",
    os."maxRooms",
    os."maxClasses",
    os.timezone,
    os.currency,
    os.language,
    os."parentalNotifications",
    os."smsNotifications",
    os."emailNotifications",
    os."breakDuration",
    os.settings;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_user_organization_data_by_org_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_data_by_org_id TO anon;

SELECT * FROM get_user_organization_data_by_org_id("")