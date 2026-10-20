-- Nombre propio por mascota: al cambiar de mascota y volver, se recupera el
-- nombre que el niño ya le había puesto. Solo aditivo.
ALTER TABLE "ChildProfile" ADD COLUMN "mascotNames" JSONB NOT NULL DEFAULT '{}';

-- Respaldo: el nombre actual queda guardado para la mascota actual.
UPDATE "ChildProfile"
SET "mascotNames" = jsonb_build_object("companion", "mascotName")
WHERE "companion" IS NOT NULL AND "mascotName" IS NOT NULL;
