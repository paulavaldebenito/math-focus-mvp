-- AlterTable
ALTER TABLE "ErrorType" ADD COLUMN "level" INTEGER;

-- Renombra en el lugar (mismo id) los 5 códigos de error de contenido al
-- modelo por nivel inspirado en matefriendly (1=conceptual,
-- 2=procedimental, 3=lectura/comprensión). Los ids no cambian, así que las
-- referencias existentes en "ExerciseOption"."errorTypeId" siguen siendo
-- válidas sin necesidad de tocarlas. Los 3 códigos de comportamiento
-- (respuesta_rapida/abandono/solicitud_ayuda_repetida) no se tocan.
UPDATE "ErrorType" SET
  "code" = 'E1_OP',
  "level" = 1,
  "label" = 'Confusión de operación',
  "description" = 'No identifica correctamente qué operación (suma o resta) corresponde usar.'
WHERE "code" = 'conceptual';

UPDATE "ErrorType" SET
  "code" = 'E2_RES',
  "level" = 2,
  "label" = 'Error de reagrupación/procedimiento',
  "description" = 'Entiende la idea, pero se equivoca al pedir prestado, reagrupar o seguir el procedimiento.'
WHERE "code" = 'procedimiento';

UPDATE "ErrorType" SET
  "code" = 'E2_CAL',
  "level" = 2,
  "label" = 'Error de cálculo puntual',
  "description" = 'El procedimiento es correcto, pero hay un error aritmético puntual.'
WHERE "code" = 'calculo';

UPDATE "ErrorType" SET
  "code" = 'E3_PREG',
  "level" = 3,
  "label" = 'No responde lo que se pregunta',
  "description" = 'No interpreta correctamente qué pide la pregunta del enunciado.'
WHERE "code" = 'comprension_enunciado';

UPDATE "ErrorType" SET
  "code" = 'E3_DATO',
  "level" = 3,
  "label" = 'Uso incorrecto de un dato del enunciado',
  "description" = 'No usa correctamente un dato relevante del enunciado (lo omite o lo cambia).'
WHERE "code" = 'omision';
