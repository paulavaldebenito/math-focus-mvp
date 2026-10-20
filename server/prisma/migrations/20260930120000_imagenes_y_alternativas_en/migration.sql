-- Ilustración SVG por idioma del banco de imágenes por curso, y traducción
-- al inglés de las alternativas textuales. Ambas opcionales: NULL conserva
-- la representación actual (visual) y cae de vuelta a `label` en español.
ALTER TABLE "Exercise" ADD COLUMN "image" JSONB;
ALTER TABLE "ExerciseOption" ADD COLUMN "labelEn" TEXT;
