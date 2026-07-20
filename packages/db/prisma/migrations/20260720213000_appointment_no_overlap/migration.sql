-- Prevent a practitioner from holding two overlapping non-cancelled appointments
-- at the DB level (build-kit rule 9 — UI checks are not enough). Raw SQL: Prisma
-- cannot express exclusion constraints.
--
-- btree_gist is a trusted extension, so the non-superuser app role can create it.
-- startsAt/endsAt are `timestamp without time zone` (UTC), hence tsrange (not
-- tstzrange). Half-open range [start, end): back-to-back appointments don't clash.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "tenantId" WITH =,
    "practitionerId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status <> 'CANCELLED');
